# Static τ² retail 5×4 is \(\mathbb{P}_{C_0}\), not the closed loop

**Status.** Counts below are read from vdom-harness `eval/tau2/retail-live-20260819T083613Z.json` (2 366 530 bytes; md5 `8158fb87b7f1…`; same bytes as `eval/tau2/latest.json`). Official `compute_metrics` in `eval/tau2/retail-live-metrics.json`, copied here as `experiments/tau2-retail-0731.json`. Generated 2026-08-19 08:36:13 UTC (10:36 CEST). No number is invented.

**What this file is.** Application of the objects in `paper/FRAMEWORK.md` and the closed-loop claim in `paper/ANALYSIS.md` / ICLR `paper/iclr2027/main.tex` (after PR #3) to *this* run. It is a success-set sample from a fixed one-shot graph. It does not replace the cycle table \(\mathrm{pass}^k(t)\).

**One-paragraph claim.** This run is the law \(\mathbb{P}_{C_0}\) of a frozen one-shot graph, not the closed loop \(\mathrm{traces}_t\to\mathrm{Obs}\to P^{\mathrm{ctrl}}\to C_{t+1}\to K_{C_{t+1}}\). \(C\) never jumps: technique `one-shot`, single `solve` node, \(P^{\mathrm{ctrl}}=\mathrm{wait}\) on 20/20 trials, fast clock only, no \(I_{\mathrm{loop}}\), no \(I_{\mathrm{sku}}\). All 20 trials have \(\tau_S<\tau_F\) (reward 1, `user_stop`); official \(\mathrm{pass}^k=1\) for \(k\le 4\); mean (median) event-time \(\tau_S\) is 14.8 (14.5) agent actions. Consecutive same-name tools occur (catalog lookups); consecutive same tool+args occur 0/155; the 0731 `reverse_entire` / `add(3,5)` attractors are absent — the agent exits. Logged \(\mathrm{Obs}\) is `path measure hits S; wait` on every trial. A 1.0 one-shot cannot demonstrate self-improvement: \(P^{\mathrm{ctrl}}\) has no license to fire. Same \(f_\theta\), tasks 0–4 of 114, saturated \(p_{\mathrm{hit}}\). Contrast the toy diagnostic (sequential 0/12). To see the loop, serve a slice where \(\tau_F\) happens or a zero-progress repeat appears.

---

## 0. What was measured

| Field | Value |
| --- | --- |
| File | vdom-harness `eval/tau2/retail-live-20260819T083613Z.json` (= `latest.json`) |
| Metrics | `eval/tau2/retail-live-metrics.json` → `experiments/tau2-retail-0731.json` |
| Command | `PYTHONPATH=python python3 -m tau2_vdom --domain retail --num-tasks 5 --num-trials 4` |
| Benchmark / domain | τ²-bench retail (official tools + user simulator = real \(P^{\mathrm{env}}\)) |
| Agent | `vdom` |
| Model | `deepseek/deepseek-v4-flash-0731` (same \(f_\theta\) as the 0731 toys) |
| Provider | OpenRouter |
| Technique / graph | `one-shot` / `tau2-oneshot` (single `solve` node; `src/eval/tau2-graph.ts`) |
| Slice | tasks `0`–`4` of 114 retail tasks (ids 0…113 in official `tasks.json`) × 4 trials |
| \(N\) | 20 simulations, all present |
| `live` / `smoke` | true / false |
| Official \(\mathrm{pass}^k\) | \(\mathrm{pass}^1=\mathrm{pass}^2=\mathrm{pass}^3=\mathrm{pass}^4=1.0\) |
| `avgReward` | 1.0 |

Per-trial ground truth in this JSON is `actions` + `messages` + `reward` / `termination`. The `traces` array is keyed by `task_id` only in the writer (`extra_traces.get(task_id)`): all four trials of a task share one dump (identical md5 per task; lengths 44, 39, 38, 36, 46). `obs.nSteps = max(len(traces), len(actions))` therefore is **not** per-trial \(\tau_S\). We do not use it.

---

## 1. State / kernel: this is \(\mathbb{P}_{C_0}\), not the closed loop

**Definition 1.1.** \(X_n=(H_n,M_n,E_n,C_n)\). **Definition 2.1 / 2.2.** \(X_{n+1}\sim K_{C_n}(\cdot\mid X_n)\) with
\[
C_{n+1}\sim P^{\mathrm{ctrl}}(\cdot\mid C_n,\mathrm{Obs}(\mathrm{traces}_n)).
\]
**Definition 5.2.** Path measure \(\mathbb{P}_C\) on trajectories, parameterized by control \(C\). After PR #3 the *object* is the iteration of that kernel (Definition 6.2 / ICLR Definition “Closed loop”): \(\mathrm{traces}_t\to\mathrm{Obs}\to P^{\mathrm{ctrl}}\to C_{t+1}\to K_{C_{t+1}}\to\mathrm{traces}_{t+1}\).

On this file:

| Coordinate | What the JSON shows |
| --- | --- |
| \(C_n\) | Fixed. `technique: one-shot`. Graph id `tau2-oneshot`, one node `solve` / role `solve`. Not self-refine (no critic/refine). Not reflexion (no actor/reflect/memory). |
| \(P^{\mathrm{ctrl}}\) | Identity. No graph mutation, no trainer spawn, no mount, no rollback, no capability mount. |
| Clocks | **Fast clock only.** Serving steps \(n\). No slow-clock job, no \(T_{\mathrm{adapt}}\), no gated \(f_\theta\mapsto f_{\theta'}\). |
| \(I_{\mathrm{loop}}\) | Not applied. |
| \(I_{\mathrm{sku}}\) | Not applied (neither request nor mount). |
| \(f_\theta\) | Constant: `deepseek/deepseek-v4-flash-0731`. |

So \(C_n=C_0\) for every \(n\) on every trial. The recorded law is \(\mathbb{P}_{C_0}\), the one-shot serving kernel. It is *not* the closed-loop process, and it is not a cycle \(t=0,1,\ldots\) of \(\mathrm{pass}^k(t)\).

Lemma (wait is a fixed point): if \(\mathrm{Obs}\) selects `wait`, then \(C_{t+1}=C_t\) and \(K\) is unchanged. That is this run.

---

## 2. First-passage

**Definition 5.3.** Disjoint \(S,F\subset\mathcal{X}\),
\[
\tau_S=\inf\{n:X_n\in S\},\qquad \tau_F=\inf\{n:X_n\in F\},\qquad p_{\mathrm{hit}}=\mathbb{P}_C(\tau_S<\tau_F).
\]
On τ², \(S\) is official reward \(1\) with termination `user_stop`; \(F\) would be a failed / timed-out episode. \(\mathrm{pass}^k\) is first-passage under \(k\) i.i.d. repeats, not \(\mathrm{pass}@k\) (ANALYSIS §10; ICLR Definition “First passage”).

**Event-time \(\tau_S\).** An agent step is one generation plus env/memory updates (Definition 0.1). The per-trial trajectory we can trust is `actions` (assistant text and tool calls, in order, until `user_stop`). We report \(|a|\) as \(\tau_S\) in that clock, and assistant-message count as the generation clock (a generation may emit several tools).

### 2.1 Every trial hits

| \(N\) | hits | \(p_{\mathrm{hit}}\) | \(\tau_S<\tau_F\) | termination | reward |
| --- | --- | --- | --- | --- | --- |
| 20 | 20 | 1 | 20/20 | `user_stop` × 20 | 1.0 × 20 |

No timeout. No zero-reward. No \(\tau_F\) in the file. Two trials call `transfer_to_human_agents` (task 2 trial 0; task 1 trial 3) and still score reward 1.0 / `user_stop` — the world is already in \(S\) when the transfer fires.

Official `compute_metrics`: \(\mathrm{avgReward}=1.0\), \(\mathrm{pass}^1=\mathrm{pass}^2=\mathrm{pass}^3=\mathrm{pass}^4=1.0\).

### 2.2 Steps-to-success (\(\tau_S\) in event time)

| Clock | \(N\) | mean | median | min | max | sum |
| --- | --- | --- | --- | --- | --- | --- |
| \(\|a\|\) (actions until `user_stop`) | 20 | **14.8** | **14.5** | 11 | 19 | 296 |
| assistant generations | 20 | 10.8 | 11 | 8 | 15 | 216 |
| tool calls | 20 | 8.75 | 10 | 6 | 11 | 175 |
| text actions | 20 | 6.05 | 6 | 4 | 8 | 121 |

Per task (action clock):

| Task | trials \(\|a\|\) | mean | median | tools | asst. gens | hits |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 14, 11, 12, 11 | 12.00 | 11.5 | 7,6,6,6 | 12,9,11,9 | 4/4 |
| 1 | 11, 13, 13, 14 | 12.75 | 13 | 6,6,6,7 | 9,11,11,12 | 4/4 |
| 2 | 19, 16, 14, 16 | 16.25 | 16 | 11,10,10,10 | 13,11,8,10 | 4/4 |
| 3 | 15, 18, 15, 14 | 15.50 | 15 | 10,10,10,10 | 9,14,9,8 | 4/4 |
| 4 | 19, 17, 17, 17 | 17.50 | 17 | 11,11,11,11 | 15,11,12,12 | 4/4 |

All five tasks have \(p_{\mathrm{hit}}=1\), so \(\mathrm{pass}^4=1\) per task and on the slice.

### 2.3 Per-trial table

| Task | Trial | reward | term | \(\tau_S=\|a\|\) | #text | #tool | #asst | #user | #tool-msg | Obs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 1.0 | user_stop | 14 | 7 | 7 | 12 | 7 | 7 | wait |
| 0 | 1 | 1.0 | user_stop | 11 | 5 | 6 | 9 | 5 | 6 | wait |
| 0 | 2 | 1.0 | user_stop | 12 | 6 | 6 | 11 | 6 | 6 | wait |
| 0 | 3 | 1.0 | user_stop | 11 | 5 | 6 | 9 | 5 | 6 | wait |
| 1 | 0 | 1.0 | user_stop | 11 | 5 | 6 | 9 | 5 | 6 | wait |
| 1 | 1 | 1.0 | user_stop | 13 | 7 | 6 | 11 | 7 | 6 | wait |
| 1 | 2 | 1.0 | user_stop | 13 | 7 | 6 | 11 | 7 | 6 | wait |
| 1 | 3 | 1.0 | user_stop | 14 | 7 | 7 | 12 | 7 | 7 | wait |
| 2 | 0 | 1.0 | user_stop | 19 | 8 | 11 | 13 | 8 | 11 | wait |
| 2 | 1 | 1.0 | user_stop | 16 | 6 | 10 | 11 | 6 | 10 | wait |
| 2 | 2 | 1.0 | user_stop | 14 | 4 | 10 | 8 | 4 | 10 | wait |
| 2 | 3 | 1.0 | user_stop | 16 | 6 | 10 | 10 | 6 | 10 | wait |
| 3 | 0 | 1.0 | user_stop | 15 | 5 | 10 | 9 | 5 | 10 | wait |
| 3 | 1 | 1.0 | user_stop | 18 | 8 | 10 | 14 | 8 | 10 | wait |
| 3 | 2 | 1.0 | user_stop | 15 | 5 | 10 | 9 | 5 | 10 | wait |
| 3 | 3 | 1.0 | user_stop | 14 | 4 | 10 | 8 | 4 | 10 | wait |
| 4 | 0 | 1.0 | user_stop | 19 | 8 | 11 | 15 | 8 | 11 | wait |
| 4 | 1 | 1.0 | user_stop | 17 | 6 | 11 | 11 | 6 | 11 | wait |
| 4 | 2 | 1.0 | user_stop | 17 | 6 | 11 | 12 | 6 | 11 | wait |
| 4 | 3 | 1.0 | user_stop | 17 | 6 | 11 | 12 | 6 | 11 | wait |

Totals: 296 actions = 121 text + 175 tools; 512 messages = 216 assistant + 121 user + 175 tool-results.

---

## 3. Channels

**Definitions 3.1–3.4.** Sampling \(\xi^{\mathrm{samp}}\) (decoding RNG), numerical \(\xi^{\mathrm{num}}\) (logit perturbation; Lemma 3.5 / gap-sensitivity), environmental \(\xi^{\mathrm{env}}\) (tools, user simulator, clocks).

The writer tags `obs.channels = ["env"]` whenever any tool appears, else `["samp"]`. That is a coarse episode tag, not a per-step channel. We classify from `messages` / `actions` instead.

| Channel | What we can count | Count |
| --- | --- | --- |
| samp | assistant generations (OpenRouter decode) | 216 |
| samp (text-only subset) | assistant messages with `usage` | 121 (prompt tokens 112 091, completion 22 010) |
| env | tool-result messages | 175 |
| env | user-simulator messages (τ² dual-control) | 121 |
| env | tool calls that returned `ok: true` | 175/175 |
| env | tool failures (`ok: false` / `obs.toolFailures`) | **0/175** and **0/20** |
| num | logit gaps, \(\Delta\ell\), `tokenFlipped` | **unobserved** — not in this JSON |

Lemma 3.5 cannot be tested here. We do not invent a numerical flip rate.

**Sampling vs outcome.** Four i.i.d. trials per task, all in \(S\). Tool-*name* sequences are not Dirac: 2 unique / 4 on tasks 0, 1, 3, 4; 3 unique / 4 on task 2. Variation stays *inside* \(S\) (same pattern as retrieval-QA at \(\tau=0.7\) on the toys: 1/12 answered `2013` instead of searching; both actions in \(S\)). There is **no evidence on this slice that sampling flips the outcome**. \(N=5\) tasks is the easy head of 114. This does not license a claim about \(\xi^{\mathrm{samp}}\) on the rest of retail.

---

## 4. Attractors / loops

**Definition 5.5.** Looping, progressing, and tool-thrashing as quasi-stationary laws. The 0731 toys found almost-absorbing sets \(\{\texttt{reverse\_entire}\}\) and \(\{\texttt{add(3,5)}\}\): consecutive-repeat rate \(60/60=1\), max run 6, timeout, constant observation.

On this run we count consecutive tools two ways (same *name*; same *name+args*). The writer’s `repeat` flag is “this tool+args already appeared in the trial” (not necessarily consecutive). `obs.repeatActions` is that count.

### 4.1 Consecutive repeats

Consecutive-pair rate \(=\#\{i:a_i=a_{i-1}\}/\#\{i\ge 2\}\).

| Equality | pairs | repeats | rate | trials with a repeat | max run | run \(\ge 6\) |
| --- | --- | --- | --- | --- | --- | --- |
| tool name | 155 | **60** | 0.387 | 20/20 | 5 | **0/20** |
| tool name+args | 155 | **0** | 0 | 0/20 | 1 | 0/20 |
| any action, name | 276 | 60 | 0.217 | 20/20 | 5 | 0/20 |
| any action, full | 276 | **0** | 0 | 0/20 | 1 | 0/20 |
| writer `repeat` flag | 296 actions | **0** | 0 | 0/20 | — | — |
| `obs.repeatActions` | 20 trials | **0** | — | 0/20 | — | — |

A-B-A name ping-pong (tool \(A\), \(B\neq A\), \(A\)): **0** triples.

### 4.2 The 60 same-name pairs are catalog lookups, not attractors

Every same-name run has *distinct* arguments:

| Pattern | Where | Args |
| --- | --- | --- |
| `get_product_details` × 2 | tasks 0,1 × 4 trials | product ids `1656367028`, `4896585277` |
| `get_order_details` × 5 | tasks 2,3,4 × 4 trials | order ids `#W6247578`, `#W9711842`, `#W4776164`, `#W6679257`, `#W2378156` |
| `modify_pending_order_items` × 2 | task 4 × 4 trials | two different `order_id`s (`#W6247578`, `#W4776164`) |

This is progressing through \(E\) (two products, five orders, two modifications). Observation is not constant. The agent then emits a write tool (`exchange_delivered_order_items` / `return_delivered_order_items` / `modify_pending_order_items`) and a closing text, and the user stops. **It exits.**

### 4.3 Tool histogram (175 calls)

| Tool | count |
| --- | --- |
| `get_order_details` | 68 |
| `get_product_details` | 28 |
| `find_user_id_by_name_zip` | 20 |
| `get_user_details` | 20 |
| `list_all_product_types` | 13 |
| `modify_pending_order_items` | 12 |
| `exchange_delivered_order_items` | 8 |
| `return_delivered_order_items` | 4 |
| `transfer_to_human_agents` | 2 |

First action is text `"Hi! How can I help you today?"` on 20/20. First tool is `find_user_id_by_name_zip` on 20/20. Last action is text on 20/20 (two of those are the transfer hold line).

### 4.4 Contrast with the 0731 toys

| | 0731 sequential toys | this retail slice |
| --- | --- | --- |
| same action+args run | 6/6, rate 1 | **never** (0/155) |
| timeout / \(\tau_F\) | timeout × 24 (word-reverse + calculator) | none |
| \(E\) progress | observation stuck (`"lautriv mod"` / `"8"`) | distinct order/product ids, then a write |
| \(p_{\mathrm{hit}}\) | 0/12 | 20/20 |
| \(\mathrm{Obs}\) | \(I_{\mathrm{loop}}\) | `wait` |

The static retail run does **not** show the toy attractors.

---

## 5. \(\mathrm{Obs}\) counterfactual (and the logged operator)

**Definition 6.1.** \(\mathrm{Obs}:\mathrm{traces}\to\) features in \(M\). Not a fourth noise channel. **Definition 6.2 / wait lemma.** Support includes `wait` (Dirac identity on \(C\)).

The runtime writer (`python/tau2_vdom/runner.py` `_obs`) already ran a reward-based operator on each trial:

| Feature | 20/20 value |
| --- | --- |
| `critique` | `path measure hits S; wait` |
| `nSuccessProxy` | 1 |
| `toolFailures` | 0 |
| `repeatActions` | 0 |
| `channels` | `["env"]` |

That matches the paper operator (`src/observe.ts`): if \(\hat p_{\mathrm{hit}}\ge 1\) then `arm = wait`, critique `path measure hits S; wait`. No timeout, no zero-progress loop, no knowledge-miss string, no fixture `reverse_entire`.

**Counterfactual after the trial.** For each of the 20 trials, if \(\mathrm{Obs}\) ran again on that trial’s `actions` + reward, it would emit **`wait`**. \(P^{\mathrm{ctrl}}(\mathrm{wait}\mid C_0,\mathrm{Obs})=\delta_{C_0}\). The closed loop is at a fixed point on this slice.

**That is why a 1.0 one-shot cannot demonstrate self-improvement.** Self-improvement is an *iteration* of \(P^{\mathrm{ctrl}}\) that changes \(K\) (or, on the slow clock, \(f_\theta\)) and then observes the *new* traces. Here \(P^{\mathrm{ctrl}}\) has no license to fire. \(\mathrm{pass}^k=1\) is a ceiling on \(\mathbb{P}_{C_0}\), not a \(\Delta\) along the loop.

---

## 6. Why this does not found \(I_{\mathrm{sku}}\) or \(I_{\mathrm{loop}}\)

The 0731 toys *licensed* \(I_{\mathrm{loop}}\) on cycle \(t=0\): same \(f_\theta\), retrieval 12/12, sequential tools 0/12, temperature-invariant attractors, coupling sometimes leaves, \(\tau\) never does.

This file is the opposite sample:

1. **Same \(f_\theta\).** `deepseek/deepseek-v4-flash-0731`. The logit map that sat in \(\{\texttt{add(3,5)}\}\) on the calculator toy completes retail tasks 0–4.
2. **Easy head.** Tasks 0–4 of 114. Not airline, not telecom, not the remaining 109 retail tasks.
3. **Saturated \(p_{\mathrm{hit}}\).** 20/20, \(\mathrm{pass}^4=1\). No miss for a mount gate to read; no residual for a trainer to fit.
4. **No metastable loop.** Repeat-of-args rate 0; the agent exits (Definition 5.5 progressing, not looping).
5. **No incomplete episode.** No hang / no-write / crash that would raise \(I_{\mathrm{sku}}\).

Therefore \(\mathrm{Obs}\) emits `wait`, not `graph_mutation` and not `spawn_trainer`. This run does **not** found either arm. It is a *success-set sample from \(\mathbb{P}_{C_0}\)* on an easy head.

To see the loop we need a slice where \(\tau_F\) happens, or a zero-progress repeat appears, so that \(\mathrm{Obs}\) leaves `wait` and \(P^{\mathrm{ctrl}}\) is allowed to iterate. That is the TO RUN cycle table (`paper/ANALYSIS.md` §0; ICLR §4.2), not this JSON.

---

## 7. \(\mathrm{pass}^k\) vs \(\mathrm{pass}@k\)

**Definition 5.3 / ICLR Definition “First passage.”**
\[
\mathrm{pass}^k=\mathbb{P}\big(\tau_S^{(i)}<\tau_F^{(i)}\ \forall i\le k\big)=(p_{\mathrm{hit}})^k
\]
under independence. This is reliability across \(k\) i.i.d. repeats, **not** \(\mathrm{pass}@k\) (best of \(k\)).

On this slice every task has 4/4 hits, so \(\mathrm{pass}^4=1\) equals \(\mathrm{pass}@4=1\). They coincide *because the slice is saturated*. A flaky loop that hits once in four trials would have large \(\mathrm{pass}@4\) and \(\mathrm{pass}^4=0\). The \(N=2\) toy fluke is why the \(I_{\mathrm{sku}}\) gate must read \(\mathrm{pass}^k\). This file does not illustrate that gap — it illustrates the other failure mode: a reliability-1 ceiling on which the gate never has a reason to move \(C\).

---

## 8. What this file is not

- Not \(\mathrm{pass}^k(t)\) on the closed loop (cycle table remains TO RUN).
- Not a founding diagnostic for \(I_{\mathrm{loop}}\) or \(I_{\mathrm{sku}}\) (the 0731 toys remain that).
- Not a claim that the model “can use tools” on all of τ² (5 of 114 retail tasks).
- Not a channel measurement of \(\xi^{\mathrm{num}}\) (unobserved).
- Not a comparison table against other models.

When an unsaturated slice is run and `improveLoop` iterates, cite *that* JSON in `paper/ANALYSIS.md` §0 and ICLR §4.2. Until then this document is the precise reading of \(\mathbb{P}_{C_0}\) at a `wait` fixed point.
