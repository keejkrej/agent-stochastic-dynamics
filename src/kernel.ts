/**
 * Factored transition kernel
 *
 *   X_{n+1} ∼ K_{C,S}(· | X_n)
 *
 *   1. a     ∼ P^gen_{C,S}(· | H, M)
 *   2. (E,o) ∼ P^env(· | E, a)
 *   3. M     ∼ P^mem_C(· | M, H, a, o)
 *   4. H     = append(H, a, o)          (Dirac)
 *   5. C     ∼ P^fast(· | C, traces)    (does not write S)
 *   6. S     = S                       (frozen on the fast clock)
 */
import type {
  Action,
  Control,
  HybridState,
  LogitMap,
  NoiseChannel,
  Observation,
  StepTrace,
} from "./types.js";
import { argmax, lInf, mulberry32, sampleCategorical, softmax, top2Gap, type RNG } from "./rng.js";

export type EnvKernel = (state: HybridState, action: Action, rng: RNG) => { E: HybridState["E"]; o: Observation };
export type MemKernel = (state: HybridState, action: Action, o: Observation) => Record<string, string>;
export type CtrlKernel = (state: HybridState, traces: StepTrace[]) => Control;

export type KernelSpec = {
  vocab: readonly string[];
  logits: LogitMap;
  env: EnvKernel;
  mem: MemKernel;
  ctrl: CtrlKernel;
  /** Numerical-channel scale. ε_i ∼ Unif[−η, η] on each logit (not white in time). */
  numEta: number;
};

export function applyGrammar(logits: Record<string, number>, grammar?: readonly string[]): Record<string, number> {
  if (!grammar || grammar.length === 0) return { ...logits };
  const allowed = new Set(grammar);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(logits)) {
    if (allowed.has(k)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : { ...logits };
}

export function applyValidator(
  logits: Record<string, number>,
  validator: Control["validator"],
): Record<string, number> {
  if (!validator || validator === "none") return logits;
  const keep = (k: string): boolean => {
    if (validator === "valid-action") return !k.startsWith("invalid") && k !== "noop_fail";
    if (validator === "numeric") return /^-?\d+(\.\d+)?$/.test(k);
    if (validator === "nonempty") return k.length > 0;
    return true;
  };
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(logits)) {
    if (keep(k)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : logits;
}

export function perturbLogits(
  logits: Record<string, number>,
  eta: number,
  rng: RNG,
): Record<string, number> {
  if (eta <= 0) return { ...logits };
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(logits)) {
    out[k] = v + (rng.next() * 2 - 1) * eta;
  }
  return out;
}

/** Gap-sensitivity bound: a flip is possible only if Δℓ ≤ 2‖ε‖_∞. */
export function gapSensitivityBound(delta: number, epsInf: number): boolean {
  return delta <= 2 * epsInf;
}

export function decodeAction(
  logits: Record<string, number>,
  C: Control,
  rng: RNG,
): { actionKey: string; probs: Record<string, number> } {
  const restricted = applyValidator(applyGrammar(logits, C.grammar), C.validator);
  const k = Math.max(1, C.bestOfK | 0);
  if (k <= 1) {
    const probs = softmax(restricted, C.temperature);
    const actionKey = C.temperature <= 0 ? argmax(restricted) : sampleCategorical(probs, rng);
    return { actionKey, probs };
  }
  // Best-of-k: k i.i.d. samples, select the one with highest restricted logit (external score = logit).
  const probs = softmax(restricted, C.temperature);
  let best = sampleCategorical(probs, rng);
  let bestScore = restricted[best] ?? -Infinity;
  for (let i = 1; i < k; i++) {
    const cand = sampleCategorical(probs, rng);
    const s = restricted[cand] ?? -Infinity;
    if (s > bestScore) {
      best = cand;
      bestScore = s;
    }
  }
  return { actionKey: best, probs };
}

export function parseAction(key: string): Action {
  const tool = key.match(/^tool:([a-zA-Z0-9_]+):(.*)$/);
  if (tool) {
    return { kind: "tool", text: key, toolName: tool[1], toolArgs: tool[2] };
  }
  return { kind: "text", text: key };
}

export type KernelStep = {
  next: HybridState;
  trace: StepTrace;
};

export function stepKernel(spec: KernelSpec, state: HybridState, traces: StepTrace[]): KernelStep {
  const sampRng = mulberry32(state.C.seed + 10007 * traces.length);
  const numRng = sampRng.fork(17);

  const raw = spec.logits(state, spec.vocab);
  const perturbed = perturbLogits(raw, spec.numEta, numRng);
  const gap = top2Gap(raw);
  const cleanArgmax = argmax(raw);
  const { actionKey } = decodeAction(perturbed, state.C, sampRng);
  const tokenFlipped = actionKey !== cleanArgmax;
  const action = parseAction(actionKey);

  const envRng = sampRng.fork(31);
  const { E, o } = spec.env(state, action, envRng);
  const M = spec.mem(state, action, o);
  const H = [...state.H, `a:${action.text}`, `o:${o.text}`];
  const C = spec.ctrl({ ...state, E, M, H }, traces);

  const channels: NoiseChannel[] = [];
  if (state.C.temperature > 0 || state.C.bestOfK > 1) channels.push("samp");
  if (spec.numEta > 0) channels.push("num");
  if (o.channel === "env") channels.push("env");

  const trace: StepTrace = {
    n: traces.length,
    action,
    observation: o,
    logits: raw,
    perturbedLogits: spec.numEta > 0 ? perturbed : undefined,
    gap,
    tokenFlipped,
    channels,
    memoryAfter: { ...M },
  };

  return {
    next: { H, M, E, C, S: state.S },
    trace,
  };
}

export function diracCtrl(state: HybridState): Control {
  return { ...state.C, seed: state.C.seed + 1 };
}

export function diracMem(state: HybridState, action: Action, o: Observation): Record<string, string> {
  const M = { ...state.M };
  if (action.text === "write_lesson" || action.text === "reflect") {
    M.lesson = o.text || "reverse each word independently";
  }
  if (action.kind === "tool" && action.toolName) {
    M[`tool:${action.toolName}`] = o.text;
  }
  return M;
}

/** Total-variation distance of two discrete laws on a finite set. */
export function tv(p: Record<string, number>, q: Record<string, number>): number {
  const keys = new Set([...Object.keys(p), ...Object.keys(q)]);
  let s = 0;
  for (const k of keys) s += Math.abs((p[k] ?? 0) - (q[k] ?? 0));
  return s / 2;
}

export function hammingHistory(H: string[], Hp: string[]): number {
  const n = Math.max(H.length, Hp.length);
  let d = Math.abs(H.length - Hp.length);
  for (let i = 0; i < Math.min(H.length, Hp.length); i++) {
    if (H[i] !== Hp[i]) d += 1;
  }
  return d;
}

/** ‖ε‖_∞ between raw and perturbed logits; used by the gap-sensitivity lemma. */
export function epsInf(raw: Record<string, number>, perturbed?: Record<string, number>): number {
  if (!perturbed) return 0;
  return lInf(raw, perturbed);
}

export { gapSensitivityBound as flipPossible };
