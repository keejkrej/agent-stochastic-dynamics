# Runtime self-improvement of LLM agents

Main paper repo for ICLR 2027: *Runtime Self-Improvement of LLM Agents as a Controlled Hybrid Markov Process*.

**Self-improvement**, here, is \(\mathrm{Obs}\) plus a licensed edit of graph \(C\) or catalog pointer \(S\). Not weights. Dual implemented arms: \(I_{\mathrm{loop}}\) (graph \(C\)) | \(I_{\mathrm{sku}}\) (catalog pointer). Wait is the identity. Completed miss with no identified attractor of \(C\) also licenses \(I_{\mathrm{sku}}\) (Lemma 7.9 clause 4). \(I_{\mathrm{sku}}\) is the stand-in slow cell, not the contribution. License is an incomplete episode, not price. Typed \(\mathrm{Obs}\) is the controller log of [vdom-harness PR #11](https://github.com/keejkrej/vdom-harness/pull/11) (hung-first: 39 \(I_{\mathrm{loop}}\) / 44 \(I_{\mathrm{sku}}\) / `waitKept` empty). \(S\) is specified in `paper/FRAMEWORK.md`; the serving-id cell in the harness is still `n.model`. \(\tau^2\) and the 0731 traces are diagnostics, not a bench to max.

\(\tau^2\) and the 0731 rollouts are **diagnostics that the loop ran and that \(\mathrm{Obs}\) chose an arm**. Held-out airline (the eval; checklist not written for these IDs): one policy-checklist \(I_{\mathrm{loop}}\) moved \(p_{\mathrm{hit}}\) \(0.7\to 0.9\) at \(k=1\), lifting 23/35/48 and **regressing 18** (\(1\to 0\)). Better than this one-shot control on a \(10\times 1\) slice. Not a reliability claim. The loop is real; the content of \(C\) is a static prior, not self-reflection — not SOTA, not a \(\tau^2\) win. A 3-trial replication on the overfit slice \(39/41/44\) is secondary (\(\mathrm{pass}^3\) stays \(0.333\)); the earlier \(0.333\to 0.667\) was \(n=1\) on that slice. A later self-obs run on \(39+44\) (\(0.5\to 0.0\); `experiments/improve-live-0731-self-3944.json`) is another diagnostic: the loop ran, \(\mathrm{Obs}\) chose \(I_{\mathrm{loop}}\) on the self path, and an unscoped global \(C\) change onto a wait-hit is an illegal apply — not a SOTA miss. Apply is now scoped ([vdom-harness PR #10](https://github.com/keejkrej/vdom-harness/pull/10): wait-hit keeps \(C_0\)). Post-gate hang on 44 licenses \(I_{\mathrm{sku}}\) (`experiments/improve-live-0731-self-3944-postgate.json`). `servingPaused=false`. If a mount never rebinds serving to 0813, there was no jump. Do not report \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\) as a result. The mock \(0\to 0.5\to 1.0\) is a protocol unit test, not a result. Static retail \(5\times 4\) \(\mathrm{pass}^k=1\) is \(\mathbb{P}_{C_0}\) at a `wait` fixed point.

## Two artifacts (submitted together)

| Repo | Role |
| --- | --- |
| **This repo** (`agent-stochastic-dynamics`) | Theory, typed-noise kernel, experiments, ICLR draft |
| [`vdom-harness`](https://github.com/keejkrej/vdom-harness) | Accompanying runtime: `improveLoop` iterates given \(\mathrm{Obs}\); `tau2_vdom` (`--agent vdom`). Submitted with the paper. Not a side project and not related-work-only. Do not clone into this tree; link only. |

Papers, blogs, GitHub, X, and other agents are **inputs** to that runtime, not the product.

## Draft and maps

- ICLR 2027 draft: `paper/iclr2027/main.tex`
- Venue track (ICLR 2027 first; contribution = framework+theory; experiments = existence/arm-choice): `paper/NOTES_VENUE.md`
- Framework: `paper/FRAMEWORK.md` (Lemma 7.9 typed Obs rule; Proposition 7.8a why two arms)
- Arm-choice note (types, falsifier, hang licenses \(I_{\mathrm{weight}}\); not a score): `paper/NOTES_ARM_CHOICE.md`
- Diagnostic counts (0731 toys; held-out airline \(I_{\mathrm{loop}}\) \(0.7\to 0.9\) at \(k=1\), including a regression; self-obs \(39+44\) \(0.5\to 0.0\) as illegal-apply evidence, not a lead; post-gate hang as evidence for the rule, not a lead; not SOTA): `paper/ANALYSIS.md`
- Static \(\tau^2\) retail \(5\times 4\) as \(\mathbb{P}_{C_0}\) (wait fixed point): `paper/ANALYSIS_STATIC_TAU2.md`
- Math \(\leftrightarrow\) runtime map: `docs/VDOM_INTERFACE.md`

Do not invent \(\tau^2\) scores. Do not claim SOTA or saturation. Do not treat the mock loop or the retail 1.0 as an ICLR result.
