/**
 * Self-generated benchmarks. No private corpus.
 * Environments are simulated and public (word-reverse fixture, calculator, retrieval).
 */
import { diracCtrl, diracMem, type EnvKernel, type KernelSpec } from "./kernel.js";
import type { Action, HybridState, LogitMap, Observation, Trajectory } from "./types.js";
import { defaultControl, defaultSlowPointer, defaultState } from "./types.js";
import { reverseEachWordCorrect, reverseEntire } from "./deterministic.js";
import type { RNG } from "./rng.js";

export type TaskSpec = {
  id: string;
  input: string;
  expected: string;
  vocab: readonly string[];
  tools: readonly string[];
  maxSteps: number;
  success: (state: HybridState, last: Observation) => boolean;
  failure: (state: HybridState, last: Observation) => boolean;
  spec: (opts?: { numEta?: number; modelId?: string }) => KernelSpec;
  initial: (opts?: { seed?: number; temperature?: number; bestOfK?: number; modelId?: string }) => HybridState;
};

function textObs(text: string, channel: Observation["channel"] = "env"): Observation {
  return { text, channel };
}

// ---------------------------------------------------------------------------
// Task 1: word-reverse  (vdom-harness fixture)
// Vocab actions: reverse_entire | reverse_each_word | reflect | write_lesson | stop
// ---------------------------------------------------------------------------

const WR_VOCAB = ["reverse_entire", "reverse_each_word", "reflect", "write_lesson", "stop"] as const;

const wrLogits: LogitMap = (state, vocab) => {
  const out: Record<string, number> = {};
  for (const v of vocab) out[v] = 0;
  const hasLesson = Boolean(state.M.lesson && state.M.lesson.toLowerCase().includes("each word"));
  const adapted = state.S.modelId.includes("adapted") || Boolean(state.S.adapterId);
  if (adapted || hasLesson) {
    out.reverse_each_word = 4.0;
    out.reverse_entire = 1.0;
    out.stop = 0.5;
  } else {
    out.reverse_entire = 3.5;
    out.reverse_each_word = 1.2;
    out.reflect = 1.6;
    out.write_lesson = 0.8;
    out.stop = 0.2;
  }
  if (state.H.some((h) => h.includes("reverse_entire") || h.includes("reverse_each_word"))) {
    out.stop = (out.stop ?? 0) + 0.4;
  }
  return out;
};

const wrEnv: EnvKernel = (state, action) => {
  const input = state.E.input;
  if (action.text === "reverse_entire") {
    return { E: { ...state.E, lastObservation: reverseEntire(input) }, o: textObs(reverseEntire(input), "env") };
  }
  if (action.text === "reverse_each_word") {
    return {
      E: { ...state.E, lastObservation: reverseEachWordCorrect(input) },
      o: textObs(reverseEachWordCorrect(input), "env"),
    };
  }
  if (action.text === "reflect") {
    return {
      E: { ...state.E, lastObservation: "lesson" },
      o: textObs("reverse each word independently; do not reverse the entire string.", "env"),
    };
  }
  if (action.text === "write_lesson") {
    return {
      E: { ...state.E, lastObservation: "wrote" },
      o: textObs("reverse each word independently", "env"),
    };
  }
  return { E: { ...state.E, lastObservation: state.E.lastObservation }, o: textObs("ok", "env") };
};

export const WORD_REVERSE: TaskSpec = {
  id: "word-reverse",
  input: "dom virtual",
  expected: "mod lautriv",
  vocab: WR_VOCAB,
  tools: [],
  maxSteps: 6,
  success: (s) => s.E.lastObservation === "mod lautriv",
  failure: (s) => s.H.filter((h) => h.startsWith("a:stop")).length > 0 && s.E.lastObservation !== "mod lautriv",
  spec: (opts) => ({
    vocab: WR_VOCAB,
    logits: wrLogits,
    env: wrEnv,
    mem: diracMem,
    ctrl: diracCtrl,
    numEta: opts?.numEta ?? 0,
  }),
  initial: (opts) =>
    defaultState({
      E: { input: "dom virtual", tools: [], lastObservation: "", live: false },
      C: defaultControl({
        seed: opts?.seed ?? 0,
        temperature: opts?.temperature ?? 0,
        bestOfK: opts?.bestOfK ?? 1,
        graphId: "word-reverse",
        capabilities: [],
      }),
      S: defaultSlowPointer({ modelId: opts?.modelId ?? "toy-naive" }),
    }),
};

