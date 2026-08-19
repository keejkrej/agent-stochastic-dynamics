/**
 * Self-generated trajectory harness.
 *
 * Sampling channel: seed / temperature (OpenRouter if OPENROUTER_API_KEY, else Dirac mock).
 * Numerical channel: optional logit perturbation η.
 * Env channel: simulated public tools (calculator, retrieval) or the word-reverse fixture.
 *
 * No private corpus. All traces are generated in this process.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hammingHistory, stepKernel, tv } from "./kernel.js";
import { createProvider, openRouterKey, providerKind } from "./openrouter.js";
import { CALCULATOR, RETRIEVAL_QA, WORD_REVERSE, type TaskSpec } from "./tasks.js";
import type { StepTrace, Trajectory } from "./types.js";
import { softmax } from "./rng.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "experiments");

export function rollout(task: TaskSpec, opts: {
  seed: number;
  temperature?: number;
  bestOfK?: number;
  modelId?: string;
  numEta?: number;
  maxSteps?: number;
}): Trajectory {
  const spec = task.spec({ numEta: opts.numEta ?? 0, modelId: opts.modelId });
  let state = task.initial({
    seed: opts.seed,
    temperature: opts.temperature ?? 0,
    bestOfK: opts.bestOfK ?? 1,
    modelId: opts.modelId,
  });
  const steps: StepTrace[] = [];
  const maxSteps = opts.maxSteps ?? task.maxSteps;
  let tauS: number | null = null;
  let tauF: number | null = null;

  for (let n = 0; n < maxSteps; n++) {
    const { next, trace } = stepKernel(spec, state, steps);
    steps.push(trace);
    state = next;
    if (tauS === null && task.success(state, trace.observation)) tauS = n + 1;
    if (tauF === null && task.failure(state, trace.observation)) tauF = n + 1;
    if (tauS !== null || tauF !== null) break;
  }

  let outcome: Trajectory["outcome"] = "timeout";
  if (tauS !== null && (tauF === null || tauS < tauF)) outcome = "success";
  else if (tauF !== null) outcome = "failure";

  return {
    taskId: task.id,
    seed: opts.seed,
    temperature: opts.temperature ?? 0,
    modelId: opts.modelId ?? state.C.modelId,
    provider: "kernel",
    steps,
    outcome,
    tauS,
    tauF,
    pHit: outcome === "success" ? 1 : 0,
    cost: steps.length,
  };
}

export type FirstPassageSummary = {
  taskId: string;
  temperature: number;
  bestOfK: number;
  modelId: string;
  N: number;
  pHit: number;
  meanTauS: number | null;
  meanCost: number;
  nSuccess: number;
};

export function firstPassageSweep(
  task: TaskSpec,
  grid: { temperatures: number[]; ks: number[]; N: number; modelId?: string },
): FirstPassageSummary[] {
  const rows: FirstPassageSummary[] = [];
  for (const temperature of grid.temperatures) {
    for (const bestOfK of grid.ks) {
      const trajs = [];
      for (let i = 0; i < grid.N; i++) {
        trajs.push(rollout(task, { seed: 1000 + i * 17, temperature, bestOfK, modelId: grid.modelId }));
      }
      const hits = trajs.filter((t) => t.pHit === 1);
      const meanTauS =
        hits.length > 0 ? hits.reduce((s, t) => s + (t.tauS ?? 0), 0) / hits.length : null;
      rows.push({
        taskId: task.id,
        temperature,
        bestOfK,
        modelId: grid.modelId ?? "toy-naive",
        N: grid.N,
        pHit: hits.length / trajs.length,
        meanTauS,
        meanCost: trajs.reduce((s, t) => s + t.cost, 0) / trajs.length,
        nSuccess: hits.length,
      });
    }
  }
  return rows;
}

export type CascadePoint = {
  n: number;
  meanHamming: number;
  disagreeAction: number;
  meanTvGen: number;
};

/** Two copies coupled by shared seed; they differ by one memory bit (lesson present vs absent). */
export function cascadeExperiment(task: TaskSpec, opts: {
  N: number;
  steps: number;
  temperature: number;
}): CascadePoint[] {
  const acc = Array.from({ length: opts.steps }, () => ({ ham: 0, dis: 0, tv: 0 }));
  for (let i = 0; i < opts.N; i++) {
    const seed = 5000 + i * 13;
    const spec = task.spec({ numEta: 0 });
    let x = task.initial({ seed, temperature: opts.temperature });
    let y = task.initial({ seed, temperature: opts.temperature });
    y = { ...y, M: { ...y.M, lesson: "reverse each word independently" } };
    const tx: StepTrace[] = [];
    const ty: StepTrace[] = [];
    for (let n = 0; n < opts.steps; n++) {
      const a = stepKernel(spec, x, tx);
      const b = stepKernel(spec, y, ty);
      tx.push(a.trace);
      ty.push(b.trace);
      x = a.next;
      y = b.next;
      const p = softmax(a.trace.logits, opts.temperature);
      const q = softmax(b.trace.logits, opts.temperature);
      acc[n]!.ham += hammingHistory(x.H, y.H);
      acc[n]!.dis += a.trace.action.text === b.trace.action.text ? 0 : 1;
      acc[n]!.tv += tv(p, q);
    }
  }
  return acc.map((a, n) => ({
    n: n + 1,
    meanHamming: a.ham / opts.N,
    disagreeAction: a.dis / opts.N,
    meanTvGen: a.tv / opts.N,
  }));
}

