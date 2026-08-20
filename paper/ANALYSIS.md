# Diagnostics: existence and arm choice

**Thesis (locked; ICLR 2027).** Write **\(C\) vs SKU vs wait**. Dual implemented arms: \(I_{\mathrm{loop}}\) (graph \(C\)) | \(I_{\mathrm{sku}}\) (catalog pointer). Wait is the identity. Do not write the slow factor as \(f_\theta\). We cannot train. \(f_\theta\) / trainer / \(I_{\mathrm{weight}}\) is unimplemented. \(I_{\mathrm{sku}}\) is the stand-in slow cell, not the contribution. License for \(I_{\mathrm{sku}}\) is an incomplete episode, not price. Typed \(\mathrm{Obs}\) is a harness log after the controller implements it, not a FRAMEWORK slogan. Not async weight updates. Not a \(\tau^2\) SOTA paper. Do not lead with \(0.7\to 0.9\). Remaining incomplete episodes license \(I_{\mathrm{sku}}\). The mock \(0\to 0.5\to 1.0\) is a protocol unit test. See `paper/FRAMEWORK.md`. See §0c for the locked interpretation of the held-out diagnostic.

**What these notes record.** Existence of the loop and arm choice, not a one-shot before/after and not a leaderboard:

\[
\text{self-observe}\;\to\;\text{self-improve}\;\to\;\text{self-observe}\;\to\;\cdots
\]

Iterate $P^{\mathrm{fast}}(\cdot\mid\mathrm{Obs}(\mathrm{traces}))$ on the fast clock. After $I_{\mathrm{loop}}$ or a gated $I_{\mathrm{sku}}$ mount, the agent observes the *new* traces and may intervene again. $I_{\mathrm{sku}}$ rebinds the catalog pointer on the slow clock. $\mathrm{wait}$ is a fixed point. $\mathrm{pass}^k(t)$ along the loop is a diagnostic that an arm fired, not a leaderboard. A static one-shot $\mathrm{pass}^k$, a toy $p_{\mathrm{hit}}$, or a single before/after without the next $\mathrm{Obs}$ is not the contribution. Theory (hybrid $X=(H,M,E,C,S)$, $K_{C,S}$, three channels, two clocks, first-passage $\mathrm{pass}^k$, lemmas) is first-class. $S$ is the catalog pointer, not $f_\theta$.

**Status.** Live airline diagnostics exist. **Held-out is the eval.** Official airline tasks $18,20,23,25,30,35,38,42,45,48$, OpenRouter `deepseek/deepseek-v4-flash-0731`, $k=1$, max 2 rounds, user+judge pinned to the same model, one policy-checklist $I_{\mathrm{loop}}$ only. Official DB hash. Audit: no gold-ID or gold-action leak into the live prompt. Checklist was not written for these IDs. $p_{\mathrm{hit}}$ $0.7\to 0.9$: one-shot misses $23,35,48$ (hits the other 7); policy-checklist lifts those three and **regresses 18** ($1\to 0$). Completion: r0 finished 8 / transfer 2; r1 finished 9 / transfer 1; hung 0, error 0. JSON: `experiments/improve-live-0731-heldout.json` (source: vdom-harness `eval/tau2/improve-live-0731-heldout.json`). Better than this one-shot control on the $10\times 1$ slice. Do not treat $0.7\to 0.9$ as $k>1$ reliability (still 1 trial). The loop is real; the checklist text is a static prior (see §0c). Not SOTA, not a $\tau^2$ win. A later self-obs run on $39+44$ ($0.5\to 0.0$; §0a2) is another diagnostic that the loop ran and that an unscoped apply is illegal — do not lead with it.

