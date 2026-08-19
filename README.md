# Runtime self-improvement of LLM agents

Main paper repo for ICLR 2027: *Runtime Self-Improvement of LLM Agents as a Controlled Hybrid Markov Process*.

The contribution is a **runtime self-improvement framework with theoretical support**. Motivation: a static kernel fitted to a public leaderboard does not transfer to real use or private datasets; after deployment the agent must be able to change \(C\) or \(\theta\). \(\tau^2\) and the 0731 traces are diagnostics that the loop ran, not a bench to max. Not SOTA, not a live \(p_{\mathrm{hit}}\) win, and not a refusal of benchmarks.

An LLM agent is a controlled hybrid Markov process. State \(X=(H,M,E,C)\). Kernel \(K_C\). Three typed noise channels (samp, num, env). Self-observation \(\mathrm{Obs}\) maps traces, first-passage proxies, and completion (hung / transfer / crash) into \(M\). Two licensed interventions: \(I_{\mathrm{loop}}\) mutates the AgentGraph / \(C\) and serving does not pause; \(I_{\mathrm{weight}}\) is an async trainer on a slow clock with a gated \(\theta\) swap while serving continues on the old weights. Arm choice: \(I_{\mathrm{loop}}\) when the miss is a topology / policy attractor; \(I_{\mathrm{weight}}\) when the model does not complete tasks at all (the original reason \(\tau^2\)-bench exists).

\(\tau^2\) and the 0731 rollouts are **diagnostics that the loop ran and that \(\mathrm{Obs}\) chose an arm**. Honest live airline 39/44/41: one-shot \(p_{\mathrm{hit}}=0.333\); generic \(I_{\mathrm{loop}}\) \(0.333\to 0\to 0.333\); policy-checklist \(0.333\to 0\); 39 still misses MSJ4OA (method encodes rules, never gold IDs); 44 transfer / zero upgrades; 41 hang / error. Those numbers license \(I_{\mathrm{weight}}\). The mock \(0\to 0.5\to 1.0\) on `update_task_1` / `impossible_task_1` is a protocol unit test. Static retail \(5\times 4\) \(\mathrm{pass}^k=1\) is \(\mathbb{P}_{C_0}\) at a `wait` fixed point. `FakeTrainer` is a protocol demo, not a measured weight update.

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
- Diagnostic counts (0731 toys; live airline negative \(I_{\mathrm{loop}}\)): `paper/ANALYSIS.md`
- Static \(\tau^2\) retail \(5\times 4\) as \(\mathbb{P}_{C_0}\) (wait fixed point): `paper/ANALYSIS_STATIC_TAU2.md`
- Math \(\leftrightarrow\) runtime map: `docs/VDOM_INTERFACE.md`

Do not invent \(\tau^2\) scores. Do not claim SOTA. Do not treat the mock loop or the retail 1.0 as an ICLR result.
