# Typed Obs arm choice (Lemma 7.9)

This note is the licensing argument, not a score. The rule lives in `paper/FRAMEWORK.md` (author lock, Definition 6.4, Proposition 7.8a, Lemma 7.9). Lemma 7.7 (serving / SKU-rebind separation): request does not mutate \(C\); `servingPaused=false`; jump only on gated mount; later serving must use the new SKU or there was no jump.

## Author lock

A serving agent is \(X=(H,M,E,C)\) with kernel \(K_C\). \(C\) includes the bound model pointer (SKU). Serve the cheapest capable model as the base SKU. After \(\mathrm{Obs}\):

- \(I_{\mathrm{loop}}\): mutate the graph / \(C\), same SKU, fast clock, serving does not pause.
- \(I_{\mathrm{sku}}\): request a more expensive released checkpoint, slow clock, serving continues on the cheap SKU, gated rebind of `PhysicalNode.provider` / `n.model`.
- Wait is the identity.

Concrete cell: base `deepseek/deepseek-v4-flash-0731`, escalate `deepseek/deepseek-v4-pro-0813` (OpenRouter, GA 2026-08-12).

Trainer-spawn / LoRA / original \(I_{\mathrm{weight}}\) is related work and an unimplemented future, **not the claim**.

This paper is not: SOTA on \(\tau^2\); \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\) as a result (buying a stronger API, a diagnostic at most); LoRA / spawn-trainer as the implemented arm; mock \(0\to 0.5\to 1.0\) as a result; \(0.7\to 0.9\) in the abstract lead.

## Types

\[
\delta:(\mathrm{completion},\,\mathrm{attractors},\,\mathrm{wait\text{-}hit},\,\hat p_{\mathrm{hit}})\;\longrightarrow\;\{\mathrm{wait},\,I_{\mathrm{loop}},\,I_{\mathrm{sku}}\}.
\]

| Input | Type | Not |
| --- | --- | --- |
| `completion` | `hit` / `completed-miss` / `incomplete` | A vibe. `incomplete` = hung ∪ crash ∪ no-write. Hung is never a hit. |
| `attractors` | invented policy, extra write, tool thrash | Extra chat history \(H\). |
| `wait-hit` | hit and Obs said wait | A license to mutate \(C\) globally. |
| \(\hat p_{\mathrm{hit}}\) | empirical first-passage | A Pro-vs-Flash leaderboard. |

Output `wait` is the identity on \(C\). Accumulating \(H\) is not an output.

## Why two arms (Proposition 7.8a)

Generation uses the bound SKU under control \(C\). A completed miss with a metastable policy or tool attractor is a failure of \(C\) at the same SKU. An incomplete episode yields no completed path to edit; \(I_{\mathrm{loop}}\) on empty traces is unidentified. That licenses \(I_{\mathrm{sku}}\).

Real deployments cannot fine-tune the serving API model. They can rebind the pointer.

## Rule (first match)

1. Hit → `wait`.
2. Incomplete (hang / crash / no-write) → \(I_{\mathrm{sku}}\).
3. Completed-miss + attractor → \(I_{\mathrm{loop}}\).
4. Completed-miss and no attractor → \(I_{\mathrm{sku}}\).

## Falsifier

- A completed miss that only moves after the SKU changes (clause 3 wrong).
- An incomplete episode that completes after a \(C\) mutation with no SKU change (clause 2 wrong).
- If hung-44 is still \(I_{\mathrm{loop}}\) unless `loopExhausted`, the split is dead.
- If a mount never rebinds serving to 0813, there was no jump.

## Diagnostics, not SOTA

Do not invent numbers. Do not lead with \(0.7\to 0.9\). Do not report \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\) as a result.

| Trace | What it licenses | What it is not |
| --- | --- | --- |
| Self \(I_{\mathrm{loop}}\) airline \(39/44\), \(0.5\to 0.0\) | \(I_{\mathrm{loop}}\) is real: \(C\) moved the path measure. Wait-hit gate (vdom-harness PR #10). | A SOTA miss. |
| Post-gate 44 hung | Incomplete episode. \(I_{\mathrm{sku}}\) licensed. Runtime still tagged `I_loop`+hung unless `loopExhausted` — split is dead if left. | A trainer. A Pro-vs-Flash score. |
| CL-Bench exploitable-poker ICL (Asawa et al., arXiv:2606.05661) | Extra \(H\) is not \(I_{\mathrm{loop}}\). | Our measurement. An arm. |
| Mock \(0\to 0.5\to 1.0\) | Protocol unit test. | A result. |
| Toys 0/12 sequential, 12/12 retrieval | Completed-miss + tool-thrash → \(I_{\mathrm{loop}}\). | The agent benchmark. |

The typed kernel implements \(\delta\) as `decideArm` in `src/observe.ts`. The cell is `SKU_CELL`.