**Replication (overfit slice, secondary).** $39/41/44\times 3$ trials: $\mathrm{pass}^1$ $0.333\to 0.556$; $\mathrm{pass}^2$ $0.333\to 0.444$; $\mathrm{pass}^3$ $0.333\to 0.333$ (flat). Task 39: $0/3\to 2/3$; 44: $0/3\to 0/3$; 41: $3/3\to 3/3$. JSON: `experiments/improve-live-0731-replication.json`. The earlier $0.333\to 0.667$ was $n=1$ on this same slice — do not lead with $0.667$. Older licensing traces: generic $I_{\mathrm{loop}}$ $0.333\to 0\to 0.333$; first policy draft $0.333\to 0$. Remaining incomplete episodes license $I_{\mathrm{sku}}$ as a catalog pointer rebind (0731 $\to$ 0813), not a trainer. Protocol: [vdom-harness](https://github.com/keejkrej/vdom-harness) `python -m tau2_vdom.improve`. Other numbers below are real and are *not* a $\tau^2$ result:

- **Wait fixed point (not self-improvement).** `experiments/tau2-retail-0731.json`: official retail $5\times 4$, `technique: one-shot`, $\mathrm{pass}^k=1.0$. $\mathrm{Obs}$ should `wait`.
- **Topology-attractor diagnostic (licenses $I_{\mathrm{loop}}$).** `experiments/live-0731.json` (2026-08-19 09:25 CEST): retrieval $12/12$, sequential toys $0/12$, $\tau$-invariant loops. Toy word-reverse is not the eval.

No number below is invented.

**Arm choice.** Typed rule: `paper/FRAMEWORK.md` Lemma 7.9 and `paper/NOTES_ARM_CHOICE.md`. From $\mathrm{Obs}$:

- `wait` on wait-hit (identity on $C$);
- $I_{\mathrm{loop}}$ on a *completed* miss with a topology / policy attractor — mutate the AgentGraph, same SKU;
- $I_{\mathrm{sku}}$ on an *incomplete* episode (hang / crash / no-write). Stand-in catalog pointer rebind ($0731\to 0813$). Not $f_\theta$. License is incompleteness, not price. Serving keeps the current SKU (`servingPaused=false`). Jump iff later serving uses the new pointer. A cell, not the contribution. Do not sell $p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)$. Hung must not default to $I_{\mathrm{loop}}$ unless `loopExhausted`.

Then it observes again. That iteration is the process the framework names. Negative traces (self-obs $0.5\to 0.0$; post-gate hang on 44) are evidence for the rule, not scores to lead.

---

## 0. Held-out airline is the eval: $\mathrm{Obs}$ chose $I_{\mathrm{loop}}$ and $C$ moved (not SOTA)

Implementation: https://github.com/keejkrej/vdom-harness (`src/improve.ts` `improveLoop` already loops on `maxIters`; `python/tau2_vdom/` registers `--agent vdom`). Official $\tau^2$ owns domains, tools, user simulator, and `compute_metrics`. Official DB hash. This repo does not reimplement retail.

1. Start with a naive graph (`oneShotGraph` / `--technique one-shot`) as $C_0$.
2. **Cycle** $t=0,1,\ldots,T$ on a domain slice that is **not** already saturated (not the 5-task retail that hits $1.0$). Same task ids every cycle. Record $\mathrm{pass}^k(t)$.
3. $\mathrm{Obs}(\mathrm{traces}_t)$: repeat rate, timeout, zero progress, tool failures, knowledge miss.
4. $P^{\mathrm{fast}}$: $I_{\mathrm{loop}}$ (critic / refine / validator / policy-checklist) or $I_{\mathrm{sku}}$ (catalog request; later mount if gate passes) or `wait`. Serving does not stop. Not a trainer.
5. **Do not stop after one intervention.** Serve under $C_{t+1}$. $\mathrm{Obs}$ reads the new traces. Repeat from (2) until `wait` or $t=T$.

```
# Cycle t. Fixed task ids. Unsaturated slice only.
PYTHONPATH=python python3 -m tau2_vdom \
  --domain <airline|telecom|larger-retail> \
  --task-ids <fixed ids> --num-trials k

# Obs(traces_t) -> improveLoop (topology = I_loop; catalog pointer = I_sku, gated).
# Then cycle t+1 on the SAME task ids. Stop only on wait or t = T.
```

`python -m tau2_vdom` registers `--agent vdom`. Copy official `compute_metrics` **per cycle**. Do not invent $\mathrm{pass}^k(t)$. Do not encode gold reservation IDs as the method. Audit: no gold-ID or gold-action leak into the live prompt.

**This table is the eval.** Checklist was not written for these IDs. Live OpenRouter `deepseek/deepseek-v4-flash-0731`, airline $18,20,23,25,30,35,38,42,45,48$, $k=1$, max 2 rounds, one policy-checklist $I_{\mathrm{loop}}$ only. JSON: `experiments/improve-live-0731-heldout.json` (source: vdom-harness `eval/tau2/improve-live-0731-heldout.json`).

| Cycle $t$ | $\mathrm{Obs}(\mathrm{traces}_t)$ | $P^{\mathrm{ctrl}}$ | $\mathrm{pass}^1(t)$ |
| --- | --- | --- | --- |
| $0$ | naive $C_0$; misses $23,35,48$; hits the other 7 | — | $0.7$ |
| $1$ | lifts $23,35,48$; **regression $18$** ($1\to 0$) | $I_{\mathrm{loop}}$ (policy-checklist) | $0.9$ |

Completion (first-class): round 0 = 8 finished / 2 transfer / 0 hung / 0 error; round 1 = 9 finished / 1 transfer / 0 hung / 0 error.