export type GapSweepPoint = {
  eta: number;
  nTrials: number;
  nFlip: number;
  pFlip: number;
  pFlipWhenGapLeq2eta: number;
  nNearTie: number;
  nFlipOffTie: number;
};

/** Empirical check of the gap-sensitivity lemma on the word-reverse logit map. */
export function gapSensitivitySweep(etas: number[], trials: number): GapSweepPoint[] {
  const task = WORD_REVERSE;
  const out: GapSweepPoint[] = [];
  for (const eta of etas) {
    let nFlip = 0;
    let nNear = 0;
    let nFlipNear = 0;
    let nFlipOff = 0;
    for (let i = 0; i < trials; i++) {
      const t = rollout(task, { seed: 9000 + i, temperature: 0, numEta: eta, maxSteps: 1 });
      const st = t.steps[0];
      if (!st) continue;
      const flipped = st.tokenFlipped;
      const near = st.gap <= 2 * eta + 1e-12;
      if (flipped) nFlip += 1;
      if (near) {
        nNear += 1;
        if (flipped) nFlipNear += 1;
      } else if (flipped) {
        nFlipOff += 1;
      }
    }
    out.push({
      eta,
      nTrials: trials,
      nFlip,
      pFlip: nFlip / trials,
      pFlipWhenGapLeq2eta: nNear > 0 ? nFlipNear / nNear : 0,
      nNearTie: nNear,
      nFlipOffTie: nFlipOff,
    });
  }
  return out;
}

export type SamplingChannelRow = {
  temperature: number;
  uniqueActions: number;
  entropy: number;
  N: number;
};

export function samplingChannelOnOff(task: TaskSpec, temperatures: number[], N: number): SamplingChannelRow[] {
  const rows: SamplingChannelRow[] = [];
  for (const temperature of temperatures) {
    const counts = new Map<string, number>();
    for (let i = 0; i < N; i++) {
      const t = rollout(task, { seed: 2000 + i, temperature, maxSteps: 1 });
      const a = t.steps[0]?.action.text ?? "";
      counts.set(a, (counts.get(a) ?? 0) + 1);
    }
    let H = 0;
    for (const c of counts.values()) {
      const p = c / N;
      if (p > 0) H -= p * Math.log2(p);
    }
    rows.push({ temperature, uniqueActions: counts.size, entropy: H, N });
  }
  return rows;
}

/** Optional OpenRouter linguistic rollouts (sampling channel = API). Mock if no key. */
export async function providerRollouts(task: TaskSpec, N: number, temperature: number): Promise<{
  provider: string;
  model?: string;
  keyed: boolean;
  N: number;
  outputs: string[];
  unique: number;
}> {
  const provider = createProvider();
  const outputs: string[] = [];
  for (let i = 0; i < N; i++) {
    const text = await provider.complete(
      [
        { role: "system", content: `Role: solve\nObjective: solve the task` },
        { role: "user", content: `Input: ${task.input}` },
      ],
      { temperature, seed: 3000 + i, role: "solve" },
    );
    outputs.push(text.trim());
  }
  return {
    provider: providerKind(provider),
    model: provider.model,
    keyed: Boolean(openRouterKey()),
    N,
    outputs,
    unique: new Set(outputs).size,
  };
}

