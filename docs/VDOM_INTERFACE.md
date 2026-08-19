# Map X, K, C onto vdom-harness

This repo (`agent-stochastic-dynamics`) is the main ICLR 2027 paper repo: theory, kernel, experiments, draft.

Accompanying implementation (submitted with the paper, not a side project, not related-work-only): https://github.com/keejkrej/vdom-harness

Do not clone. Link only. After PR #2 (model bind) and PR #3 (improveLoop).

The runtime is a self-observing agent that reengineers its loop and/or dispatches async weight updates. Papers, blogs, GitHub, X, and other agents are inputs to that agent, not the product.

## State

| Math | vdom |
| --- | --- |
| H | messages built in src/runtime.ts (system + user + traces) |
| M | memoryStore in src/runtime.ts; Trace[] on PhysicalNode |
| E | tools / capability runners; simulated or live |
| C | AgentGraph + node props (model, capabilities, status, adapterRef) |
| Obs(traces) | traces + runBenchmark.score; should become a first-class memory write |
| z = Pi(X) | optional embedding; not the state |

## Kernel pieces

| Math | vdom |
| --- | --- |
| f_theta | Provider.complete; PhysicalNode.provider after reconcile bind |
| P^dec / samp | temperature on complete(); DeterministicProvider = Dirac |
| P^num | not logged yet; logit-gap proxy belongs on traces |
| P^env | mounted CapabilityFn; tool results |
| P^mem | memory node writes in runtime.ts |
| P^ctrl | scientist.ts evolveOnce; improve.ts improveLoop |
| reconcile | src/reconciler.ts propsChanged, mount/update/retain/unmount |

## Dual intervention

| Arm | vdom |
| --- | --- |
| I_loop | scientist emits AgentGraph; reconcile mutates composition of K |
| I_weight spawn | trainer.ts Trainer.train(traces) -- out of process; does not change f_θ |
| I_weight mount | lifecycle.ts gateAdapter; PhysicalNode.adapter; AgentNode.model jump |
| rollback | unmountAdapterOnFailure; unmount = rollback |
| eval gate | runBenchmark score = empirical p_hit; τ² pass^k when that is the gate |
| runtime Δ^k | same τ² task ids before vs after improveLoop; after-table is TO RUN |

## Files

- src/ir.ts -- AgentGraph, AgentNode.model, MountStatus, adapterRef
- src/reconciler.ts -- propsChanged, PhysicalNode.provider / capability / adapter
- src/runtime.ts -- memoryStore, traces, providerForNode
- src/providers.ts -- DeterministicProvider (Dirac samp), resolveProvider
- src/capability.ts -- sandboxValidate, propose/mount/unmount
- src/lifecycle.ts -- gateCapability, gateAdapter, rollback
- src/trainer.ts -- Trainer port, AdapterArtifact
- src/improve.ts -- improveLoop modes topology / capability / adapter
- src/benchmarks.ts -- runBenchmark score; add tau_S tomorrow
