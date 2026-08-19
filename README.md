# The self-observe / self-improve loop

Main paper repo for ICLR 2027: *The Self-Observe / Self-Improve Loop*.

The process is a closed loop: self-observe → self-improve → self-observe → ⋯. Iterate $P^{\mathrm{ctrl}}(\cdot\mid\mathrm{Obs}(\mathrm{traces}))$ on the fast clock. $I_{\mathrm{loop}}$ mutates the AgentGraph; $I_{\mathrm{weight}}$ dispatches an async trainer (serving keeps old $f_\theta$; gated mount on the slow clock). After either intervention the agent observes the *new* traces and may intervene again. `wait` is a fixed point. The figure is $\mathrm{pass}^k(t)$ versus cycle $t$, not a one-shot before/after.

Theory (hybrid state $X=(H,M,E,C)$, kernel $K_C$, three typed noise channels, two clocks, first-passage $\mathrm{pass}^k$, lemmas) is first-class, not an appendix.

## Two artifacts (submitted together)

| Repo | Role |
| --- | --- |
| **This repo** (`agent-stochastic-dynamics`) | Theory, typed-noise kernel, experiments, ICLR draft |
| [`vdom-harness`](https://github.com/keejkrej/vdom-harness) | Accompanying implementation: `improveLoop` iterates given $\mathrm{Obs}$; `tau2_vdom` (`--agent vdom`). Submitted with the paper. Not a side project and not related-work-only. Do not clone into this tree; link only. |

Papers, blogs, GitHub, X, and other agents are **inputs** to that runtime, not the product.

## Draft and maps

- ICLR 2027 draft: `paper/iclr2027/main.tex`
- Venue track: `paper/NOTES_VENUE.md`
- Closed-loop protocol (TO RUN $\mathrm{pass}^k(t)$; 0731 licenses $I_{\mathrm{loop}}$ on cycle 0; 5×4 retail $1.0$ is a `wait` ceiling): `paper/ANALYSIS.md`
- Static $\tau^2$ retail $5\times 4$ as $\mathbb{P}_{C_0}$ (wait fixed point; does not replace the cycle table): `paper/ANALYSIS_STATIC_TAU2.md`
- Math $\leftrightarrow$ runtime map: `docs/VDOM_INTERFACE.md`

Do not invent $\tau^2$ cycle scores. Toy word-reverse is not the eval. The live retail $5\times 4$ one-shot with $\mathrm{pass}^k=1.0$ is a static score on an easy slice — not the loop.