function svgLine(
  points: Array<{ x: number; y: number }>,
  opts: { title: string; xlabel: string; ylabel: string; width?: number; height?: number },
): string {
  const W = opts.width ?? 480;
  const H = opts.height ?? 280;
  const pad = { l: 52, r: 16, t: 28, b: 40 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ymin = 0;
  const ymax = Math.max(...ys, 1e-6);
  const xmap = (x: number) => pad.l + ((x - xmin) / (xmax - xmin || 1)) * (W - pad.l - pad.r);
  const ymap = (y: number) => H - pad.b - ((y - ymin) / (ymax - ymin || 1)) * (H - pad.t - pad.b);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xmap(p.x).toFixed(1)} ${ymap(p.y).toFixed(1)}`).join(" ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <text x="${W / 2}" y="18" text-anchor="middle" font-family="Times, serif" font-size="13">${opts.title}</text>
  <line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" stroke="#222"/>
  <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}" stroke="#222"/>
  <path d="${d}" fill="none" stroke="#1f4e8c" stroke-width="2"/>
  ${points.map((p) => `<circle cx="${xmap(p.x).toFixed(1)}" cy="${ymap(p.y).toFixed(1)}" r="2.5" fill="#1f4e8c"/>`).join("\n  ")}
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-family="Times, serif" font-size="11">${opts.xlabel}</text>
  <text x="14" y="${H / 2}" text-anchor="middle" font-family="Times, serif" font-size="11" transform="rotate(-90 14 ${H / 2})">${opts.ylabel}</text>
</svg>
`;
}

export type ExperimentBundle = {
  generatedAt: string;
  providerFallback: string;
  keyed: boolean;
  sampling: SamplingChannelRow[];
  firstPassage: FirstPassageSummary[];
  cascade: CascadePoint[];
  gap: GapSweepPoint[];
  providerProbe: Awaited<ReturnType<typeof providerRollouts>>;
};

export async function runAll(): Promise<ExperimentBundle> {
  mkdirSync(outDir, { recursive: true });
  const sampling = samplingChannelOnOff(WORD_REVERSE, [0, 0.3, 0.7, 1.0, 1.5], 400);
  const firstPassage = [
    ...firstPassageSweep(WORD_REVERSE, {
      temperatures: [0, 0.5, 1.0, 1.5],
      ks: [1, 4, 16],
      N: 200,
    }),
    ...firstPassageSweep(CALCULATOR, { temperatures: [0, 0.7, 1.2], ks: [1, 8], N: 200 }),
    ...firstPassageSweep(RETRIEVAL_QA, { temperatures: [0, 0.7, 1.2], ks: [1, 8], N: 200 }),
  ];
  const cascade = cascadeExperiment(WORD_REVERSE, { N: 200, steps: 5, temperature: 0.8 });
  const gap = gapSensitivitySweep([0, 0.2, 0.5, 1.0, 1.5, 2.5], 400);
  const providerProbe = await providerRollouts(WORD_REVERSE, 8, 0);

  const bundle: ExperimentBundle = {
    generatedAt: new Date().toISOString(),
    providerFallback: providerProbe.provider,
    keyed: providerProbe.keyed,
    sampling,
    firstPassage,
    cascade,
    gap,
    providerProbe,
  };

  writeFileSync(join(outDir, "results.json"), JSON.stringify(bundle, null, 2));
  writeFileSync(
    join(outDir, "cascade.svg"),
    svgLine(
      cascade.map((p) => ({ x: p.n, y: p.meanHamming })),
      { title: "Cascade: Hamming(H, H') after one memory-bit split", xlabel: "step n", ylabel: "mean Hamming" },
    ),
  );
  writeFileSync(
    join(outDir, "first-passage.svg"),
    svgLine(
      firstPassage
        .filter((r) => r.taskId === "word-reverse" && r.bestOfK === 1)
        .map((r) => ({ x: r.temperature, y: r.pHit })),
      { title: "Word-reverse p_hit vs temperature (k=1)", xlabel: "τ", ylabel: "p_hit" },
    ),
  );
  writeFileSync(
    join(outDir, "gap-sensitivity.svg"),
    svgLine(
      gap.map((p) => ({ x: p.eta, y: p.pFlip })),
      { title: "Numerical flips vs η (τ = 0)", xlabel: "η = ‖ε‖ bound", ylabel: "P(token flip)" },
    ),
  );
  return bundle;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runAll()
    .then((b) => {
      console.log(JSON.stringify({
        keyed: b.keyed,
        provider: b.providerFallback,
        sampling: b.sampling,
        firstPassage: b.firstPassage,
        cascade: b.cascade,
        gap: b.gap,
        providerUnique: b.providerProbe.unique,
      }, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
