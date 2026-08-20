# Typed Obs arm choice (Lemma 7.9)

This note is the licensing argument, not a score. The rule lives in `paper/FRAMEWORK.md` (ICLR critic lock, Proposition 7.8a, Lemma 7.9). Lemma 7.7 (serving / catalog-rebind separation) is unchanged in structure: request does not mutate \(C\); `servingPaused=false`; jump only on gated mount; later serving must use the new provider or there was no jump. SDS #9 recorded a hang; the hang is folded here as evidence for the rule, not as a \(0\to 0\) lead.

## Critic lock

On this rollout we cannot spawn a trainer that writes \(\theta\).

- \(I_{\mathrm{weight}}\) as originally defined (async trainer \(\to\) gated \(\theta'\)) is **reserved and unimplemented**. `spawn_trainer` / `FakeTrainer` are demoted stubs.
- The implemented slow arm is a **gated catalog rebind**: request a different servable model id; serving continues on the old \(f_\theta\); mount rebinds `PhysicalNode.provider` / `n.model`.
- Concrete pair: `deepseek/deepseek-v4-flash-0731` → `deepseek/deepseek-v4-pro-0813` (OpenRouter, GA 2026-08-12).
- Do not call catalog rebind fine-tuning, a LoRA, or self-improvement via a stronger API.
- Do not report \(p_{\mathrm{hit}}(0813)\) vs \(p_{\mathrm{hit}}(0731)\) as a result.

## Types

\[
\delta:(\mathrm{completion},\,\mathrm{attractors},\,\mathrm{wait\text{-}hit},\,\hat p_{\mathrm{hit}})\;\longrightarrow\;\{\mathrm{wait},\,I_{\mathrm{loop}},\,\mathrm{catalog\text{-}rebind}\}.
\]

Original \(I_{\mathrm{weight}}\) is not in the output type here.

| Input | Type | Not |
| --- | --- | --- |
| `completion` | `hit` / `completed-miss` / `incomplete` | A vibe. `incomplete` = hung ∪ crash ∪ no-write (transfer-without-writes). Hung is never a hit. |
| `attractors` | invented policy, extra write, tool thrash | Extra chat history \(H\). |
| `wait-hit` | hit and Obs said wait | A license to mutate \(C\) globally. |
| \(\hat p_{\mathrm{hit}}\) | empirical first-passage | A leaderboard delta. A \(p_{\mathrm{hit}}(0813)\) vs \(p_{\mathrm{hit}}(0731)\) table. |

Output `wait` is the identity on \(C\). Accumulating \(H\) is not an output.

## Why two implemented arms (Proposition 7.8a)

Generation uses a bound \(f_\theta\) under control \(C\). A completed miss with a metastable policy or tool attractor is a failure of \(C\) at the same provider. An incomplete episode yields no completed path to edit; \(I_{\mathrm{loop}}\) on empty traces is unidentified. That licenses the slow arm we can run: catalog rebind. It does not license a trainer we cannot spawn.

## Rule (first match)

1. Hit (or wait-hit, or \(\hat p_{\mathrm{hit}}=1\)) → `wait`. Unscoped \(I_{\mathrm{loop}}\) onto a wait-hit is an illegal apply.
2. Incomplete (hung / crash / no-write) → catalog rebind (request 0813; serving stays on 0731 until gated mount).
3. Completed-miss and at least one attractor flag → \(I_{\mathrm{loop}}\).
4. Completed-miss and no attractor flag → catalog rebind.

Cascade exponent \(\lambda\) of \(\rho_n\) is not yet an input. §8.1 remains: when should local Hamming growth tip clause 3 to clause 4?

## Falsifier

- A completed miss that only moves after the bound provider changes (clause 3 wrong).
- An incomplete episode that completes after a \(C\) mutation with no provider change (clause 2 wrong).
- If hung-44 is still \(I_{\mathrm{loop}}\) unless `loopExhausted`, the split is dead.
- If a mount never rebinds serving to 0813, there was no jump.

## Diagnostics, not SOTA

Do not invent numbers. Do not lead with \(0.7\to 0.9\) (researcher checklist, not self-reflection). Do not lead with \(0.5\to 0.0\) or \(0\to 0\). Do not report \(p_{\mathrm{hit}}(0813)\) vs \(p_{\mathrm{hit}}(0731)\).

| Trace | What it licenses | What it is not |
| --- | --- | --- |
| Self \(I_{\mathrm{loop}}\) airline \(39/44\), \(0.5\to 0.0\) (`experiments/improve-live-0731-self-3944.json`) | \(I_{\mathrm{loop}}\) is real: \(C\) moved the path measure. Global `cancel_policy` overwrote a wait-hit → wait-hit gate (vdom-harness PR #10; Lemma 7.9 clause 1). | A SOTA miss. |
| Post-gate 44 hung (`experiments/improve-live-0731-self-3944-postgate.json`) | Incomplete episode. Catalog rebind licensed (clause 2). Runtime still tagged `I_loop`+hung unless `loopExhausted` — that falsifies the split if left in place. Serving stays on 0731 until a gated mount rebinds `PhysicalNode.provider` / `n.model` to 0813. | A trainer. SGD. A LoRA. Fine-tuning. Self-improvement via a stronger API. A measured 0. A \(p_{\mathrm{hit}}(0813)\) result. |
| CL-Bench exploitable-poker ICL (Asawa et al., arXiv:2606.05661) | Extra \(H\) (stateful vs stateless) is not \(I_{\mathrm{loop}}\). Published gain \(g=r^{\mathrm{sf}}-r^{\mathrm{sl}}\) can hurt on poker. | Our measurement. An arm. |
| Mock \(0\to 0.5\to 1.0\) | Protocol unit test of `improveLoop`. | An ICLR result. |
| Toys 0/12 sequential, 12/12 retrieval | Completed-miss + tool-thrash → \(I_{\mathrm{loop}}\). | The agent benchmark. |

The typed kernel implements \(\delta\) as `decideArm` in `src/observe.ts`. The catalog pair is `CATALOG_REBIND` (alias `CATALOG_IWEIGHT`).
