# Runtime self-improvement of LLM agents

Main paper repo for ICLR 2027: *Runtime Self-Improvement of LLM Agents as a Controlled Hybrid Markov Process*.

The contribution is a **runtime self-improvement framework with theoretical support**. Motivation: a static kernel fitted to a public leaderboard does not transfer to real use or private datasets; after deployment the agent must be able to change \(C\) or \(\theta\). \(\tau^2\) and the 0731 traces are diagnostics that the loop ran, not a bench to max. Not SOTA, not saturation, and not a refusal of benchmarks.

An LLM agent is a controlled hybrid Markov process. State \(X=(H,M,E,C)\). Kernel \(K_C\). Three typed noise channels (samp, num, env). Self-observation \(\mathrm{Obs}\) maps traces, first-passage proxies, and completion (hung / transfer / crash) into \(M\). Two licensed interventions: \(I_{\mathrm{loop}}\) mutates the AgentGraph / \(C\) and serving does not pause; \(I_{\mathrm{weight}}\) is an async trainer on a slow clock with a gated \(\theta\) swap while serving continues on the old weights. Arm choice: \(I_{\mathrm{loop}}\) when the miss is a topology / policy attractor; \(I_{\mathrm{weight}}\) when the model does not complete tasks at all (the original reason \(\tau^2\)-bench exists).

\(\tau^2\) and the 0731 rollouts are **diagnostics that the loop ran and that \(\mathrm{Obs}\) chose an arm**. Held-out airline (the eval; checklist not written for these IDs): one policy-checklist \(I_{\mathrm{loop}}\) moved \(p_{\mathrm{hit}}\) \(0.7\to 0.9\) at \(k=1\), lifting 23/35/48 and **regressing 18** (\(1\to 0\)). That diagnoses that \(\mathrm{Obs}\) chose \(I_{\mathrm{loop}}\) and \(C\) moved — not SOTA, not reliability, not a \(\tau^2\) win. A 3-trial replication on the overfit slice \(39/41/44\) is secondary (\(\mathrm{pass}^3\) stays \(0.333\)); the earlier \(0.333\to 0.667\) was \(n=1\) on that slice. Remaining transfers license \(I_{\mathrm{weight}}\). The mock \(0\to 0.5\to 1.0\) on `update_task_1` / `impossible_task_1` is a protocol unit test. Static retail \(5\times 4\) \(\mathrm{pass}^k=1\) is \(\mathbb{P}_{C_0}\) at a `wait` fixed point. `FakeTrainer` is a protocol demo, not a measured weight update.

## Two artifacts (submitted together)

| Repo | Role |
| --- | --- |
| **This repo** (`agent-stochastic-dynamics`) | Theory, typed-noise kernel, experiments, ICLR draft |
| [`vdom-harness`](https://github.com/keejkrej/vdom-harness) | Accompanying runtime: `improveLoop` iterates given \(\mathrm{Obs}\); `tau2_vdom` (`--agent vdom`). Submitted with the paper. Not a side project and not related-work-only. Do not clone into this tree; link only. |

Papers, blogs, GitHub, X, and other agents are **inputs** to that runtime, not the product.

## Draft and maps

- ICLR 2027 draft: `paper/iclr2027/main.tex`
- Venue track (ICLR 2027 first; contribution = framework+theory; experiments = existence/arm-choice): `paper/NOTES_VENUE.md`
- Framework: `paper/FRAMEWORK.md`
- Diagnostic counts (0731 toys; held-out airline \(I_{\mathrm{loop}}\) \(0.7\to 0.9\) at \(k=1\), including a regression; not SOTA): `paper/ANALYSIS.md`
- Static \(\tau^2\) retail \(5\times 4\) as \(\mathbb{P}_{C_0}\) (wait fixed point): `paper/ANALYSIS_STATIC_TAU2.md`
- Math \(\leftrightarrow\) runtime map: `docs/VDOM_INTERFACE.md`

Do not invent \(\tau^2\) scores. Do not claim SOTA or saturation. Do not treat the mock loop or the retail 1.0 as an ICLR result.