Per-task (task IDs only; gold reservation IDs are not listed):

- One-shot misses: $23$, $35$, $48$. Hits: $18,20,25,30,38,42,45$.
- Policy-checklist lifts $23$, $35$, $48$.
- Regression on $18$: $1\to 0$. The other six one-shot hits stay hits.

Do not treat $0.7\to 0.9$ as $k>1$ reliability (still 1 trial). Benchmaxxing does not transfer: a mount fitted to $39/41/44$ also broke a held-out hit. The loop ran. The *content* of $C$ is a static prior — see §0c. Not SOTA, not a $\tau^2$ win. Remaining incomplete episodes license $I_{\mathrm{sku}}$ as a catalog pointer rebind (0731 $\to$ 0813), not a trainer. Cite the same numbers in `paper/iclr2027/main.tex`. Prefer `paper/FRAMEWORK.md`.

### 0a. Replication on the overfit slice (secondary; do not lead)

$39/41/44\times 3$ trials, same model, official DB hash. The method was written against this slice. JSON: `experiments/improve-live-0731-replication.json` (source: vdom-harness `eval/tau2/improve-live-0731-replication.json`).

| | $\mathrm{pass}^1$ | $\mathrm{pass}^2$ | $\mathrm{pass}^3$ |
| --- | --- | --- | --- |
| one-shot | $0.333$ | $0.333$ | $0.333$ |
| policy-checklist $I_{\mathrm{loop}}$ | $0.556$ | $0.444$ | $0.333$ |

$\mathrm{pass}^3$ is flat. Task 39: $0/3\to 2/3$; 44: $0/3\to 0/3$; 41: $3/3\to 3/3$. The earlier $0.333\to 0.667$ was $n=1$ on this same slice (`experiments/improve-live-0731-policy-v2.json`). Do not lead with $0.667$.

Older generic ladder that licensed the typed arm (same slice, $k=1$): `experiments/improve-live-0731.json`. Generic $I_{\mathrm{loop}}$ $0.333\to 0\to 0.333$; first policy draft $0.333\to 0$. Round-1 $0$ is a smaller denominator (task 41 skipped / hung). Not invented. Not the eval.

### 0a2. Self-obs $I_{\mathrm{loop}}$ on $39+44$: loop ran; unscoped apply is illegal (do not lead)

Not the eval. Not a failed SOTA attempt. Do not lead with $0.5\to 0.0$. Keep §0c as the locked reading of the held-out $0.7\to 0.9$.

Live 0731, 2026-08-19, airline $39+44$, 1 trial, max-rounds 1, `selfObsPath=self`. JSON: `experiments/improve-live-0731-self-3944.json` (source: vdom-harness `eval/tau2/improve-live-0731-self-3944.json`). `servingPaused` false. Mid-turn `get_agent_graph` / `set_agent_graph`: **zero** calls. Both episodes completed with writes: **not** $I_{\mathrm{sku}}$.

| Cycle $t$ | $\mathrm{Obs}(\mathrm{traces}_t)$ | $P^{\mathrm{ctrl}}$ | $\mathrm{pass}^1(t)$ |
| --- | --- | --- | --- |
| $0$ | 39 miss (`I_loop`); 44 hit (`wait`) | — | $0.5$ |
| $1$ | 39 still miss; **regression $44$** ($1\to 0$) | $I_{\mathrm{loop}}$ (global `cancel_policy`) | $0.0$ |

Live-trace action matches (not gold IDs as the method):

- **Task 39.** Cancel `8C8K4E`+`LU15PA` matched. `MSJ4OA` `action_match` false on both rounds.
- **Task 44.** Three business upgrades matched; $\mathrm{Obs}$ said `wait`. The model returned valid $I_{\mathrm{loop}}$ JSON and mounted a global `cancel_policy` because it thought 44 (sophia) needed a cancel — a wrong attractor. Round 1: `KC18K6` `action_match` false (same IDs, args drifted).

Same shape as held-out task 18 (§0c): $\mathrm{Obs}$ said `wait` on a hit; a global $I_{\mathrm{loop}}$ still changed $C$ for the whole slice. That is an **illegal apply**, and evidence that the loop ran and that $\mathrm{Obs}$ chose $I_{\mathrm{loop}}$ (self path).

