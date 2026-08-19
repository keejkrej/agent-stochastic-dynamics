/**
 * Live / replayable agent rollouts.
 *
 * Sampling channel = OpenRouter chat completions when OPENROUTER_API_KEY is set.
 * Default model: deepseek/deepseek-v4-flash-0731 (not the April preview).
 * Absent key → DeterministicProvider. Env tools stay simulated and public.
 *
 * CLI: --N --temps a,b --max-tokens --cascade --out
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createProvider, DEFAULT_OPENROUTER_MODEL, openRouterKey, providerKind } from "./openrouter.js";
import { TASKS, type TaskSpec } from "./tasks.js";
import type { Action, Observation, Provider, StepTrace, Trajectory } from "./types.js";
import { hammingHistory, parseAction } from "./kernel.js";

const here = dirname(fileURLToPath(import.meta.url));

export type LiveFlags = { N: number; temps: number[]; maxTokens: number; cascade: number; outFile: string };

export function parseLiveFlags(argv: string[]): LiveFlags {
  const out: LiveFlags = { N: 12, temps: [0, 0.7], maxTokens: 48, cascade: 6, outFile: "live-0731.json" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--N" || a === "--n") out.N = Number(argv[++i]);
    else if (a === "--temps") out.temps = String(argv[++i]).split(",").map((s) => Number(s.trim())).filter((x) => Number.isFinite(x));
    else if (a === "--max-tokens") out.maxTokens = Number(argv[++i]);
    else if (a === "--cascade") out.cascade = Number(argv[++i]);
    else if (a === "--out") out.outFile = String(argv[++i]);
  }
  if (!Number.isFinite(out.N) || out.N < 0) out.N = 0;
  if (out.temps.length === 0) out.temps = [0];
  if (!Number.isFinite(out.maxTokens) || out.maxTokens < 8) out.maxTokens = 48;
  if (!Number.isFinite(out.cascade) || out.cascade < 0) out.cascade = 0;
  return out;
}

export function couplingMemory(task: TaskSpec): Record<string, string> {
  if (task.id === "word-reverse") return { lesson: "reverse each word independently" };
  if (task.id === "calculator") return { hint: "add 3 and 5 first, then multiply the sum by 2" };
  if (task.id === "retrieval-qa") return { "tool:search": "The International Conference on Learning Representations (ICLR) was founded in 2013." };
  return { lesson: "use the correct tool then answer" };
}

export function isRateLimited(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b/.test(msg) || /rate.?limit/i.test(msg) || /too many requests/i.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}


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
  opts: { seed: number; temperature: number; maxSteps?: number; memory?: Record<string, string>; maxTokens?: number },
): Promise<Trajectory> {
  const spec = task.spec({ numEta: 0 });
  let state = task.initial({ seed: opts.seed, temperature: opts.temperature });
  if (opts.memory) state = { ...state, M: { ...state.M, ...opts.memory } };
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
      { temperature: opts.temperature, seed: opts.seed + n, role: "solve", maxTokens: opts.maxTokens ?? 48 },
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

export type FirstPassageRow = {
  taskId: string; temperature: number; pHit: number; nSuccess: number; N: number; meanTauS: number | null;
};
export type CascadePair = {
  taskId: string; seed: number; temperature: number; disagreeFirst: boolean;
  hammingActions: number; hammingHistory: number; pHitBase: 0 | 1; pHitSplit: 0 | 1;
  actionsBase: string[]; actionsSplit: string[];
};
export type CascadeRow = {
  taskId: string; temperature: number; N: number; disagreeFirst: number;
  meanHammingActions: number; meanHammingHistory: number; pHitBase: number; pHitSplit: number;
};
export type LiveBundle = {
  model: string; keyed: boolean; provider: string; N: number; temperatures: number[];
  maxTokens: number; generatedAt: string; stoppedReason: "complete" | "rate_limited" | "error";
  nCompleted: number; nPlanned: number; traces: Trajectory[]; firstPassage: FirstPassageRow[];
  cascadePairs: CascadePair[]; cascade: CascadeRow[];
};

function summarizeFirstPassage(traces: Trajectory[]): FirstPassageRow[] {
  const keys = new Map<string, Trajectory[]>();
  for (const t of traces) {
    const k = t.taskId + "\t" + t.temperature;
    const arr = keys.get(k) ?? [];
    arr.push(t);
    keys.set(k, arr);
  }
  return [...keys.entries()].map(([k, rows]) => {
    const [taskId, tempStr] = k.split("\t");
    const hits = rows.filter((t) => t.pHit === 1);
    return {
      taskId: taskId!, temperature: Number(tempStr),
      pHit: rows.length ? hits.length / rows.length : 0,
      nSuccess: hits.length, N: rows.length,
      meanTauS: hits.length ? hits.reduce((s, t) => s + (t.tauS ?? 0), 0) / hits.length : null,
    };
  });
}

function summarizeCascade(pairs: CascadePair[]): CascadeRow[] {
  const keys = new Map<string, CascadePair[]>();
  for (const p of pairs) {
    const k = p.taskId + "\t" + p.temperature;
    const arr = keys.get(k) ?? [];
    arr.push(p);
    keys.set(k, arr);
  }
  return [...keys.entries()].map(([k, rows]) => {
    const [taskId, tempStr] = k.split("\t");
    return {
      taskId: taskId!, temperature: Number(tempStr), N: rows.length,
      disagreeFirst: rows.filter((r) => r.disagreeFirst).length / rows.length,
      meanHammingActions: rows.reduce((s, r) => s + r.hammingActions, 0) / rows.length,
      meanHammingHistory: rows.reduce((s, r) => s + r.hammingHistory, 0) / rows.length,
      pHitBase: rows.reduce((s, r) => s + r.pHitBase, 0) / rows.length,
      pHitSplit: rows.reduce((s, r) => s + r.pHitSplit, 0) / rows.length,
    };
  });
}

function actionHamming(a: string[], b: string[]): number {
  let d = Math.abs(a.length - b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) d += 1;
  return d;
}

function svgBars(groups: Array<{ label: string; values: number[]; series: string[] }>, opts: { title: string; ylabel: string; ymax?: number }): string {
  const W = 520, H = 280, pad = { l: 52, r: 16, t: 28, b: 48 };
  const colors = ["#1f4e8c", "#b85c38"];
  const ymax = opts.ymax ?? Math.max(1, ...groups.flatMap((g) => g.values));
  const n = groups.length;
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const groupW = innerW / Math.max(n, 1);
  const seriesN = groups[0]?.values.length ?? 1;
  const barW = (groupW * 0.7) / Math.max(seriesN, 1);
  const ymap = (y: number) => pad.t + innerH - (y / ymax) * innerH;
  const bars: string[] = [];
  const labels: string[] = [];
  groups.forEach((g, i) => {
    g.values.forEach((v, s) => {
      const x = pad.l + i * groupW + groupW * 0.15 + s * barW;
      const y = ymap(v);
      const h = ymap(0) - y;
      bars.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(h, 0).toFixed(1)}" fill="${colors[s % colors.length]}"/>`);
    });
    labels.push(`<text x="${(pad.l + i * groupW + groupW / 2).toFixed(1)}" y="${H - 28}" text-anchor="middle" font-family="Times, serif" font-size="11">${g.label}</text>`);
  });
  const legend = (groups[0]?.series ?? []).map((name, s) => {
    const x = pad.l + s * 90;
    return `<rect x="${x}" y="8" width="10" height="10" fill="${colors[s % colors.length]}"/><text x="${x + 14}" y="17" font-family="Times, serif" font-size="11">${name}</text>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <text x="${W / 2}" y="18" text-anchor="middle" font-family="Times, serif" font-size="13">${opts.title}</text>
  <line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" stroke="#222"/>
  <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}" stroke="#222"/>
  ${bars.join("\n  ")}
  ${labels.join("\n  ")}
  ${legend.join("\n  ")}
  <text x="14" y="${H / 2}" text-anchor="middle" font-family="Times, serif" font-size="11" transform="rotate(-90 14 ${H / 2})">${opts.ylabel}</text>
</svg>
`;
}

function writeFigures(bundle: LiveBundle, outDir: string): void {
  const tasks = [...new Set(bundle.firstPassage.map((r) => r.taskId))];
  const temps = [...new Set(bundle.firstPassage.map((r) => r.temperature))].sort((a, b) => a - b);
  if (tasks.length && temps.length) {
    const groups = tasks.map((taskId) => ({
      label: taskId,
      series: temps.map((t) => "t=" + t),
      values: temps.map((t) => bundle.firstPassage.find((r) => r.taskId === taskId && r.temperature === t)?.pHit ?? 0),
    }));
    writeFileSync(join(outDir, "live-phit.svg"), svgBars(groups, { title: "Live p_hit on " + bundle.model, ylabel: "p_hit", ymax: 1 }));
  }
  if (bundle.cascade.length) {
    const cTasks = [...new Set(bundle.cascade.map((r) => r.taskId))];
    const cTemps = [...new Set(bundle.cascade.map((r) => r.temperature))].sort((a, b) => a - b);
    const groups = cTasks.map((taskId) => ({
      label: taskId,
      series: cTemps.map((t) => "t=" + t),
      values: cTemps.map((t) => bundle.cascade.find((r) => r.taskId === taskId && r.temperature === t)?.disagreeFirst ?? 0),
    }));
    writeFileSync(join(outDir, "live-cascade.svg"), svgBars(groups, { title: "Coupling: first-action disagreement after one memory bit", ylabel: "disagreeFirst", ymax: 1 }));
  }
}

export async function runLiveBatch(opts?: {
  N?: number; temperature?: number; temps?: number[]; maxTokens?: number;
  cascade?: number; outFile?: string; pauseMs?: number;
}): Promise<LiveBundle> {
  const N = opts?.N ?? 3;
  const temps = opts?.temps ?? [opts?.temperature ?? 0.7];
  const maxTokens = opts?.maxTokens ?? 48;
  const cascadeN = opts?.cascade ?? 0;
  const pauseMs = opts?.pauseMs ?? 0;
  const outFile = opts?.outFile ?? "live-0731.json";
  const provider = createProvider(DEFAULT_OPENROUTER_MODEL);
  const traces: Trajectory[] = [];
  const cascadePairs: CascadePair[] = [];
  const nPlanned = TASKS.length * temps.length * N + TASKS.length * temps.length * cascadeN * 2;
  let nCompleted = 0;
  const outDir = join(here, "..", "experiments");
  mkdirSync(outDir, { recursive: true });

  const persist = (reason: LiveBundle["stoppedReason"]): LiveBundle => {
    const bundle: LiveBundle = {
      model: provider.model ?? DEFAULT_OPENROUTER_MODEL,
      keyed: Boolean(openRouterKey()),
      provider: providerKind(provider),
      N, temperatures: temps, maxTokens,
      generatedAt: new Date().toISOString(),
      stoppedReason: reason, nCompleted, nPlanned, traces,
      firstPassage: summarizeFirstPassage(traces),
      cascadePairs, cascade: summarizeCascade(cascadePairs),
    };
    writeFileSync(join(outDir, outFile), JSON.stringify(bundle, null, 2));
    writeFigures(bundle, outDir);
    return bundle;
  };

  const once = async <T>(fn: () => Promise<T>): Promise<T> => {
    const v = await fn();
    nCompleted += 1;
    if (pauseMs > 0) await sleep(pauseMs);
    return v;
  };

  try {
    for (const temperature of temps) {
      for (const task of TASKS) {
        for (let i = 0; i < N; i++) {
          traces.push(await once(() => liveRollout(task, provider, { seed: 10 + i, temperature, maxTokens })));
          persist("complete");
        }
      }
    }
    for (const temperature of temps) {
      for (const task of TASKS) {
        for (let i = 0; i < cascadeN; i++) {
          const seed = 80 + i;
          const base = await once(() => liveRollout(task, provider, { seed, temperature, maxTokens }));
          const split = await once(() => liveRollout(task, provider, { seed, temperature, maxTokens, memory: couplingMemory(task) }));
          const actionsBase = base.steps.map((s) => s.action.text);
          const actionsSplit = split.steps.map((s) => s.action.text);
          cascadePairs.push({
            taskId: task.id, seed, temperature,
            disagreeFirst: (actionsBase[0] ?? "") !== (actionsSplit[0] ?? ""),
            hammingActions: actionHamming(actionsBase, actionsSplit),
            hammingHistory: hammingHistory(
              base.steps.flatMap((s) => ["a:" + s.action.text, "o:" + s.observation.text]),
              split.steps.flatMap((s) => ["a:" + s.action.text, "o:" + s.observation.text]),
            ),
            pHitBase: base.pHit, pHitSplit: split.pHit, actionsBase, actionsSplit,
          });
          persist("complete");
        }
      }
    }
  } catch (err) {
    if (isRateLimited(err)) return persist("rate_limited");
    persist("error");
    throw err;
  }
  return persist("complete");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const flags = parseLiveFlags(process.argv.slice(2));
  runLiveBatch({
    N: flags.N, temps: flags.temps, maxTokens: flags.maxTokens,
    cascade: flags.cascade, outFile: flags.outFile, pauseMs: 80,
  }).then((b) => {
    const slim = {
      model: b.model, keyed: b.keyed, provider: b.provider, N: b.N,
      temperatures: b.temperatures, stoppedReason: b.stoppedReason,
      nCompleted: b.nCompleted, nPlanned: b.nPlanned,
      firstPassage: b.firstPassage, cascade: b.cascade,
      traces: b.traces.map((t) => ({
        taskId: t.taskId, seed: t.seed, temperature: t.temperature,
        outcome: t.outcome, tauS: t.tauS, tauF: t.tauF, pHit: t.pHit,
        actions: t.steps.map((s) => s.action.text),
      })),
    };
    console.log(JSON.stringify(slim, null, 2));
  }).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
