/**
 * Live / replayable agent rollouts.
 *
 * Sampling channel = OpenRouter chat completions when OPENROUTER_API_KEY is set.
 * Default model: deepseek/deepseek-v4-flash-0731 (not the April preview).
 * Absent key → DeterministicProvider. Env tools stay simulated and public.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createProvider, DEFAULT_OPENROUTER_MODEL, openRouterKey, providerKind } from "./openrouter.js";
import { TASKS, type TaskSpec } from "./tasks.js";
import type { Action, Observation, Provider, StepTrace, Trajectory } from "./types.js";
import { parseAction } from "./kernel.js";

const here = dirname(fileURLToPath(import.meta.url));

function pickVocabLine(raw: string, vocab: readonly string[]): string {
  const trimmed = raw.trim();
  for (const v of vocab) {
    if (trimmed === v) return v;
  }
  const fence = trimmed.match(/`([^`]+)`/);
  if (fence?.[1] && vocab.includes(fence[1])) return fence[1];
  for (const v of vocab) {
    if (trimmed.includes(v)) return v;
  }
  return vocab[0]!;
}

function buildPrompt(task: TaskSpec, history: string[], memory: Record<string, string>): string {
  return [
    `Task: ${task.id}`,
    `Input: ${task.input}`,
    `Allowed actions (emit exactly one, nothing else):`,
    ...task.vocab.map((v) => `- ${v}`),
    memory && Object.keys(memory).length > 0 ? `Memory:\n${JSON.stringify(memory)}` : "Memory: {}",
    history.length > 0 ? `History:\n${history.join("\n")}` : "History: (empty)",
    "Reply with exactly one allowed action string.",
  ].join("\n");
}

export async function liveRollout(
  task: TaskSpec,
  provider: Provider,
  opts: { seed: number; temperature: number; maxSteps?: number },
): Promise<Trajectory> {
  const spec = task.spec({ numEta: 0 });
  let state = task.initial({ seed: opts.seed, temperature: opts.temperature });
  const steps: StepTrace[] = [];
  const maxSteps = opts.maxSteps ?? task.maxSteps;
  let tauS: number | null = null;
  let tauF: number | null = null;

  for (let n = 0; n < maxSteps; n++) {
    const raw = await provider.complete(
      [
        { role: "system", content: "Role: solve\nObjective: pick the next legal action." },
        { role: "user", content: buildPrompt(task, state.H, state.M) },
      ],
      { temperature: opts.temperature, seed: opts.seed + n, role: "solve" },
    );
    const actionKey = pickVocabLine(raw, task.vocab);
    const action: Action = parseAction(actionKey);
    const { E, o } = spec.env(state, action, { next: () => 0.5, int: () => 0, normal: () => 0, fork: () => ({ next: () => 0.5, int: () => 0, normal: () => 0, fork() { return this; } }) });
    const M = spec.mem(state, action, o);
    const H = [...state.H, `a:${action.text}`, `o:${o.text}`];
    state = { ...state, H, M, E };

    const channels: StepTrace["channels"] = ["samp"];
    if (o.channel === "env") channels.push("env");

    const trace: StepTrace = {
      n,
      action,
      observation: o,
      logits: Object.fromEntries(task.vocab.map((v) => [v, v === actionKey ? 1 : 0])),
      gap: 1,
      tokenFlipped: false,
      channels,
      memoryAfter: { ...M },
    };
    steps.push(trace);

    if (tauS === null && task.success(state, o)) tauS = n + 1;
    if (tauF === null && task.failure(state, o)) tauF = n + 1;
    if (tauS !== null || tauF !== null) break;
  }

  let outcome: Trajectory["outcome"] = "timeout";
  if (tauS !== null && (tauF === null || tauS < tauF)) outcome = "success";
  else if (tauF !== null) outcome = "failure";

  return {
    taskId: task.id,
    seed: opts.seed,
    temperature: opts.temperature,
    modelId: provider.model ?? DEFAULT_OPENROUTER_MODEL,
    provider: providerKind(provider),
    steps,
    outcome,
    tauS,
    tauF,
    pHit: outcome === "success" ? 1 : 0,
    cost: steps.length,
  };
}

export async function runLiveBatch(opts?: { N?: number; temperature?: number }): Promise<{
  model: string;
  keyed: boolean;
  provider: string;
  N: number;
  temperature: number;
  traces: Trajectory[];
  firstPassage: Array<{ taskId: string; pHit: number; nSuccess: number; N: number; meanTauS: number | null }>;
}> {
  const N = opts?.N ?? 3;
  const temperature = opts?.temperature ?? 0.7;
  const provider = createProvider(DEFAULT_OPENROUTER_MODEL);
  const traces: Trajectory[] = [];

  for (const task of TASKS) {
    for (let i = 0; i < N; i++) {
      traces.push(await liveRollout(task, provider, { seed: 10 + i, temperature }));
    }
  }

  const firstPassage = TASKS.map((task) => {
    const rows = traces.filter((t) => t.taskId === task.id);
    const hits = rows.filter((t) => t.pHit === 1);
    return {
      taskId: task.id,
      pHit: hits.length / rows.length,
      nSuccess: hits.length,
      N: rows.length,
      meanTauS: hits.length ? hits.reduce((s, t) => s + (t.tauS ?? 0), 0) / hits.length : null,
    };
  });

  const bundle = {
    model: provider.model ?? DEFAULT_OPENROUTER_MODEL,
    keyed: Boolean(openRouterKey()),
    provider: providerKind(provider),
    N,
    temperature,
    traces,
    firstPassage,
  };

  const outDir = join(here, "..", "experiments");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "live-0731.json"), JSON.stringify(bundle, null, 2));
  return bundle;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runLiveBatch({ N: 2, temperature: 0.7 })
    .then((b) => {
      const slim = {
        model: b.model,
        keyed: b.keyed,
        provider: b.provider,
        firstPassage: b.firstPassage,
        traces: b.traces.map((t) => ({
          taskId: t.taskId,
          seed: t.seed,
          outcome: t.outcome,
          tauS: t.tauS,
          tauF: t.tauF,
          pHit: t.pHit,
          actions: t.steps.map((s) => s.action.text),
          channels: t.steps.map((s) => s.channels),
        })),
      };
      console.log(JSON.stringify(slim, null, 2));
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