// ---------------------------------------------------------------------------
// Task 2: calculator  (simulated tools: add, mul)
// Target: (3+5)*2 = 16. Naive greedy emits a wrong closed-form guess.
// ---------------------------------------------------------------------------

const CALC_VOCAB = [
  "tool:add:3,5",
  "tool:mul:3,2",
  "tool:mul:5,2",
  "tool:mul:8,2",
  "answer:10",
  "answer:16",
  "answer:11",
  "stop",
] as const;

const calcLogits: LogitMap = (state, vocab) => {
  const out: Record<string, number> = {};
  for (const v of vocab) out[v] = 0.2;
  const hasSum = state.M["tool:add"] === "8";
  const adapted = state.S.modelId.includes("adapted");
  if (adapted) {
    if (!hasSum) out["tool:add:3,5"] = 5;
    else out["tool:mul:8,2"] = 5;
    return out;
  }
  // Naive: jump to a plausible but wrong answer, or multiply the wrong pair.
  if (!hasSum) {
    out["answer:10"] = 3.2;
    out["tool:mul:3,2"] = 2.4;
    out["tool:add:3,5"] = 1.8;
  } else {
    out["tool:mul:8,2"] = 3.8;
    out["answer:16"] = 2.2;
    out["answer:10"] = 0.8;
  }
  return out;
};

const calcEnv: EnvKernel = (state, action) => {
  if (action.kind === "tool" && action.toolName === "add") {
    const [a, b] = (action.toolArgs ?? "0,0").split(",").map(Number);
    const r = String((a ?? 0) + (b ?? 0));
    return { E: { ...state.E, lastObservation: r }, o: textObs(r, "env") };
  }
  if (action.kind === "tool" && action.toolName === "mul") {
    const [a, b] = (action.toolArgs ?? "0,0").split(",").map(Number);
    const r = String((a ?? 0) * (b ?? 0));
    return { E: { ...state.E, lastObservation: r }, o: textObs(r, "env") };
  }
  if (action.text.startsWith("answer:")) {
    const r = action.text.slice("answer:".length);
    return { E: { ...state.E, lastObservation: r }, o: textObs(r, "env") };
  }
  return { E: state.E, o: textObs(state.E.lastObservation || "ok", "env") };
};

export const CALCULATOR: TaskSpec = {
  id: "calculator",
  input: "(3+5)*2",
  expected: "16",
  vocab: CALC_VOCAB,
  tools: ["add", "mul"],
  maxSteps: 6,
  success: (s) => s.E.lastObservation === "16",
  failure: (s) =>
    s.H.filter((h) => h.startsWith("a:stop")).length > 0 && s.E.lastObservation !== "16",
  spec: (opts) => ({
    vocab: CALC_VOCAB,
    logits: calcLogits,
    env: calcEnv,
    mem: diracMem,
    ctrl: diracCtrl,
    numEta: opts?.numEta ?? 0,
  }),
  initial: (opts) =>
    defaultState({
      E: { input: "(3+5)*2", tools: ["add", "mul"], lastObservation: "", live: false },
      C: defaultControl({
        seed: opts?.seed ?? 0,
        temperature: opts?.temperature ?? 0,
        bestOfK: opts?.bestOfK ?? 1,
        graphId: "calculator",
        capabilities: ["add", "mul"],
      }),
      S: defaultSlowPointer({ modelId: opts?.modelId ?? "toy-naive" }),
    }),
};

