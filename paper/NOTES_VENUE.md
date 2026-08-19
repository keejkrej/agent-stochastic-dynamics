# Venue track

First target: **ICLR 2027**. Abstract 18 Sep 2026 AoE, paper 25 Sep 2026 AoE.
Backup: ICML 2027 (Jan 2027) if ICLR slips.
PRL is not the first submission.

## Contribution (locked)

The paper establishes a **runtime self-improvement framework with theoretical support**. Motivation: benchmaxxing a static kernel on a public leaderboard does not transfer to real use or private datasets. After deployment the agent must be able to change \(C\) or \(\theta\). \(\tau^2\) stays as a diagnostic that the loop ran, not a bench to max. This is not a refusal of benchmarks.

- An LLM agent is a controlled hybrid Markov process. State \(X=(H,M,E,C)\). Kernel \(K_C\). Three typed noise channels (samp, num, env).
- \(\mathrm{Obs}\) maps traces + first-passage proxies + completion (hung / transfer / crash) into \(M\).
- Two licensed interventions: \(I_{\mathrm{loop}}\) (mutate AgentGraph / \(C\); serving does not pause) and \(I_{\mathrm{weight}}\) (async trainer on a slow clock; gated \(\theta\) swap; serving continues on old weights).
- Arm choice: \(I_{\mathrm{loop}}\) when the miss is a topology / policy attractor. \(I_{\mathrm{weight}}\) when the model does not complete tasks at all (the original reason \(\tau^2\)-bench exists).

**Experiments are existence and arm-choice diagnostics**, not a \(\tau^2\) SOTA attempt and not “we improve \(\tau^2\) airline.”

Do not claim SOTA. Do not claim saturation. Do not invent scores. Do not encode gold reservation IDs as the method. Do not treat \(I_{\mathrm{weight}}\) as measured while only `FakeTrainer` exists — describe the protocol and the two clocks; label the stub as a protocol demo.

Done when the abstract cannot be misread as a \(\tau^2\) SOTA paper.

## Two artifacts (submitted together)

This repository is the **main paper repo**: theory, typed-noise kernel, experiments, ICLR draft.

[vdom-harness](https://github.com/keejkrej/vdom-harness) is the **accompanying implementation**, submitted with the paper. It is not a side project and not related-work-only. The runtime is a self-observing agent that reengineers its loop and/or dispatches async weight updates. Papers, blogs, GitHub, X, and other agents are inputs to that runtime, not the product. Do not clone vdom into this tree; link it. `FakeTrainer` in that repo is a protocol demo.

## Why ICLR first

ICLR takes 9-page theory-plus-small-experiments drafts. Reciprocal reviewing and the one-paper cap for authors without a listed venue paper apply; OpenReview profiles must exist before the abstract deadline. Theory is first-class, not an appendix. The small experiments are existence / arm-choice, which matches that format. They are not a reason to rewrite the paper as a benchmark paper.

ICML is the same intellectual home with a later deadline. Use it if the ICLR draft is not tight by mid-September (intro still readable as a \(\tau^2\) score paper, or \(I_{\mathrm{weight}}\) described as measured when only the stub exists).

## What would make a PRL letter

PRL rejects framework surveys. Extract a 4-page letter only if one crisp physics result exists, with one figure:

- gap-sensitivity of numerical noise (Lemma 3.5 / 7.2) plus
- a measured cascade exponent on a coupling, plus
- a single plot (Hamming vs n after a one-bit memory split).

Until that figure is from a real stack (not only the toy kernel), do not submit to PRL. See paper/prl/.

## Experiments that remain (not the contribution)

The contribution does **not** wait on a \(\tau^2\) win. Remaining engineering, if any:

- A real slow-clock trainer behind the `Trainer` port (HF Jobs / LoRA). Until then, `FakeTrainer` stays labeled a protocol demo.
- Three-channel measurement on vLLM / llama.cpp / OpenRouter with replay.
- Cascade on vdom-harness word-reverse vs a tool-using task (not only src/tasks.ts).
- When best-of-k with an *external* grader beats tau-down at fixed compute.
- Safety: scientist-emitted C as an untrusted intervention.

Do not invent \(\tau^2\) cycle scores. Do not add a larger airline table to “save” the paper.

## Honest diagnostic numbers (cite; do not spin)

Held-out airline (the eval; checklist not written for these IDs), 0731, \(k=1\): one policy-checklist \(I_{\mathrm{loop}}\) \(0.7\to 0.9\), including a regression on 18 (`experiments/improve-live-0731-heldout.json`). Better than this one-shot control on a \(10\times 1\) slice. Not a reliability claim. The loop is real; the content of \(C\) is a static prior, not self-reflection. Discovery slice = test-hacking risk. Held-out = weak generalization, including a regression on a task \(\mathrm{Obs}\) marked `wait`. Not SOTA, not a \(\tau^2\) win. See `paper/ANALYSIS.md` §0c. Replication on the overfit slice \(39/41/44\times 3\): \(\mathrm{pass}^1\) \(0.333\to 0.556\), \(\mathrm{pass}^2\) \(0.333\to 0.444\), \(\mathrm{pass}^3\) \(0.333\to 0.333\) (`experiments/improve-live-0731-replication.json`). The earlier \(0.333\to 0.667\) was \(n=1\) on that slice — do not lead with it. Remaining transfers license \(I_{\mathrm{weight}}\); `FakeTrainer` stays a protocol stub.

Self-obs on airline \(39+44\) (live 0731, 2026-08-19, 1 trial, max-rounds 1, `selfObsPath=self`): \(p_{\mathrm{hit}}\) \(0.5\to 0.0\) (`experiments/improve-live-0731-self-3944.json`). Round 0: 39 miss (Obs \(I_{\mathrm{loop}}\)); 44 hit (Obs `wait`). Round 1: 39 still miss; 44 regressed \(1\to 0\) after a global `cancel_policy`. Mid-turn get/set: zero calls. `servingPaused` false. Not \(I_{\mathrm{weight}}\). Same shape as held-out 18: wait-hit still got a global \(C\) change — an illegal apply, not a SOTA miss. Evidence the loop ran and Obs chose \(I_{\mathrm{loop}}\). Do not lead with \(0.5\to 0.0\). Runtime fix: [vdom-harness PR #10](https://github.com/keejkrej/vdom-harness/pull/10) (merged 2026-08-19) scopes apply — wait-hit keeps \(C_0\). No new live 0731 numbers after the gate. Still missing: mid-turn get/set never called; 39’s remaining miss is not that PR; \(I_{\mathrm{weight}}\) is not licensed.

Mock `update_task_1` / `impossible_task_1`: \(0\to 0.5\to 1.0\). Protocol unit test, not an ICLR result.

Static retail \(5\times 4\) \(\mathrm{pass}^k=1\): \(\mathbb{P}_{C_0}\) at a wait fixed point, not self-improvement.

0731 toys: sequential 0/12, retrieval 12/12. License \(I_{\mathrm{loop}}\) on topology attractors.

Live traces in this repo use deepseek/deepseek-v4-flash-0731 only.
