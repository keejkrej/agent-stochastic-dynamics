# Self-observing LLM agents

Main paper repo for ICLR 2027: *Self-Observing LLM Agents*.

A vdom agent observes itself. From traces it either mutates its AgentGraph (loop) or dispatches an async trainer (weights). Serving continues on the old f_theta until a gated mount.

## Two artifacts (submitted together)

| Repo | Role |
| --- | --- |
| **This repo** (`agent-stochastic-dynamics`) | Theory, typed-noise kernel, experiments, ICLR draft |
| [`vdom-harness`](https://github.com/keejkrej/vdom-harness) | Accompanying implementation: a self-observing agent that reengineers its loop and/or dispatches async weight updates. Submitted with the paper. Not a side project and not related-work-only. Do not clone into this tree; link only. |

Papers, blogs, GitHub, X, and other agents are **inputs** to that runtime, not the product.

## Draft and maps

- ICLR 2027 draft: `paper/iclr2027/main.tex`
- Venue track: `paper/NOTES_VENUE.md`
- Math \(\leftrightarrow\) runtime map: `docs/VDOM_INTERFACE.md`
