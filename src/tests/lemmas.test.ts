import assert from "node:assert/strict";
import { test } from "node:test";
import { AdaptedProvider, DeterministicProvider, reverseEachWordCorrect, reverseEntire } from "../deterministic.js";
import { applyValidator, decodeAction, gapSensitivityBound, perturbLogits, stepKernel } from "../kernel.js";
import { argmax, mulberry32, top2Gap } from "../rng.js";
import { CALCULATOR, WORD_REVERSE } from "../tasks.js";
import { createProvider, openRouterKey } from "../openrouter.js";
import { defaultControl } from "../types.js";
import { rollout } from "../experiments.js";
import { applyIntervention, chooseIntervention, observe } from "../observe.js";
import type { TrainerJob } from "../observe.js";

test("greedy collapse: τ=0, unique argmax, Dirac env/mem/ctrl ⇒ automaton", () => {
  const a = rollout(WORD_REVERSE, { seed: 1, temperature: 0 });
  const b = rollout(WORD_REVERSE, { seed: 99, temperature: 0 });
  assert.equal(a.steps[0]?.action.text, "reverse_entire");
  assert.equal(b.steps[0]?.action.text, "reverse_entire");
  assert.equal(a.outcome, b.outcome);
  assert.deepEqual(
    a.steps.map((s) => s.action.text),
    b.steps.map((s) => s.action.text),
  );
});

test("validator is a support restriction", () => {
  const logits = { invalid_x: 9, reverse_each_word: 2, reverse_entire: 1 };
  const restricted = applyValidator(logits, "valid-action");
  assert.equal(restricted.invalid_x, undefined);
  assert.ok(restricted.reverse_each_word !== undefined);
  const { actionKey } = decodeAction(logits, defaultControl({ temperature: 0, validator: "valid-action" }), mulberry32(0));
  assert.equal(actionKey, "reverse_each_word");
  assert.notEqual(actionKey, "invalid_x");
});

test("model / adapter swap is an f_θ jump", async () => {
  const naive = new DeterministicProvider("toy-naive");
  const adapted = new AdaptedProvider("adapted");
  const msgs = [
    { role: "system" as const, content: "Role: solve" },
    { role: "user" as const, content: "Input: dom virtual" },
  ];
  const a = await naive.complete(msgs, { role: "solve" });
  const b = await adapted.complete(msgs, { role: "solve" });
  assert.equal(a, reverseEntire("dom virtual"));
  assert.equal(b, reverseEachWordCorrect("dom virtual"));
  assert.notEqual(a, b);

  const tNaive = rollout(WORD_REVERSE, { seed: 0, temperature: 0, modelId: "toy-naive", maxSteps: 1 });
  const tAdapt = rollout(WORD_REVERSE, { seed: 0, temperature: 0, modelId: "adapted", maxSteps: 1 });
  assert.equal(tNaive.steps[0]?.action.text, "reverse_entire");
  assert.equal(tAdapt.steps[0]?.action.text, "reverse_each_word");
});

test("gap-sensitivity: flip only on the near-tie set", () => {
  const logits = { a: 3.0, b: 1.0, c: 0.0 };
  const gap = top2Gap(logits);
  assert.equal(gap, 2.0);
  const etaSafe = 0.9;
  assert.equal(gapSensitivityBound(gap, etaSafe), false);
  const rng = mulberry32(1);
  const perturbed = perturbLogits(logits, etaSafe, rng);
  // ‖ε‖_∞ ≤ eta, so if gap > 2 eta the argmax cannot move
  assert.equal(argmax(perturbed), "a");

  const etaBig = 2.0;
  assert.equal(gapSensitivityBound(gap, etaBig), true);
});

test("createProvider falls back to deterministic without a key", async () => {
  if (openRouterKey()) {
    const p = createProvider();
    assert.equal(p.name, "openrouter");
  } else {
    const p = createProvider();
    assert.equal(p.name, "deterministic");
    const out = await p.complete(
      [
        { role: "system", content: "Role: solve" },
        { role: "user", content: "Input: hello world" },
      ],
      { role: "solve" },
    );
    assert.equal(out, reverseEntire("hello world"));
  }
});

test("calculator first-passage: greedy naive misses; adapted hits", () => {
  const naive = rollout(CALCULATOR, { seed: 0, temperature: 0, modelId: "toy-naive" });
  const adapted = rollout(CALCULATOR, { seed: 0, temperature: 0, modelId: "adapted" });
  assert.equal(naive.pHit, 0);
  assert.equal(adapted.pHit, 1);
  assert.ok((adapted.tauS ?? 99) <= 3);
});

test("kernel step tags channels", () => {
  const spec = WORD_REVERSE.spec({ numEta: 0.4 });
  const state = WORD_REVERSE.initial({ seed: 3, temperature: 1.0 });
  const { trace } = stepKernel(spec, state, []);
  assert.ok(trace.channels.includes("samp"));
  assert.ok(trace.channels.includes("num"));
});

test("Obs writes a critique; spawn does not jump f_theta; mount does", () => {
  const traces = [
    {
      n: 0,
      action: { kind: "text" as const, text: "reverse_entire" },
      observation: { text: "lautriv mod", channel: "env" as const },
      logits: { reverse_entire: 3, reverse_each_word: 1 },
      gap: 2,
      tokenFlipped: false,
      channels: ["samp" as const, "env" as const],
      memoryAfter: {},
    },
  ];
  const obs = observe(traces, 0);
  assert.ok(obs.critique.includes("loop mutation") || obs.critique.includes("spawn"));
  const action = chooseIntervention(obs);
  assert.equal(action, "graph_mutation");
  const C0 = defaultControl({ modelId: "toy-naive", graphId: "one-shot" });
  const afterLoop = applyIntervention(C0, "graph_mutation");
  assert.equal(afterLoop.C.modelId, "toy-naive");
  assert.notEqual(afterLoop.C.graphId, C0.graphId);

  const spawned = applyIntervention(C0, "spawn_trainer");
  assert.equal(spawned.C.modelId, "toy-naive");
  assert.equal(spawned.job?.status, "running");

  const ready = { id: "job-1", status: "ready" as const, artifactId: "a1", resultModelId: "adapted:a1" };
  const mounted = applyIntervention(C0, "mount_adapter", ready);
  assert.equal(mounted.C.modelId, "adapted:a1");
  assert.equal(mounted.C.adapterId, "a1");
});

test("live flags parse N, temps, cascade; rate-limit detector; no-key rollout", async () => {
  const { parseLiveFlags, isRateLimited, liveRollout, couplingMemory } = await import("../live.js");
  const f = parseLiveFlags(["--N", "12", "--temps", "0,0.7", "--max-tokens", "32", "--cascade", "6"]);
  assert.equal(f.N, 12);
  assert.deepEqual(f.temps, [0, 0.7]);
  assert.equal(f.maxTokens, 32);
  assert.equal(f.cascade, 6);
  assert.equal(isRateLimited(new Error("OpenRouter 429: rate limit")), true);
  assert.equal(isRateLimited(new Error("OpenRouter 500: oops")), false);
  const { DeterministicProvider } = await import("../deterministic.js");
  const { WORD_REVERSE } = await import("../tasks.js");
  const p = new DeterministicProvider();
  const tr = await liveRollout(WORD_REVERSE, p, { seed: 1, temperature: 0, maxTokens: 16 });
  assert.equal(tr.taskId, "word-reverse");
  assert.ok(tr.steps.length >= 1);
  assert.ok(couplingMemory(WORD_REVERSE).lesson);
});