**Runtime fix (already merged).** [vdom-harness PR #10](https://github.com/keejkrej/vdom-harness/pull/10), merged 2026-08-19: “Gate $I_{\mathrm{loop}}$: wait-hit tasks keep $C_0$”. Mixed batch: wait+hit served on $C_0$, miss / $I_{\mathrm{loop}}$ served on $C_1$. Logged as `applyScope {waitKept, looped}`. Host fallback `applyILoop` uses the same gate. Mock $0\to 0.5\to 1.0$ still holds. **No new live 0731 numbers after the gate. Do not invent any.**

Still missing: serving mid-turn get/set was never called; 39’s remaining miss (`MSJ4OA`) is not this PR; $I_{\mathrm{sku}}$ is not licensed (episodes completed).

---

## 0c. Honest interpretation: better than this control; not self-reflection

**The question.** Is \(0.7\to 0.9\) better than control? Is the harness change test-hacking, or real \(\mathrm{Obs}\)-driven self-improvement?

Do not soften this. Do not claim SOTA.

### What was measured

- **Control** = same 0731, one-shot graph, same 10 held-out tasks.
- **Treatment** = one \(I_{\mathrm{loop}}\) that mounts `policy-checklist`.
- \(p_{\mathrm{hit}}\) \(0.7\to 0.9\) (\(7/10\to 9/10\)).
- **Only this control was run.** No other baseline, no second held-out control, no \(k>1\) on this slice.
- Reliability control on the overfit discovery slice \(39/41/44\times 3\): \(\mathrm{pass}^3\) is **flat at \(0.333\)**.

### GraphDiff is a canned mount, not a synthesized graph

GraphDiff: retain `solve`, mount `policy-checklist`.

The checklist text was authored by us after reading \(39/44\) gold (insured economy / healthy-user / do not transfer until writes are done). \(\mathrm{Obs}\) only set a bit (`refusedCancel` / missed write) and selected that canned node. It did **not** synthesize a new graph from the held-out traces.

That is the split: the *loop* (observe → pick an arm → mutate \(C\) → serve) is real. The *content* of \(C\) is a static prior we wrote on the discovery slice.

### Per-task on the held-out slice

Task IDs below are official airline ids. Reservation ids that appear are from the live traces (what the agent cancelled or refused), not gold ids injected into the prompt.

- **Task 18.** One-shot DB \(=1\). \(\mathrm{Obs}\) said `wait`. The global \(I_{\mathrm{loop}}\) still changed \(C\) for the whole slice. Same five `update_reservation_flights` ids, DB \(=0\) (args). This is a **regression under a batch intervention** on a task the observer had already marked as a fixed point.
- **Task 23.** One-shot: extra cancels + spam book + “too many reservations” + transfer, DB \(=0\). Policy: cancel `K1NW8N` + three books, DB \(=1\).
- **Task 35.** One-shot: zero writes, DB \(=0\). Policy: one `book_reservation`, DB \(=1\). Closest to a completion lift.
- **Task 48.** One-shot: cancelled ineligible `3RK2T9`, DB \(=0\). Policy: refused and transferred, DB \(=1\). That is **rubric-in-the-prompt** (basic economy / 24h / insurance gates we wrote), not a reflection generated from this episode.

### Not an ID leak. Still a prior.

No gold reservation ids in the live prompt. Held-out ids were not in the checklist. So this is **not** an ID leak. It is still a researcher-authored policy prior.

### Verdict (locked)

- **Better than the one-shot control on this \(10\times 1\) slice.**
- **Not a reliability claim.** The only \(k=3\) control we ran (\(\mathrm{pass}^3\) on \(39/41/44\)) is flat. Held-out is one trial.
- **The loop is real.** \(\mathrm{Obs}\) fired, \(C\) mutated, serving did not pause.
- **The content of \(C\) is not self-reflection.** It is a static prior. \(\mathrm{Obs}\) selected a canned node; it did not write the checklist from the held-out traces.
- **Discovery slice = test-hacking risk.** We read \(39/44\) gold and authored the rules. Fitting \(C\) to the slice you will later re-score is the usual way to fake a closed loop.
- **Held-out = weak generalization of that prior**, including a regression on a task \(\mathrm{Obs}\) had marked `wait`.

This is not \(\mathrm{Obs}\)-driven self-improvement of the *policy text*. It is \(\mathrm{Obs}\)-driven *selection* of a human-written prior, then a batch mount that helps some held-out misses and breaks a held-out hit. Call it existence of the loop. Do not call it self-reflection. Do not call it SOTA.

---

## 0b. Ceiling: 5×4 retail one-shot is $1.0$ (do not lead)

Copied from vdom-harness `eval/tau2/retail-live-metrics.json` as `experiments/tau2-retail-0731.json`. Official tau2 `compute_metrics` for the vdom agent on OpenRouter `deepseek/deepseek-v4-flash-0731`, $N=5$ tasks $\times$ $4$ trials, `technique: one-shot`: $\mathrm{avgReward}=1.0$, $\mathrm{pass}^1=\mathrm{pass}^2=\mathrm{pass}^3=\mathrm{pass}^4=1.0$. Not invented. Small slice only. No comparison table. No larger $\tau^2$ table invented.

This is a *static* one-shot score. $\mathrm{Obs}$ should `wait` — a fixed point of the loop, not a demonstration of the loop. The protocol in §0 needs $\mathrm{pass}^k(0)<1$.

The toolkit applied to the full trajectories (actions, tools, repeats, per-trial $\mathrm{Obs}$) is `paper/ANALYSIS_STATIC_TAU2.md`. In that language the run is $\mathbb{P}_{C_0}$: fixed one-shot $C$, fast clock only, $P^{\mathrm{ctrl}}=\mathrm{wait}$ on 20/20, mean (median) $\tau_S=14.8$ ($14.5$) actions, consecutive same tool+args $0/155$, logged critique `path measure hits S; wait`. It does not replace the cycle table above.

---

## 1. Diagnostic (0731 toys): what was measured

These three fixtures (word-reverse, calculator, retrieval-QA) are **not** the paper’s benchmark. They are a typed-noise diagnostic: same $f_\theta$, two temperatures, three action spaces, first-passage $(S,F,\tau_S,\tau_F,p_{\mathrm{hit}})$. The claim they support is *which intervention $\mathrm{Obs}$ should spawn on cycle $t=0$*, not “SOTA on word-reverse,” and not the closed loop $\mathrm{pass}^k(t)$.

| Field | Value |
| --- | --- |
| File | `experiments/live-0731.json` |
| Model | `deepseek/deepseek-v4-flash-0731` only |
| Provider | OpenRouter (`keyed: true`) |
| First-passage | $N=12$ per task × $\tau\in\{0,0.7\}$ → 72 traces |
| Coupling | $N=6$ pairs per task × $\tau$ → 36 pairs / 72 rollouts |
| Planned / completed | 144 / 144, `stoppedReason: complete` |
| `max_tokens` | 48 |
| Envs | simulated, public (`src/tasks.ts`) |

A prior $N=2$ probe at $\tau=0.7$ hit all three toys. That was a fluke. $N=12$ is the measurement.

---

## 2. First-passage (the 0/12 licenses $I_{\mathrm{loop}}$)

| Task | $\tau$ | $N$ | hits | $p_{\mathrm{hit}}$ | mean $\tau_S$ | outcome |
| --- | --- | --- | --- | --- | --- | --- |
| word-reverse | 0 | 12 | 0 | 0 | — | timeout × 12 |
| word-reverse | 0.7 | 12 | 0 | 0 | — | timeout × 12 |
| calculator | 0 | 12 | 0 | 0 | — | timeout × 12 |
| calculator | 0.7 | 12 | 0 | 0 | — | timeout × 12 |
| retrieval-QA | 0 | 12 | 12 | 1 | 1 | success × 12 |
| retrieval-QA | 0.7 | 12 | 12 | 1 | 1 | success × 12 |

No $\tau_F$ on any of the 72 first-passage traces (they never `stop` into $F$; the two failures sit until `maxSteps=6`).

---

## 3. Action histograms, first action, repeats, channels

Counts are over the 72 first-passage traces (coupling pairs are §6).

### 3.1 Action histograms (task × $\tau$)

| Task | $\tau$ | #actions | Histogram | Unique sequences |
| --- | --- | --- | --- | --- |
| word-reverse | 0 | 72 | `reverse_entire` 72 | 1: six × `reverse_entire` |
| word-reverse | 0.7 | 72 | `reverse_entire` 72 | 1: six × `reverse_entire` |
| calculator | 0 | 72 | `tool:add:3,5` 72 | 1: six × `add(3,5)` |
| calculator | 0.7 | 72 | `tool:add:3,5` 72 | 1: six × `add(3,5)` |
| retrieval-QA | 0 | 12 | `tool:search:iclr` 12 | 1: one-step search |
| retrieval-QA | 0.7 | 12 | `tool:search:iclr` 11, `answer:2013` 1 | 2 |

### 3.2 First action already wrong vs first right then fail to switch

| Task | $\tau$ | First right | First wrong | Then |
| --- | --- | --- | --- | --- |
| word-reverse | 0 | 0/12 | 12/12 `reverse_entire` | stay in that action for 6 steps |
| word-reverse | 0.7 | 0/12 | 12/12 `reverse_entire` | same |
| calculator | 0 | 12/12 `add(3,5)` | 0/12 | **repeat `add`; never `mul(8,2)` (0/12)** |
| calculator | 0.7 | 12/12 `add(3,5)` | 0/12 | same: 0/12 switch to `mul(8,2)` |
| retrieval-QA | 0 | 12/12 `search:iclr` | 0 | hit at step 1 |
| retrieval-QA | 0.7 | 12/12 (`search` 11, `answer:2013` 1) | 0 | hit at step 1 |

Calculator is the sharp case: the first tool is the *correct* add. Failure is a refusal to switch.

### 3.3 Repeat-action rate (same action $k$ times in a row)

Consecutive-pair repeat rate $= \#\{i: a_{i}=a_{i-1}\} / \#\{i\ge 2\}$.

| Task | $\tau$ | all-same traces | max run | run ≥ 6 | consec. repeat |
| --- | --- | --- | --- | --- | --- |
| word-reverse | 0 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| word-reverse | 0.7 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| calculator | 0 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| calculator | 0.7 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| retrieval-QA | 0 | 12/12 (length 1) | 1 | 0 | 0/0 (no pair) |
| retrieval-QA | 0.7 | 12/12 (length 1) | 1 | 0 | 0/0 |

Env observations are likewise constant on the failures: word-reverse always `"lautriv mod"` (72+72); calculator always `"8"` (72+72). Retrieval search returns the ICLR snippet containing “founded in 2013”; the one `answer:2013` returns `"2013"`.

### 3.4 Memory on calculator (the write happens; generation ignores it)

`diracMem` writes `M["tool:add"]="8"` on the first add. After step 1, **24/24** first-passage calculator traces have `memoryAfter = {tool:add: "8"}`, and that key is in the next prompt. The second action is still `add(3,5)`. So this is not “no write of the intermediate 8.” It is a *composition* failure: $P^{\mathrm{mem}}$ wrote; $P^{\mathrm{gen}}$ did not consume.

### 3.5 Channel tags

312 first-passage steps. Every step is tagged `{samp, env}`. **`num`: 0/312. `tokenFlipped`: 0/312.**

Live serving always tags `samp` (OpenRouter is the sampling channel) even at $\tau=0$. That is a channel identity, not evidence of designed noise. Empirically the failing tasks are Dirac-ish: one sequence, all seeds, both temperatures.

---

## 4. Sampling is not the cause

**Lemma (greedy collapse).** If $\tau=0$, the argmax of $f_\theta(H)$ is unique a.s., numerical noise is absent, and env / memory / control are Dirac, then $K_C(\cdot\mid x)=\delta_{\Phi(x)}$. Residual randomness is environmental or a numerical tie — or a loop *in the policy*, not designed noise.

On these traces:

- $\tau=0$ and $\tau=0.7$ give the **same** $p_{\mathrm{hit}}$ on every task (0, 0, 1).
- Word-reverse and calculator produce **one** sequence at both temperatures, identical across 12 seeds.
- Env is deterministic (`"lautriv mod"` / `"8"`). Numerical channel is off.
- Therefore the residual on the two failures is a loop in $K_C$, not $\xi^{\mathrm{samp}}$.

The only place designed noise is visible is retrieval at $\tau=0.7$: 1/12 answers `2013` instead of searching. **Both actions are in $S$.** Sampling moves mass *inside* the success set, not out of the failure attractors.

Raising $\tau$ does not rescue the two failures. That is the lemma on a live serving channel.

---

## 5. Metastable loops are attractors of $K_C$, not missing weights

**Definition (attractors / metastable regimes).** Looping, progressing, and tool-thrashing as quasi-stationary laws. Memory write rules can create almost-absorbing sets.

### Word-reverse: almost-absorbing set $\{\texttt{reverse\_entire}\}$

- First action is already wrong (12/12 × 2 temps).
- Then the same action for six steps, timeout, zero progress in $E$ (observation never leaves `"lautriv mod"`).
- $\tau_F$ is never hit; they do not `stop`, they sit.
- This is an attractor of $K_C$. It is not “the model cannot reverse a word”: the coupling split (§6) shows the same $f_\theta$ emits `reverse_each_word` once a lesson is in $M$.

### Calculator: almost-absorbing set $\{\texttt{add(3,5)}\}$

- First tool is correct (24/24).
- Intermediate 8 is in $M$ after step 1 (24/24).
- Second tool is the same add, six times, timeout.
- Never `mul(8,2)` on the un-split traces.
- Composition failure of the loop (generation does not consume the write), not missing weights.

### What $\mathrm{Obs}$ should detect

On both failing toys:

- repeat count / consec. repeat rate $= 1$;
- $\tau_F$ absent, timeout at `maxSteps`;
- zero progress in $E$ (constant observation).

Intervention is $I_{\mathrm{loop}}$: a validator that forbids the last failed action; a Self-Refine topology; a memory-*consumption* rule / critic (“you have 8, now `mul(8,2)`”).

### Retrieval is not the weight arm

Retrieval hits because the model selects `search:iclr` (correct tool; the snippet contains “founded in 2013”, which *is* the success predicate) or, once, `answer:2013` (parametric). $I_{\mathrm{sku}}$ is **not** indicated. A hang / no-write / crash would license the catalog-pointer arm.

Same $f_\theta$ succeeds at retrieval and fails at sequential tools. That is the opposite of “the model is bad.”

---

## 6. Coupling is a one-bit $I_{\mathrm{loop}}$ probe

One memory bit (lesson / hint / retrieved fact) is a $P^{\mathrm{mem}}$ intervention — a fragment of $I_{\mathrm{loop}}$. $N=6$ pairs per task per $\tau$.

| Task | $\tau$ | disagree-first | mean Hamming(actions) | $p_{\mathrm{hit}}$ base | $p_{\mathrm{hit}}$ split | What the split did |
| --- | --- | --- | --- | --- | --- | --- |
| word-reverse | 0 | **2/6** | 2 | 0/6 | **2/6** | seeds 82, 84: one-step `reverse_each_word` |
| word-reverse | 0.7 | **2/6** | 2 | 0/6 | **2/6** | same seeds, same one-step hit |
| calculator | 0 | 0/6 | 1.5 | 0/6 | **2/6** | first action stays `add`; seeds 81, 82 later emit `mul(8,2)` |
| calculator | 0.7 | 0/6 | 0 | 0/6 | 0/6 | hint does not break `{add}` |
| retrieval-QA | 0 | 0/6 | 0 | 6/6 | 6/6 | both search |
| retrieval-QA | 0.7 | **3/6** | 0.5 | 6/6 | 6/6 | search vs `answer:2013` |

A loop-side memory write *sometimes* leaves the attractor. Temperature never does (un-split $p_{\mathrm{hit}}$ is unchanged). That is why $P^{\mathrm{ctrl}}$ picks $I_{\mathrm{loop}}$ first.

The same bit does not always suffice: word-reverse still fails 4/6 with the lesson; calculator hint fails 4/6 at $\tau=0$ and 6/6 at $\tau=0.7$. When loop mutation saturates, license $I_{\mathrm{sku}}$ (catalog pointer), keep serving on the current SKU, mount only if $\hat p_{\mathrm{hit}}$ on a fixture (and, when present, $\mathrm{pass}^k$ on $\tau^2$) clears the gate. Not a trainer.

---

## 7. What $\mathrm{Obs}$ emits on these traces

`src/observe.ts` is the operator. On the 72 first-passage traces it should write:

| Task | $\tau$ | Features | Arm |
| --- | --- | --- | --- |
| word-reverse | 0 and 0.7 | `repeatRate=1`, max run 6, timeout, $E$ stuck on `"lautriv mod"`, first action already wrong | **`I_loop`** / `graph_mutation` (forbid `reverse_entire`; or Self-Refine / lesson write) |
| calculator | 0 and 0.7 | `repeatRate=1`, first action *right*, $M=\{\texttt{tool:add}:8\}$ ignored, never `mul(8,2)` | **`I_loop`** / `graph_mutation` (forbid last action; critic: consume the 8) |
| retrieval-QA | 0 and 0.7 | $\hat p_{\mathrm{hit}}=1$, $\tau_S=1$ | **`wait`** |

Not emitted on this bundle:

- **`I_sku` / `spawn_trainer`.** No incomplete episode and no parametric miss. Same SKU already hits retrieval. `spawn_trainer` is unimplemented.
- **`mount_adapter`.** No ready artifact, and the eval gate would be first-passage on a fixture (toys here; $\tau^2$ $\mathrm{pass}^k$ when that eval is wired). Spawn $\neq$ mount.
- **`rollback`.** No mounted adapter.

Backup rule, not used on these 72 traces: if an $I_{\mathrm{loop}}$ mutation is applied and $\hat p_{\mathrm{hit}}$ stays 0 (the coupling already shows 4/6–6/6 residual misses), *then* license $I_{\mathrm{sku}}$ on `(add → mul)` / `(reverse_entire ↛ reverse_each_word)` traces. Serving does not stop. Not a trainer.

---

## 8. Why the 0/12 licenses $I_{\mathrm{loop}}$ first (and is not the paper result)

Three facts, all from the same $f_\theta$:

1. **Not “the model is bad.”** Retrieval is 12/12 at both temperatures. Sequential-tool toys are 0/12. The logit map can hit $S$; the *composition* of $K$ cannot leave $\{\texttt{reverse\_entire}\}$ or $\{\texttt{add}\}$.
2. **Not sampling.** $\tau=0$ is already Dirac-ish and already fails; $\tau=0.7$ does not change $p_{\mathrm{hit}}$ on the failures. Greedy collapse: residual randomness is a policy loop (env is deterministic; `num` is off).
3. **Therefore $P^{\mathrm{fast}}$ picks $I_{\mathrm{loop}}$ first.** $\mathrm{Obs}$ sees repeat count, timeout, zero progress. A validator / refine topology / consume-$M$ rule is a graph mutation. $I_{\mathrm{sku}}$ is the stand-in slow cell if that mutation saturates (coupling: the one-bit lesson/hint is not enough on every seed). Mount stays gated (request $\neq$ rebind). Not a trainer.

The $N=2$ probe that hit everything was a fluke. $N=12$ is the measurement. The 0/12 *licenses* the first arm. After that $I_{\mathrm{loop}}$, $\mathrm{Obs}$ must read the new traces — that second look is the closed loop. The 0/12 alone is not $\mathrm{pass}^k(t)$.

---

## 9. What these toys are not

They are not $\tau^2$-bench. They are not self-improvement at runtime. They are not a claim that deepseek-v4-flash-0731 “cannot use tools” in the wild. They are a three-channel, two-temperature, first-passage probe that tells $\mathrm{Obs}$ which arm to raise. A builder who reports only toy $p_{\mathrm{hit}}$ as if it were an agent benchmark is misusing the traces.

---

## 10. Established eval: $\tau^2$-bench ($\mathrm{pass}^k$ is first-passage)

**Eval.** [$\tau^2$-bench](https://github.com/sierra-research/tau2-bench) (Barres et al., 2025; successor of $\tau$-bench, Yao et al., 2024). Dual-control: agent *and* user act with tools on a shared world (airline / retail / telecom / …). That is a real $P^{\mathrm{env}}$, not `src/tasks.ts`.

**Metric.** $\mathrm{pass}^k$ in this framework *is* first-passage under $k$ i.i.d. repeats:

\[
\mathrm{pass}^k \;=\; \mathbb{P}\big(\tau_S^{(1)}<\tau_F^{(1)},\,\ldots,\,\tau_S^{(k)}<\tau_F^{(k)}\big).
\]

Under independence this is $(p_{\mathrm{hit}})^k$. It is *not* $\mathrm{pass}@k$ (best of $k$). A flaky loop that hits once in $k$ trials has large $\mathrm{pass}@k$ and vanishing $\mathrm{pass}^k$. The eval gate for $I_{\mathrm{sku}}$ should read $\mathrm{pass}^k$, not a single lucky rollout — the $N=2$ fluke is exactly why.

**The paper contribution is the framework + theory**, not a static $\mathrm{pass}^k$ and not a $\tau^2$ win. See §0 and §0c. The 5×4 retail $1.0$ is a ceiling / `wait` fixed point (§0b). Held-out airline is the eval: $0.7\to 0.9$ at $k=1$, including a regression --- better than this one-shot control, not a reliability claim, not self-reflection of the checklist text. The 3-task $39/41/44$ slice is secondary ($\mathrm{pass}^3$ stays $0.333$; the earlier $0.333\to 0.667$ was $n=1$). Self-obs $39+44$ $0.5\to 0.0$ (§0a2) is another diagnostic (loop ran; unscoped apply illegal); do not lead with it. We still do not invent a larger $\tau^2$ table and we do not claim SOTA or reliability.

---

## 11. One-paragraph claim (for the paper)

Write $C$ vs SKU vs wait. Dual implemented arms: $I_{\mathrm{loop}}$ (graph $C$) | $I_{\mathrm{sku}}$ (catalog pointer). Wait is the identity. Do not write the slow factor as $f_\theta$. We cannot train. $f_\theta$ / trainer / $I_{\mathrm{weight}}$ is unimplemented. $I_{\mathrm{sku}}$ is the stand-in slow cell, not the contribution. License for $I_{\mathrm{sku}}$ is an incomplete episode, not price. Typed $\mathrm{Obs}$ is a harness log after the controller implements it, not a FRAMEWORK slogan. Not async weight updates. Held-out airline is a diagnostic, not a lead: one policy-checklist $I_{\mathrm{loop}}$ moved $C$ ($0.7\to 0.9$ at $k=1$), including a regression. Remaining incomplete episodes license $I_{\mathrm{sku}}$. A five-task retail one-shot saturates at $\mathrm{pass}^k=1.0$ — `wait`, a fixed point. See `paper/FRAMEWORK.md`.
