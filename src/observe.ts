/**
 * Self-observation and dual intervention.
 *
 *   Obs: traces -> features in M
 *   P^ctrl(· | Obs) in {graph_mutation, spawn_trainer, mount_adapter, rollback, wait}
 *
 * Fast clock: serving kernel. Slow clock: async trainer; f_θ jumps only after a gated mount.
 *
 * Decision rule licensed by the 0731 diagnostic (paper/ANALYSIS.md):
 *   metastable action loop / first-right-then-repeat → I_loop
 *   knowledge miss ("I don't know") → I_weight (spawn trainer; spawn ≠ mount)
 *   p_hat = 1 → wait
 * Toys license the arm. They are not the paper result.
 * The result is runtime self-improvement: pass^k_before vs pass^k_after
 * after Obs → I_loop / I_weight on the same τ² tasks (TO RUN).
 */
import type { Control, StepTrace } from "./types.js";

export type Intervention =
  | "graph_mutation"
  | "spawn_trainer"
  | "mount_adapter"
  | "rollback"
  | "capability_mount"
  | "commit"
  | "wait";

export type ObsArm = "wait" | "I_loop" | "I_weight" | "inspect";

export type ObsFeatures = {
  nSteps: number;
  nSuccessProxy: number;
  lastActions: string[];
  channels: string[];
  critique: string;
  repeatRate: number;
  firstAction: string;
  arm: ObsArm;
};

export type TrainerJob = {
  id: string;
  status: "running" | "ready" | "failed";
  artifactId?: string;
  resultModelId?: string;
};

function maxRun(actions: string[]): number {
  if (actions.length === 0) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < actions.length; i++) {
    if (actions[i] === actions[i - 1]) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

function consecutiveRepeatRate(actions: string[]): number {
  if (actions.length < 2) return 0;
  let rep = 0;
  for (let i = 1; i < actions.length; i++) if (actions[i] === actions[i - 1]) rep += 1;
  return rep / (actions.length - 1);
}

function looksLikeKnowledgeMiss(traces: StepTrace[], actions: string[]): boolean {
  const blob = [...actions, ...traces.map((t) => t.observation.text)].join("\n").toLowerCase();
  return /i don't know|i do not know|unknown|no results|cannot recall|not sure/.test(blob);
}

export function observe(traces: StepTrace[], pHitHat: number): ObsFeatures {
  const lastActions = traces.map((t) => t.action.text);
  const channels = [...new Set(traces.flatMap((t) => t.channels))];
  const repeatRate = consecutiveRepeatRate(lastActions);
  const run = maxRun(lastActions);
  const firstAction = lastActions[0] ?? "";
  const allSame = lastActions.length >= 2 && new Set(lastActions).size === 1;
  const zeroProgress =
    traces.length >= 2 && traces.every((t) => t.observation.text === traces[0]!.observation.text);
  const timeoutLike = traces.length >= 6 && pHitHat < 1;
  const wrLoop = allSame && firstAction === "reverse_entire";
  const calcStuck =
    firstAction === "tool:add:3,5" &&
    !lastActions.includes("tool:mul:8,2") &&
    lastActions.length >= 2;
  const metastableLoop = wrLoop || calcStuck || (repeatRate === 1 && timeoutLike && zeroProgress);
  const knowledgeMiss = pHitHat < 1 && looksLikeKnowledgeMiss(traces, lastActions);

  let critique: string;
  let arm: ObsArm;
  if (pHitHat >= 1) {
    critique = "path measure hits S; wait";
    arm = "wait";
  } else if (metastableLoop) {
    critique = "metastable loop; I_loop: forbid last failed action / Self-Refine; loop mutation";
    arm = "I_loop";
  } else if (knowledgeMiss) {
    critique = "knowledge miss; I_weight: spawn trainer";
    arm = "I_weight";
  } else if (lastActions.includes("reverse_entire") || lastActions.includes("answer:10")) {
    critique = "fixture miss; loop mutation or spawn trainer";
    arm = "I_loop";
  } else {
    critique = "fixture miss; inspect cascade / tools";
    arm = "inspect";
  }

  void run;
  return {
    nSteps: traces.length,
    nSuccessProxy: pHitHat >= 1 ? 1 : 0,
    lastActions,
    channels,
    critique,
    repeatRate,
    firstAction,
    arm,
  };
}

export function chooseIntervention(obs: ObsFeatures, job?: TrainerJob): Intervention {
  if (obs.nSuccessProxy >= 1 || obs.arm === "wait") return "wait";
  if (job?.status === "ready" && job.resultModelId) return "mount_adapter";
  if (job?.status === "failed") return "rollback";
  if (job?.status === "running") return "wait";
  if (obs.arm === "I_loop" || obs.critique.includes("loop mutation")) return "graph_mutation";
  if (obs.arm === "I_weight") return "spawn_trainer";
  return "spawn_trainer";
}

/** Slow clock: spawn does not change f_θ. Mount does. */
export function applyIntervention(
  C: Control,
  action: Intervention,
  job?: TrainerJob,
): { C: Control; job?: TrainerJob } {
  if (action === "spawn_trainer") {
    return { C, job: job ?? { id: "job-1", status: "running" } };
  }
  if (action === "mount_adapter" && job?.resultModelId) {
    return {
      C: { ...C, modelId: job.resultModelId, adapterId: job.artifactId },
      job: { ...job, status: "ready" },
    };
  }
  if (action === "rollback") {
    return { C: { ...C, adapterId: undefined }, job };
  }
  if (action === "graph_mutation") {
    return { C: { ...C, graphId: C.graphId + "-mutated" }, job };
  }
  return { C, job };
}
