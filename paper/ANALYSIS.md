# 0731 toys diagnose the dual intervention; τ²-bench is the eval

**Status.** Counts below are read from `experiments/live-0731.json` (generated 2026-08-19 09:25 CEST). No number is invented. The toys are a *diagnostic* of \(K_C\), not a benchmark. The established eval is [τ²-bench](https://github.com/sierra-research/tau2-bench); \(\mathrm{pass}^k\) is first-passage under \(k\) i.i.d. repeats. This repo does not yet report τ² scores.

**Thesis (not watered down).** A vdom agent observes its own traces. From \(\mathrm{Obs}\) it either

- \(I_{\mathrm{loop}}\): mutate the AgentGraph (composition of \(K\)) — critics, refine, validators, “don’t repeat that action”;
- \(I_{\mathrm{weight}}\): dispatch an async trainer; serving keeps old \(f_\theta\); mount only if the eval gate passes.

The 0731 toys *found* which arm \(\mathrm{Obs}\) should emit first. They do not replace τ²-bench.

---

## 1. What was measured

| Field | Value |
| --- | --- |
| File | `experiments/live-0731.json` |
| Model | `deepseek/deepseek-v4-flash-0731` only |
| Provider | OpenRouter (`keyed: true`) |
| First-passage | \(N=12\) per task × \(\tau\in\{0,0.7\}\) → 72 traces |
| Coupling | \(N=6\) pairs per task × \(\tau\) → 36 pairs / 72 rollouts |
| Planned / completed | 144 / 144, `stoppedReason: complete` |
| `max_tokens` | 48 |
| Envs | simulated, public (`src/tasks.ts`) |

A prior \(N=2\) probe at \(\tau=0.7\) hit all three toys. That was a fluke. \(N=12\) is the measurement.

These three fixtures (word-reverse, calculator, retrieval-QA) are **not** the paper’s benchmark. They are a typed-noise diagnostic: same \(f_\theta\), two temperatures, three action spaces, first-passage \((S,F,\tau_S,\tau_F,p_{\mathrm{hit}})\). The claim they support is about *which intervention \(\mathrm{Obs}\) should spawn*, not about “SOTA on word-reverse.”

---

## 2. First-passage (the 0/12 is the diagnostic)

| Task | \(\tau\) | \(N\) | hits | \(p_{\mathrm{hit}}\) | mean \(\tau_S\) | outcome |
| --- | --- | --- | --- | --- | --- | --- |
| word-reverse | 0 | 12 | 0 | 0 | — | timeout × 12 |
| word-reverse | 0.7 | 12 | 0 | 0 | — | timeout × 12 |
| calculator | 0 | 12 | 0 | 0 | — | timeout × 12 |
| calculator | 0.7 | 12 | 0 | 0 | — | timeout × 12 |
| retrieval-QA | 0 | 12 | 12 | 1 | 1 | success × 12 |
| retrieval-QA | 0.7 | 12 | 12 | 1 | 1 | success × 12 |

No \(\tau_F\) on any of the 72 first-passage traces (they never `stop` into \(F\); the two failures sit until `maxSteps=6`).

---

## 3. Action histograms, first action, repeats, channels

Counts are over the 72 first-passage traces (coupling pairs are §6).

### 3.1 Action histograms (task × \(\tau\))

| Task | \(\tau\) | #actions | Histogram | Unique sequences |
| --- | --- | --- | --- | --- |
| word-reverse | 0 | 72 | `reverse_entire` 72 | 1: six × `reverse_entire` |
| word-reverse | 0.7 | 72 | `reverse_entire` 72 | 1: six × `reverse_entire` |
| calculator | 0 | 72 | `tool:add:3,5` 72 | 1: six × `add(3,5)` |
| calculator | 0.7 | 72 | `tool:add:3,5` 72 | 1: six × `add(3,5)` |
| retrieval-QA | 0 | 12 | `tool:search:iclr` 12 | 1: one-step search |
| retrieval-QA | 0.7 | 12 | `tool:search:iclr` 11, `answer:2013` 1 | 2 |

### 3.2 First action already wrong vs first right then fail to switch

| Task | \(\tau\) | First right | First wrong | Then |
| --- | --- | --- | --- | --- |
| word-reverse | 0 | 0/12 | 12/12 `reverse_entire` | stay in that action for 6 steps |
| word-reverse | 0.7 | 0/12 | 12/12 `reverse_entire` | same |
| calculator | 0 | 12/12 `add(3,5)` | 0/12 | **repeat `add`; never `mul(8,2)` (0/12)** |
| calculator | 0.7 | 12/12 `add(3,5)` | 0/12 | same: 0/12 switch to `mul(8,2)` |
| retrieval-QA | 0 | 12/12 `search:iclr` | 0 | hit at step 1 |
| retrieval-QA | 0.7 | 12/12 (`search` 11, `answer:2013` 1) | 0 | hit at step 1 |

Calculator is the sharp case: the first tool is the *correct* add. Failure is a refusal to switch.

### 3.3 Repeat-action rate (same action \(k\) times in a row)

Consecutive-pair repeat rate \(= \#\{i: a_{i}=a_{i-1}\} / \#\{i\ge 2\}\).

| Task | \(\tau\) | all-same traces | max run | run ≥ 6 | consec. repeat |
| --- | --- | --- | --- | --- | --- |
| word-reverse | 0 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| word-reverse | 0.7 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| calculator | 0 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| calculator | 0.7 | 12/12 | 6 | 12/12 | **60/60 = 1** |
| retrieval-QA | 0 | 12/12 (length 1) | 1 | 0 | 0/0 (no pair) |
| retrieval-QA | 0.7 | 12/12 (length 1) | 1 | 0 | 0/0 |

Env observations are likewise constant on the failures: word-reverse always `"lautriv mod"` (72+72); calculator always `"8"` (72+72). Retrieval search returns the ICLR snippet containing “founded in 2013”; the one `answer:2013` returns `"2013"`.

### 3.4 Memory on calculator (the write happens; generation ignores it)

`diracMem` writes `M["tool:add"]="8"` on the first add. After step 1, **24/24** first-passage calculator traces have `memoryAfter = {tool:add: "8"}`, and that key is in the next prompt. The second action is still `add(3,5)`. So this is not “no write of the intermediate 8.” It is a *composition* failure: \(P^{\mathrm{mem}}\) wrote; \(P^{\mathrm{gen}}\) did not consume.

### 3.5 Channel tags

312 first-passage steps. Every step is tagged `{samp, env}`. **`num`: 0/312. `tokenFlipped`: 0/312.**

Live serving always tags `samp` (OpenRouter is the sampling channel) even at \(\tau=0\). That is a channel identity, not evidence of designed noise. Empirically the failing tasks are Dirac-ish: one sequence, all seeds, both temperatures.

---

## 4. Sampling is not the cause

**Lemma (greedy collapse).** If \(\tau=0\), the argmax of \(f_\theta(H)\) is unique a.s., numerical noise is absent, and env / memory / control are Dirac, then \(K_C(\cdot\mid x)=\delta_{\Phi(x)}\). Residual randomness is environmental or a numerical tie — or a loop *in the policy*, not designed noise.

On these traces:

- \(\tau=0\) and \(\tau=0.7\) give the **same** \(p_{\mathrm{hit}}\) on every task (0, 0, 1).
- Word-reverse and calculator produce **one** sequence at both temperatures, identical across 12 seeds.
- Env is deterministic (`"lautriv mod"` / `"8"`). Numerical channel is off.
- Therefore the residual on the two failures is a loop in \(K_C\), not \(\xi^{\mathrm{samp}}\).

The only place designed noise is visible is retrieval at \(\tau=0.7\): 1/12 answers `2013` instead of searching. **Both actions are in \(S\).** Sampling moves mass *inside* the success set, not out of the failure attractors.

Raising \(\tau\) does not rescue the two failures. That is the lemma on a live serving channel.

---

## 5. Metastable loops are attractors of \(K_C\), not missing weights

**Definition (attractors / metastable regimes).** Looping, progressing, and tool-thrashing as quasi-stationary laws. Memory write rules can create almost-absorbing sets.

### Word-reverse: almost-absorbing set \(\{\texttt{reverse\_entire}\}\)

- First action is already wrong (12/12 × 2 temps).
- Then the same action for six steps, timeout, zero progress in \(E\) (observation never leaves `"lautriv mod"`).
- \(\tau_F\) is never hit; they do not `stop`, they sit.
- This is an attractor of \(K_C\). It is not “the model cannot reverse a word”: the coupling split (§6) shows the same \(f_\theta\) emits `reverse_each_word` once a lesson is in \(M\).

### Calculator: almost-absorbing set \(\{\texttt{add(3,5)}\}\)

- First tool is correct (24/24).
- Intermediate 8 is in \(M\) after step 1 (24/24).
- Second tool is the same add, six times, timeout.
- Never `mul(8,2)` on the un-split traces.
- Composition failure of the loop (generation does not consume the write), not missing weights.

### What \(\mathrm{Obs}\) should detect

On both failing toys:

- repeat count / consec. repeat rate \(= 1\);
- \(\tau_F\) absent, timeout at `maxSteps`;
- zero progress in \(E\) (constant observation).

Intervention is \(I_{\mathrm{loop}}\): a validator that forbids the last failed action; a Self-Refine topology; a memory-*consumption* rule / critic (“you have 8, now `mul(8,2)`”).

### Retrieval is not the weight arm

Retrieval hits because the model selects `search:iclr` (correct tool; the snippet contains “founded in 2013”, which *is* the success predicate) or, once, `answer:2013` (parametric). \(I_{\mathrm{weight}}\) is **not** indicated. A failure of the form “I don’t know” / empty retrieval would be the weight arm.

Same \(f_\theta\) succeeds at retrieval and fails at sequential tools. That is the opposite of “the model is bad.”

---

## 6. Coupling is a one-bit \(I_{\mathrm{loop}}\) probe

One memory bit (lesson / hint / retrieved fact) is a \(P^{\mathrm{mem}}\) intervention — a fragment of \(I_{\mathrm{loop}}\). \(N=6\) pairs per task per \(\tau\).

| Task | \(\tau\) | disagree-first | mean Hamming(actions) | \(p_{\mathrm{hit}}\) base | \(p_{\mathrm{hit}}\) split | What the split did |
| --- | --- | --- | --- | --- | --- | --- |
| word-reverse | 0 | **2/6** | 2 | 0/6 | **2/6** | seeds 82, 84: one-step `reverse_each_word` |
| word-reverse | 0.7 | **2/6** | 2 | 0/6 | **2/6** | same seeds, same one-step hit |
| calculator | 0 | 0/6 | 1.5 | 0/6 | **2/6** | first action stays `add`; seeds 81, 82 later emit `mul(8,2)` |
| calculator | 0.7 | 0/6 | 0 | 0/6 | 0/6 | hint does not break `{add}` |
| retrieval-QA | 0 | 0/6 | 0 | 6/6 | 6/6 | both search |
| retrieval-QA | 0.7 | **3/6** | 0.5 | 6/6 | 6/6 | search vs `answer:2013` |

A loop-side memory write *sometimes* leaves the attractor. Temperature never does (un-split \(p_{\mathrm{hit}}\) is unchanged). That is why \(P^{\mathrm{ctrl}}\) picks \(I_{\mathrm{loop}}\) first.

The same bit does not always suffice: word-reverse still fails 4/6 with the lesson; calculator hint fails 4/6 at \(\tau=0\) and 6/6 at \(\tau=0.7\). When loop mutation saturates, spawn the trainer (\(I_{\mathrm{weight}}\)), keep serving on the old \(f_\theta\), mount only if \(\hat p_{\mathrm{hit}}\) on a fixture (and, when present, \(\mathrm{pass}^k\) on τ²) clears the gate.

---

## 7. What \(\mathrm{Obs}\) emits on these traces

`src/observe.ts` is the operator. On the 72 first-passage traces it should write:

| Task | \(\tau\) | Features | Arm |
| --- | --- | --- | --- |
| word-reverse | 0 and 0.7 | `repeatRate=1`, max run 6, timeout, \(E\) stuck on `"lautriv mod"`, first action already wrong | **`I_loop`** / `graph_mutation` (forbid `reverse_entire`; or Self-Refine / lesson write) |
| calculator | 0 and 0.7 | `repeatRate=1`, first action *right*, \(M=\{\texttt{tool:add}:8\}\) ignored, never `mul(8,2)` | **`I_loop`** / `graph_mutation` (forbid last action; critic: consume the 8) |
| retrieval-QA | 0 and 0.7 | \(\hat p_{\mathrm{hit}}=1\), \(\tau_S=1\) | **`wait`** |

Not emitted on this bundle:

- **`I_weight` / `spawn_trainer`.** No “I don’t know”, no empty search, no parametric miss. Same \(f_\theta\) already hits retrieval.
- **`mount_adapter`.** No ready artifact, and the eval gate would be first-passage on a fixture (toys here; τ² \(\mathrm{pass}^k\) when that eval is wired).
- **`rollback`.** No mounted adapter.

Backup rule, not used on these 72 traces: if an \(I_{\mathrm{loop}}\) mutation is applied and \(\hat p_{\mathrm{hit}}\) stays 0 (the coupling already shows 4/6–6/6 residual misses), *then* spawn the trainer on `(add → mul)` / `(reverse_entire ↛ reverse_each_word)` traces. Serving does not stop.

---

## 8. Why the 0/12 founds the thesis (and is not an embarrassment)

Three facts, all from the same \(f_\theta\):

1. **Not “the model is bad.”** Retrieval is 12/12 at both temperatures. Sequential-tool toys are 0/12. The logit map can hit \(S\); the *composition* of \(K\) cannot leave \(\{\texttt{reverse\_entire}\}\) or \(\{\texttt{add}\}\).
2. **Not sampling.** \(\tau=0\) is already Dirac-ish and already fails; \(\tau=0.7\) does not change \(p_{\mathrm{hit}}\) on the failures. Greedy collapse: residual randomness is a policy loop (env is deterministic; `num` is off).
3. **Therefore \(P^{\mathrm{ctrl}}\) picks \(I_{\mathrm{loop}}\) first.** \(\mathrm{Obs}\) sees repeat count, timeout, zero progress. A validator / refine topology / consume-\(M\) rule is a graph mutation. \(I_{\mathrm{weight}}\) is the async backup if that mutation saturates (coupling: the one-bit lesson/hint is not enough on every seed). Mount stays gated.

The \(N=2\) probe that hit everything was a fluke. \(N=12\) is the measurement. The 0/12 *is* the founding diagnostic.

---

## 9. What these toys are not

They are not τ²-bench. They are not a claim that deepseek-v4-flash-0731 “cannot use tools” in the wild. They are a three-channel, two-temperature, first-passage probe that tells \(\mathrm{Obs}\) which arm to raise. A builder who reports only toy \(p_{\mathrm{hit}}\) as if it were an agent benchmark is misusing the traces.

---

## 10. Forthcoming established eval: τ²-bench

**Eval.** [τ²-bench](https://github.com/sierra-research/tau2-bench) (Barres et al., 2025; successor of τ-bench, Yao et al., 2024). Dual-control: agent *and* user act with tools on a shared world (airline / retail / telecom / …). That is a real \(P^{\mathrm{env}}\), not `src/tasks.ts`.

**Metric.** \(\mathrm{pass}^k\) in this framework *is* first-passage under \(k\) i.i.d. repeats:

\[
\mathrm{pass}^k \;=\; \mathbb{P}\big(\tau_S^{(1)}<\tau_F^{(1)},\,\ldots,\,\tau_S^{(k)}<\tau_F^{(k)}\big).
\]

Under independence this is \((p_{\mathrm{hit}})^k\). It is *not* \(\mathrm{pass}@k\) (best of \(k\)). A flaky loop that hits once in \(k\) trials has large \(\mathrm{pass}@k\) and vanishing \(\mathrm{pass}^k\). The eval gate for \(I_{\mathrm{weight}}\) should read \(\mathrm{pass}^k\), not a single lucky rollout — the \(N=2\) fluke is exactly why.

**This repo does not report τ² scores.** No domain table, no \(\mathrm{pass}^1\) / \(\mathrm{pass}^k\) number, no comparison to gpt-4.1 / Claude. When that eval is run, it lands in `experiments/` and the paper cites the JSON. Until then the 0731 toys remain the diagnostic that founds \((\mathrm{Obs},\{I_{\mathrm{loop}},I_{\mathrm{weight}}\})\).

---

## 11. One-paragraph claim (for the paper)

A vdom agent observes its own traces and then either mutates the composition of \(K\) (\(I_{\mathrm{loop}}\)) or dispatches an async trainer that must not interrupt serving (\(I_{\mathrm{weight}}\)). On 144 live rollouts of one serving model, retrieval hits (12/12, \(\tau_S=1\)) while the sequential-tool *diagnostics* sit in temperature-invariant attractors (word-reverse and calculator 0/12 at \(\tau=0\) and at \(\tau=0.7\); consecutive-repeat rate 1; calculator’s first tool is already correct). Sampling is not the cause (greedy collapse); the model is not uniformly bad (same \(f_\theta\) hits retrieval). \(\mathrm{Obs}\) therefore emits \(I_{\mathrm{loop}}\) first; \(I_{\mathrm{weight}}\) is the gated backup if the loop mutation saturates. These toys are not the benchmark. The established eval is τ²-bench, where \(\mathrm{pass}^k\) is first-passage under \(k\) repeats; we do not invent those scores here.
