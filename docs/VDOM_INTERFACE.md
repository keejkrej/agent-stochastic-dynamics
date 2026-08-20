# Map X, K, C onto vdom-harness

This repo (`agent-stochastic-dynamics`) is the main ICLR 2027 paper repo: **framework + theory**, typed-noise kernel, existence / arm-choice diagnostics, draft. Not a \(\tau^2\) score paper.

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
| Obs(traces, first-passage, completion) | traces + runBenchmark.score + hung / transfer / crash; first-class memory write |
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

## Dual intervention (licensed arms)

| Arm | vdom | License |
| --- | --- | --- |
| I_loop | scientist emits AgentGraph; reconcile mutates composition of K; same SKU; serving does not pause | completed miss with a topology / policy attractor (Lemma 7.9) |
| I_sku (available f_θ cell) | catalog rebind because we cannot train; serving keeps current f_θ (`servingPaused=false`); gated mount rebinds PhysicalNode.provider / n.model | incomplete (hang / crash / no-write). A cell, not the claim. SKU swap alone is not novel. Do not sell p_hit(0813)−p_hit(0731). |
| sku mount | lifecycle.ts gateAdapter; rebind PhysicalNode.provider / n.model | eval gate passes (Lemma 7.7, 7.8) |
| spawn_trainer | FakeTrainer | related work / unimplemented future, not the claim |
| rollback | unmountAdapterOnFailure; unmount = rollback | post-mount regression |
| eval gate | runBenchmark score = empirical p_hit; τ² pass^k when that is the *gate*, not the paper claim | fixture first-passage |
| existence loop | iterate improveLoop given Obs | diagnostic that the loop ran |

Do not encode gold reservation IDs as the method. A policy-checklist node encodes rules.

## Files

- src/ir.ts -- AgentGraph, AgentNode.model, MountStatus, adapterRef
- src/reconciler.ts -- propsChanged, PhysicalNode.provider / capability / adapter
- src/runtime.ts -- memoryStore, traces, providerForNode
- src/providers.ts -- DeterministicProvider (Dirac samp), resolveProvider
- src/capability.ts -- sandboxValidate, propose/mount/unmount
- src/lifecycle.ts -- gateCapability, gateAdapter, rollback
- src/trainer.ts -- Trainer port, FakeTrainer (stub), AdapterArtifact
- src/improve.ts -- improveLoop modes topology / capability / adapter
- src/benchmarks.ts -- runBenchmark score; add tau_S tomorrow
