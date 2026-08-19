/**
 * Typed objects for the hybrid agent process.
 *
 *   X_n = (H_n, M_n, E_n, C_n) ∈ 𝒱* × ℳ × ℰ × 𝒞
 *
 * One step is a composition of kernels, not a diffusion. See paper/FRAMEWORK.md.
 */

export type NoiseChannel = "samp" | "num" | "env";

/** Control configuration C: AgentGraph + decoding knobs. */
export type Control = {
  temperature: number;
  seed: number;
  topP?: number;
  /** Named support restriction (constrained decoding / grammar). */
  grammar?: readonly string[];
  /** Named validator; rejection kernel or support restriction. */
  validator?: "none" | "valid-action" | "numeric" | "nonempty";
  /** If true, freeze remaining branching (commit gate). */
  commit: boolean;
  bestOfK: number;
  modelId: string;
  adapterId?: string;
  capabilities: readonly string[];
  graphId: string;
};

export type EnvState = {
  input: string;
  tools: readonly string[];
  lastObservation: string;
  /** false = replay / simulated; true = live tool or clock. */
  live: boolean;
};

export type HybridState = {
  H: string[];
  M: Record<string, string>;
  E: EnvState;
  C: Control;
};

export type Action = {
  kind: "text" | "tool";
  text: string;
  toolName?: string;
  toolArgs?: string;
};

export type Observation = {
  text: string;
  channel: NoiseChannel;
};

export type StepTrace = {
  n: number;
  action: Action;
  observation: Observation;
  logits: Record<string, number>;
  perturbedLogits?: Record<string, number>;
  gap: number;
  tokenFlipped: boolean;
  channels: NoiseChannel[];
  memoryAfter: Record<string, string>;
};

export type Outcome = "success" | "failure" | "timeout";

export type Trajectory = {
  taskId: string;
  seed: number;
  temperature: number;
  modelId: string;
  provider: string;
  steps: StepTrace[];
  outcome: Outcome;
  tauS: number | null;
  tauF: number | null;
  pHit: 0 | 1;
  cost: number;
};

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CompleteOpts = {
  temperature?: number;
  seed?: number;
  role?: string;
};

export type Provider = {
  name: string;
  model?: string;
  complete(msgs: Message[], opts?: CompleteOpts): Promise<string>;
};

export type LogitMap = (state: HybridState, vocab: readonly string[]) => Record<string, number>;

export function defaultControl(partial?: Partial<Control>): Control {
  return {
    temperature: 0,
    seed: 0,
    commit: false,
    bestOfK: 1,
    modelId: "toy-naive",
    capabilities: [],
    graphId: "one-shot",
    validator: "none",
    ...partial,
  };
}

export function defaultState(partial?: Partial<HybridState>): HybridState {
  return {
    H: [],
    M: {},
    E: {
      input: "",
      tools: [],
      lastObservation: "",
      live: false,
    },
    C: defaultControl(),
    ...partial,
  };
}
