# Self-improvement at runtime

Main paper repo for ICLR 2027: *Self-Improvement at Runtime: Dual Intervention on the Loop and on the Weights*.

A vdom agent observes itself and improves while serving. From traces it either mutates its AgentGraph ($I_{\mathrm{loop}}$) or dispatches an async trainer ($I_{\mathrm{weight}}$). Serving continues on the old $f_\theta$ until a gated mount. The figure is $\mathrm{pass}^k_{\mathrm{before}}$ vs $\mathrm{pass}^k_{\mathrm{after}}$ on the same tasks after $\mathrm{Obs}$ fires.

Theory (hybrid state $X=(H,M,E,C)$, kernel $K_C$, three typed noise channels, two clocks, first-passage $\mathrm{pass}^k$, lemmas) is first-class, not an appendix.

## Two artifacts (submitted together)

| Repo | Role |
| --- | --- |
| **This repo** (`agent-stochastic-dynamics`) | Theory, typed-noise kernel, experiments, ICLR draft |
| [`vdom-harness`](https://github.com/keejkrej/vdom-harness) | Accompanying implementation: `improveLoop` + `tau2_vdom` (`--agent vdom`). Submitted with the paper. Not a side project and not related-work-only. Do not clone into this tree; link only. |

Papers, blogs, GitHub, X, and other agents are **inputs** to that runtime, not the product.

## Draft and maps

- ICLR 2027 draft: `paper/iclr2027/main.tex`
- Venue track: `paper/NOTES_VENUE.md`
- Runtime-improvement protocol (TO RUN after-table; 0731 diagnostic licenses $I_{\mathrm{loop}}$ first; 5×4 retail $1.0$ is a ceiling): `paper/ANALYSIS.md`
- Math $\leftrightarrow$ runtime map: `docs/VDOM_INTERFACE.md`

Do not invent $\tau^2$-after numbers. Toy word-reverse is not the eval. The live retail $5\times 4$ one-shot with $\mathrm{pass}^k=1.0$ is a static score on an easy slice — not self-improvement.