// ---------------------------------------------------------------------------
// Task 3: retrieval-qa  (simulated public fact store)
// Question: "What year was ICLR founded?"  Gold: 2013.
// Tool search(query) returns a snippet. Without retrieval the greedy year is wrong.
// ---------------------------------------------------------------------------

const FACTS: Record<string, string> = {
  iclr: "The International Conference on Learning Representations (ICLR) was founded in 2013.",
  neurips: "NeurIPS (originally NIPS) began in 1987.",
  icml: "ICML traces to a 1980 workshop; the modern conference series is later.",
};

const QA_VOCAB = [
  "tool:search:iclr",
  "tool:search:neurips",
  "tool:search:icml",
  "answer:1987",
  "answer:2013",
  "answer:2024",
  "stop",
] as const;

const qaLogits: LogitMap = (state, vocab) => {
  const out: Record<string, number> = {};
  for (const v of vocab) out[v] = 0.15;
  const retrieved = (state.M["tool:search"] ?? "").includes("2013");
  const adapted = state.S.modelId.includes("adapted");
  if (adapted || retrieved) {
    out["answer:2013"] = 4.5;
    out["tool:search:iclr"] = 1.0;
  } else {
    out["answer:1987"] = 3.0;
    out["answer:2024"] = 2.2;
    out["tool:search:iclr"] = 1.7;
    out["tool:search:neurips"] = 1.4;
  }
  return out;
};

const qaEnv: EnvKernel = (state, action) => {
  if (action.kind === "tool" && action.toolName === "search") {
    const q = (action.toolArgs ?? "").toLowerCase();
    const hit = FACTS[q] ?? "no results";
    return { E: { ...state.E, lastObservation: hit }, o: textObs(hit, "env") };
  }
  if (action.text.startsWith("answer:")) {
    const r = action.text.slice("answer:".length);
    return { E: { ...state.E, lastObservation: r }, o: textObs(r, "env") };
  }
  return { E: state.E, o: textObs(state.E.lastObservation || "ok", "env") };
};

export const RETRIEVAL_QA: TaskSpec = {
  id: "retrieval-qa",
  input: "What year was ICLR founded?",
  expected: "2013",
  vocab: QA_VOCAB,
  tools: ["search"],
  maxSteps: 5,
  success: (s) => s.E.lastObservation === "2013" || s.E.lastObservation.includes("founded in 2013"),
  failure: (s) =>
    s.H.filter((h) => h.startsWith("a:stop")).length > 0 &&
    s.E.lastObservation !== "2013" &&
    !s.E.lastObservation.includes("founded in 2013"),
  spec: (opts) => ({
    vocab: QA_VOCAB,
    logits: qaLogits,
    env: qaEnv,
    mem: diracMem,
    ctrl: diracCtrl,
    numEta: opts?.numEta ?? 0,
  }),
  initial: (opts) =>
    defaultState({
      E: {
        input: "What year was ICLR founded?",
        tools: ["search"],
        lastObservation: "",
        live: false,
      },
      C: defaultControl({
        seed: opts?.seed ?? 0,
        temperature: opts?.temperature ?? 0,
        bestOfK: opts?.bestOfK ?? 1,
        graphId: "retrieval-qa",
        capabilities: ["search"],
      }),
      S: defaultSlowPointer({ modelId: opts?.modelId ?? "toy-naive" }),
    }),
};

export const TASKS: TaskSpec[] = [WORD_REVERSE, CALCULATOR, RETRIEVAL_QA];

export function taskById(id: string): TaskSpec {
  const t = TASKS.find((x) => x.id === id);
  if (!t) throw new Error(`unknown task ${id}`);
  return t;
}

/** First-passage labels on a finished trajectory. */
export function firstPassage(t: Trajectory): { tauS: number | null; tauF: number | null; pHit: 0 | 1 } {
  return { tauS: t.tauS, tauF: t.tauF, pHit: t.pHit };
}

export function unusedEnvRng(_rng: RNG): void {
  // reserved for live-env jitter in a later experiment
}
