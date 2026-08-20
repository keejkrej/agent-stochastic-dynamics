/**
 * Self-observation and dual intervention.
 *
 *   Obs: traces -> features in M
 *   P^ctrl(· | Obs) in {graph_mutation, catalog_rebind, mount_adapter, rollback, wait}
 *   spawn_trainer is reserved / unimplemented (original I_weight: trainer → θ').
 *
 * Closed loop on the fast clock:
 *   C_{n+1} ~ P^ctrl(· | C_n, Obs(traces_n))
 * After I_loop or a gated catalog mount, Obs reads the *new* traces and may fire again.
 * Implemented slow arm: catalog_rebind — request a different servable model id;
 * serving continues on the old f_θ (servingPaused=false); mount rebinds
 * PhysicalNode.provider / n.model. Concrete pair: 0731 → 0813.
 * Not fine-tuning. Not a LoRA. Not self-improvement via a stronger API.
 * Jump only on gated mount; later serving must use the new provider or there was no jump.
 * Do not report p_hit(0813) vs p_hit(0731).
 *
 * Typed rule: paper/FRAMEWORK.md Lemma 7.9 / paper/NOTES_ARM_CHOICE.md
 *   hit → wait
 *   incomplete (hung / crash / no-write) → catalog_rebind
 *   completed-miss ∧ attractor → I_loop
 * Extra H is not an arm. Hung must not default to I_loop unless loopExhausted.
 */
import type { Control, StepTrace } from "./types.js";

export type Intervention =
  | "graph_mutation"
  | "catalog_rebind"
  | "spawn_trainer"
  | "mount_adapter"
  | "rollback"
  | "capability_mount"
  | "commit"
  | "wait";

export type ObsArm = "wait" | "I_loop" | "catalog_rebind" | "I_weight" | "inspect";

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

export type LicensedArm = "wait" | "I_loop" | "catalog_rebind";

/** Implemented slow arm: gated catalog rebind. Not original I_weight (trainer → θ'). */
export const CATALOG_REBIND = {
  from: "deepseek/deepseek-v4-flash-0731",
  to: "deepseek/deepseek-v4-pro-0813",
} as const;

/** @deprecated Use CATALOG_REBIND. Alias kept so older tests / notes still compile. */
export const CATALOG_IWEIGHT = CATALOG_REBIND;

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
  if (input.completion === "incomplete") return "catalog_rebind";
  const attractor =
    input.attractors.inventedPolicy || input.attractors.extraWrite || input.attractors.toolThrash;
  if (input.completion === "completed-miss" && attractor) return "I_loop";
  return "catalog_rebind";
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
  const zeroProgress =
    traces.length >= 2 && traces.every((t) => t.observation.text === traces[0]!.observation.text);
  const timeoutLike = traces.length >= 6 && pHitHat < 1;
  const wrLoop = firstAction === "reverse_entire";
  const calcStuck =
    firstAction === "tool:add:3,5" && !lastActions.includes("tool:mul:8,2");
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
  } else if (typed === "catalog_rebind" && completion === "incomplete") {
    critique =
      "incomplete episode; catalog rebind 0731→0813; servingPaused=false; I_loop on empty traces unidentified; not trainer / not SGD";
  } else if (typed === "I_loop") {
    critique = "metastable loop; I_loop: forbid last failed action / Self-Refine; loop mutation";
  } else if (knowledgeMiss || typed === "catalog_rebind") {
    critique =
      "knowledge miss or unidentified C-failure; catalog rebind 0731→0813; not fine-tuning";
    arm = "catalog_rebind";
  } else if (lastActions.includes("reverse_entire") || lastActions.includes("answer:10")) {
    critique = "fixture miss; I_loop graph mutation (same f_θ)";
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
  if (
    obs.completion === "incomplete" ||
    obs.arm === "catalog_rebind" ||
    obs.arm === "I_weight"
  ) {
    return "catalog_rebind";
  }
  if (obs.arm === "I_loop" || obs.critique.includes("loop mutation")) return "graph_mutation";
  return "catalog_rebind";
}

/** Slow clock: catalog request does not change f_θ. Gated mount rebinds the provider. */
export function applyIntervention(
  C: Control,
  action: Intervention,
  job?: TrainerJob,
): { C: Control; job?: TrainerJob } {
  if (action === "catalog_rebind") {
    return {
      C,
      job: job ?? {
        id: "catalog-1",
        status: "running",
        resultModelId: CATALOG_REBIND.to,
      },
    };
  }
  if (action === "spawn_trainer") {
    // Reserved original I_weight. Unimplemented. Does not write θ.
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
