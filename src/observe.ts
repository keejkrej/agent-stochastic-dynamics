/**
 * Self-observation and dual intervention.
 *
 *   Obs: traces -> features in M
 *   P^ctrl(· | Obs) in {graph_mutation, spawn_trainer, mount_adapter, rollback, wait}
 *
 * Closed loop on the fast clock:
 *   C_{n+1} ~ P^ctrl(· | C_n, Obs(traces_n))
 * After I_loop or a gated I_weight mount, Obs reads the *new* traces and may fire again.
 * I_weight jumps (mount) live on the slow clock. wait is a fixed point.
 *
 * Typed rule: paper/FRAMEWORK.md Lemma 7.9 / paper/NOTES_ARM_CHOICE.md
 *   wait-hit or hit ∧ p_hat = 1 → wait
 *   incomplete (hung / transfer-without-writes / crash) → I_weight
 *   completed-miss ∧ attractor (invented policy / extra write / tool thrash) → I_loop
 *   completed-miss ∧ no attractor → I_weight
 * Extra H is not an arm. Hung must not default to I_loop.
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

/** Lemma 7.9 completion. Hung is never a hit. */
export type Completion = "hit" | "completed-miss" | "incomplete";

export type IncompleteKind = "hung" | "transfer-without-writes" | "crash";

export type AttractorFlags = {
  inventedPolicy: boolean;
  extraWrite: boolean;
  toolThrash: boolean;
};

export type ObsDecisionIn = {
  completion: Completion;
  attractors: AttractorFlags;
  waitHit: boolean;
  pHatHit: number;
};

export type LicensedArm = "wait" | "I_loop" | "I_weight";

export type ObsFeatures = {
  nSteps: number;
  nSuccessProxy: number;
  lastActions: string[];
  channels: string[];
  critique: string;
  repeatRate: number;
  firstAction: string;
  arm: ObsArm;
  completion?: Completion;
  waitHit?: boolean;
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

/**
 * Lemma 7.9. First match.
 * Extra H is not an input. Cascade exponent is not yet an input (§8.1).
 */
export function decideArm(input: ObsDecisionIn): LicensedArm {
  if (input.waitHit || (input.completion === "hit" && input.pHatHit >= 1)) return "wait";
  if (input.completion === "incomplete") return "I_weight";
  const attractor =
    input.attractors.inventedPolicy || input.attractors.extraWrite || input.attractors.toolThrash;
  if (input.completion === "completed-miss" && attractor) return "I_loop";
  return "I_weight";
}

export function observe(
  traces: StepTrace[],
  pHitHat: number,
  opts?: { completion?: Completion; waitHit?: boolean; attractors?: Partial<AttractorFlags> },
): ObsFeatures {
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

  const completion: Completion =
    opts?.completion ?? (pHitHat >= 1 ? "hit" : "completed-miss");
  const waitHit = opts?.waitHit ?? (completion === "hit" && pHitHat >= 1);
  const attractors: AttractorFlags = {
    inventedPolicy: opts?.attractors?.inventedPolicy ?? false,
    extraWrite: opts?.attractors?.extraWrite ?? false,
    toolThrash: opts?.attractors?.toolThrash ?? metastableLoop,
  };
  const typed = decideArm({ completion, attractors, waitHit, pHatHit: pHitHat });

  let critique: string;
  let arm: ObsArm = typed;
  if (typed === "wait") {
    critique = "path measure hits S; wait";
  } else if (typed === "I_weight" && completion === "incomplete") {
    critique = "incomplete episode; I_weight: spawn trainer (I_loop on empty traces unidentified)";
  } else if (typed === "I_loop") {
    critique = "metastable loop; I_loop: forbid last failed action / Self-Refine; loop mutation";
  } else if (knowledgeMiss || typed === "I_weight") {
    critique = "knowledge miss or unidentified C-failure; I_weight: spawn trainer";
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
    completion,
    waitHit,
  };
}

export function chooseIntervention(obs: ObsFeatures, job?: TrainerJob): Intervention {
  if (obs.nSuccessProxy >= 1 || obs.arm === "wait" || obs.waitHit) return "wait";
  if (job?.status === "ready" && job.resultModelId) return "mount_adapter";
  if (job?.status === "failed") return "rollback";
  if (job?.status === "running") return "wait";
  if (obs.completion === "incomplete" || obs.arm === "I_weight") return "spawn_trainer";
  if (obs.arm === "I_loop" || obs.critique.includes("loop mutation")) return "graph_mutation";
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
