# Typed Obs arm choice (Lemma 7.9)

This note is the licensing argument, not a score. The rule lives in `paper/FRAMEWORK.md` (Proposition 7.8a, Lemma 7.9). Lemma 7.7 (serving / trainer separation) is unchanged. SDS #9 recorded a hang; the hang is folded here as evidence for the rule, not as a \(0\to 0\) lead.

## Types

\[
\delta:(\mathrm{completion},\,\mathrm{attractors},\,\mathrm{wait\text{-}hit},\,\hat p_{\mathrm{hit}})\;\longrightarrow\;\{\mathrm{wait},\,I_{\mathrm{loop}},\,I_{\mathrm{weight}}\}.
\]

| Input | Type | Not |
| --- | --- | --- |
| `completion` | `hit` / `completed-miss` / `incomplete` | A vibe. `incomplete` = hung ∪ transfer-without-writes ∪ crash. Hung is never a hit. |
| `attractors` | invented policy, extra write, tool thrash | Extra chat history \(H\). |
| `wait-hit` | hit and Obs said wait | A license to mutate \(C\) globally. |
| \(\hat p_{\mathrm{hit}}\) | empirical first-passage | A leaderboard delta. |

Output `wait` is the identity on \(C\). Accumulating \(H\) is not an output.

## Why two arms (Proposition 7.8a)

Generation uses \(f_\theta\) under control \(C\). A completed miss with a metastable policy or tool attractor is a failure of \(C\) at the same \(\theta\). An incomplete episode yields no completed path to edit; \(I_{\mathrm{loop}}\) on empty traces is unidentified. That licenses \(I_{\mathrm{weight}}\) on the slow clock (Lemma 7.7: spawn does not mutate \(C\); serving continues on the old \(\theta\); gate may reject).

## Rule (first match)

1. Wait-hit, or hit with \(\hat p_{\mathrm{hit}}=1\) → `wait`. Unscoped \(I_{\mathrm{loop}}\) onto a wait-hit is an illegal apply.
2. Incomplete → \(I_{\mathrm{weight}}\).
3. Completed-miss and at least one attractor flag → \(I_{\mathrm{loop}}\).
4. Completed-miss and no attractor flag → \(I_{\mathrm{weight}}\).

Cascade exponent \(\lambda\) of \(\rho_n\) is not yet an input. §8.1 remains: when should local Hamming growth tip clause 3 to clause 4?

## Falsifier

- A completed miss that only moves after \(\theta\) changes (clause 3 wrong).
- An incomplete episode that completes after a \(C\) mutation with no \(\theta\) change (clause 2 wrong).

## Diagnostics, not SOTA

Do not invent numbers. Do not lead with \(0.7\to 0.9\) (researcher checklist, not self-reflection). Do not lead with \(0.5\to 0.0\) or \(0\to 0\).

| Trace | What it licenses | What it is not |
| --- | --- | --- |
| Self \(I_{\mathrm{loop}}\) airline \(39/44\), \(0.5\to 0.0\) (`experiments/improve-live-0731-self-3944.json`) | \(I_{\mathrm{loop}}\) is real: \(C\) moved the path measure. Global `cancel_policy` overwrote a wait-hit → wait-hit gate (vdom-harness PR #10; Lemma 7.9 clause 1). | A SOTA miss. |
| Post-gate 44 hung (`experiments/improve-live-0731-self-3944-postgate.json`) | Incomplete episode. \(I_{\mathrm{weight}}\) licensed (clause 2). Runtime still tagged `I_loop`+hung — type error. 0731 cannot take weights: honest protocol is spawn / gate / reject (vdom-harness PR #8). This run did not take the arm (`iWeight` null; max-rounds 1). | A measured \(0\). A fake LoRA. A score to max. |
| CL-Bench exploitable-poker ICL (Asawa et al., arXiv:2606.05661) | Extra \(H\) (stateful vs stateless) is not \(I_{\mathrm{loop}}\). Published gain \(g=r^{\mathrm{sf}}-r^{\mathrm{sl}}\) can hurt on poker. | Our measurement. An arm. |
| Mock \(0\to 0.5\to 1.0\) | Protocol unit test of `improveLoop`. | An ICLR result. |
| Toys 0/12 sequential, 12/12 retrieval | Completed-miss + tool-thrash → \(I_{\mathrm{loop}}\). | The agent benchmark. |

The typed kernel implements \(\delta\) as `decideArm` in `src/observe.ts`.
