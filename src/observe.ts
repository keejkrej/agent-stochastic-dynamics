/**
 * Self-observation and dual intervention.
 *
 *   Obs: traces -> features in M
 *   P^ctrl(· | Obs) in {graph_mutation, spawn_trainer, mount_adapter, rollback, wait}
 *
 * Fast clock: serving kernel. Slow clock: async trainer; f_θ jumps only after a gated mount.
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

export type ObsFeatures = {
  nSteps: number;
  nSuccessProxy: number;
  lastActions: string[];
  channels: string[];
  critique: string;
};

export type TrainerJob = {
  id: string;
  status: "running" | "ready" | "failed";
  artifactId?: string;
  resultModelId?: string;
};

export function observe(traces: StepTrace[], pHitHat: number): ObsFeatures {
  const lastActions = traces.map((t) => t.action.text);
  const channels = [...new Set(traces.flatMap((t) => t.channels))];
  const critique =
    pHitHat >= 1
      ? "path measure hits S; wait"
      : lastActions.includes("reverse_entire") || lastActions.includes("answer:10")
        ? "fixture miss; loop mutation or spawn trainer"
        : "fixture miss; inspect cascade / tools";
  return {
    nSteps: traces.length,
    nSuccessProxy: pHitHat >= 1 ? 1 : 0,
    lastActions,
    channels,
    critique,
  };
}

export function chooseIntervention(obs: ObsFeatures, job?: TrainerJob): Intervention {
  if (obs.nSuccessProxy >= 1) return "wait";
  if (job?.status === "ready" && job.resultModelId) return "mount_adapter";
  if (job?.status === "failed") return "rollback";
  if (job?.status === "running") return "wait";
  if (obs.critique.includes("loop mutation")) return "graph_mutation";
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
