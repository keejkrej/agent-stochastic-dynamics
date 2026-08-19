# Typed-noise stochastic dynamics of LLM agents

**Status.** Theoretical framework. Objects below are definitions, lemmas, conjectures, or engineering interfaces; the type is named at each claim.

**Accompanying implementation.** [vdom-harness](https://github.com/keejkrej/vdom-harness) is the runtime submitted with this paper (not a side project, not related-work-only): a self-observing agent that reengineers its loop and/or dispatches async weight updates. TypeScript virtual DOM: topology is a value; a reconciler mounts / updates / unmounts. This document does not clone that repo. It writes the process of which vdom is the control. Papers, blogs, GitHub, X, and other agents are inputs to that runtime, not the product.

**Thesis.** A vdom agent can *observe itself*: it reads its own traces, first-passage times, and failures, and writes a critique of its own path measure into memory. From that observation it has a dual intervention. (1) *Loop:* emit a new AgentGraph; reconcile mutates the composition of the serving kernel \(K\). (2) *Weights:* dispatch an asynchronous trainer (HF job / LoRA). The serving loop keeps running on the old \(f_\theta\). When the artifact is ready *and* the eval gate passes, reconcile swaps the model pointer. Failed eval is no-switch / rollback. Two clocks: fast serving \(n\), slow adapter jumps. Determinism and learning are allocated, not assumed.

---

## §0 Setup and gap

An LLM-based agent is not a token generator. It is a closed loop

\[
\text{model}\;\to\;\text{action / tool call}\;\to\;\text{observation}\;\to\;\text{memory / state}\;\to\;\text{model}.
\]

Inside one generation, weights \(\theta\) are fixed and the core map \(f_\theta\) from context to logits is deterministic. Between steps the graph, the bound provider, and the adapter may jump: that is what vdom's reconciler, `PhysicalNode.provider`, capability gates, and adapter mounts do.

**Definition 0.1 (hybrid time).** An *agent step* is one generation plus its environment and memory updates. Time \(n\in\mathbb{N}\) is discrete and event-driven. There is no underlying continuous clock on which the loop is a diffusion.

The primary language of stochastic analysis on manifolds,

\[
\mathrm{d}X_t = b(X_t)\,\mathrm{d}t + \sigma(X_t)\,\mathrm{d}W_t,
\]

is the wrong *primary* language here. The state is not a point on a Riemannian manifold. Time is not continuous. The dominant noise is not Brownian. Drift is not a vector field: it is \(f_\theta\) composed with a decoding policy and an environment. An SDE can appear later as a *coarse-grained* description of a projection \(z_n=\Pi(X_n)\), under mixing hypotheses that agents typically violate (they commit; they do not mix).

**The gap.** There is no existing framework that simultaneously (i) treats the full closed loop as a hybrid Markov process, (ii) *separates* sampling, numerical, and environmental noise as distinct channels, and (iii) writes decoding controls and graph-level harness edits as interventions on a kernel \(K\). Adjacent work is real and is located, not dismissed:

- *Generation SDEs.* [Unraveling Text Generation in LLMs](https://arxiv.org/abs/2408.11863) (arXiv:2408.11863) and [A Stochastic Differential Equation Framework for Multi-Objective LLM Interactions](https://arxiv.org/abs/2510.10739) (arXiv:2510.10739) put drift–diffusion on latent or objective coordinates of *token generation* / iterative prompting. [Language Generation as Optimal Control](https://arxiv.org/abs/2605.14531) (arXiv:2605.14531) treats generation as stochastic control in a latent control space (HJB / flow matching). These do not carry tools, structured memory, or a graph \(C\).
- *Memory as MDP / Langevin.* SuperLocalMemory V3 (arXiv:2603.14588) writes memory *lifecycle* as Riemannian Langevin + Fokker–Planck. MemCon (arXiv:2607.13591) is a Memory-MDP over retrieve / consolidate / forget. Memento 2 (arXiv:2512.22716) defines an SRDP in which write = policy evaluation and read = policy improvement. Memp (arXiv:2508.06433) stores procedural abstractions. These enlarge the MDP for memory ops; they do not type decoding noise against tool noise against numerics.
- *Linguistic feedback.* Reflexion (Shinn et al., arXiv:2303.11366) and Self-Refine (Madaan et al., arXiv:2303.17651) update text, not weights. In this language they are particular \(P^{\mathrm{mem}}\) and graph compositions, not a dynamics.
- *Classical.* Langevin, Fokker–Planck, Freidlin–Wentzell LDP, MDP/POMDP, Doob \(h\)-transform, Gumbel-max: used below as named tools, not as “the model of an agent.”

---

## §1 State space

**Definition 1.1 (hybrid state).** At step \(n\),

\[
X_n = (H_n, M_n, E_n, C_n) \in \mathcal{X} = \mathcal{V}^* \times \mathcal{M} \times \mathcal{E} \times \mathcal{C}.
\]

| Symbol | Space | Meaning |
| --- | --- | --- |
| \(H_n\) | \(\mathcal{V}^*\) | Context / token-or-event history. Finite words over a vocabulary \(\mathcal{V}\) (or a countable event alphabet that includes tool calls and observations). |
| \(M_n\) | \(\mathcal{M}\) | Structured memory: vdom `memoryStore`, traces, persistence. Not an embedding. |
| \(E_n\) | \(\mathcal{E}\) | Environment / tool world. May be replayable (simulated) or live. |
| \(C_n\) | \(\mathcal{C}\) | *Control configuration*: the AgentGraph plus decoding knobs (temperature, constraints, validators, commit gates, bound model / adapter ids, mounted capabilities). |

**Definition 1.2 (coarse field).** An optional projection \(z_n = \Pi(X_n)\in\mathbb{R}^d\) (embedding summary, score vector) is a *statistic*, never the true state. Fokker–Planck statements, if any, are about the law of \(z_n\), and only after a mixing hypothesis that must be stated.

**Definition 1.3 (core model).** For fixed \(\theta\),

\[
f_\theta : \mathcal{V}^* \to \mathbb{R}^{|\mathcal{V}|}, \qquad \ell = f_\theta(H)
\]

is a deterministic logit map. Numerical noise may perturb \(\ell\); decoding samples a token (or an action string) from the perturbed logits. \(\theta\) is constant *inside* a generation. A model / adapter swap is a jump \(f_\theta \mapsto f_{\theta'}\) and lives in \(P^{\mathrm{ctrl}}\), not in \(f_\theta\).

---

## §2 Transition kernel, factored

One agent step is a *composition*, not a diffusion.

**Definition 2.1 (factored step).** Given \(X_n=(H_n,M_n,E_n,C_n)\),

1. **Generation.** \(a_{n+1}\sim P^{\mathrm{gen}}_{C_n}(\cdot\mid H_n,M_n)\) (text and/or tool calls).
2. **Environment.** \((E_{n+1},o_{n+1})\sim P^{\mathrm{env}}(\cdot\mid E_n,a_{n+1})\).
3. **Memory.** \(M_{n+1}\sim P^{\mathrm{mem}}_{C_n}(\cdot\mid M_n,H_n,a_{n+1},o_{n+1})\).
4. **Context.** \(H_{n+1}=\mathrm{append}(H_n,a_{n+1},o_{n+1})\) (Dirac given those arguments).
5. **Control.** \(C_{n+1}\sim P^{\mathrm{ctrl}}(\cdot\mid C_n,\mathrm{traces}_n)\). In vdom this is often Dirac: a scientist emits a graph; `reconcile` is a deterministic function of \((\mathrm{prev},\mathrm{next})\).

**Definition 2.2 (controlled hybrid Markov process).** The composition is a kernel

\[
X_{n+1} \sim K_{C_n}(\cdot\mid X_n)
\]

on \(\mathcal{X}\). The process \((X_n)_{n\ge 0}\) is Markov on \(\mathcal{X}\) with control-dependent kernel \(K_C\). If \(C_{n+1}\) is a (possibly random) function of traces, the pair \((X_n)\) remains Markov on \(\mathcal{X}\) because \(C_n\subset X_n\).

This is a *controlled hybrid Markov process*: discrete event time; mixed discrete / structured / external coordinates; control in the state.

---

## §3 Three noise channels

Conditionally independent given \(X_n\), write a product of kernels.

**Definition 3.1 (sampling noise) \(\xi^{\mathrm{samp}}\).** The decoding RNG. Temperature \(\tau\), top-\(p\), seed. *Designed* noise. Under a unique argmax and \(\tau\to 0\), \(P^{\mathrm{dec}}\) collapses to a Dirac (greedy automaton).

**Definition 3.2 (numerical / systems noise) \(\xi^{\mathrm{num}}\).** Floating-point non-associativity, GPU reduction order, batching, speculative-decoding mismatch. Model as a logit perturbation

\[
\tilde{\ell} = f_\theta(H)+\varepsilon,
\]

with \(\varepsilon\) small and *not* white in time (the same kernel / batch / device induces dependent errors). This is not a diffusion coefficient.

**Definition 3.3 (environmental noise) \(\xi^{\mathrm{env}}\).** Tools, web, clocks, humans, other agents. Dominant irreducible channel. Discrete, heavy-tailed, possibly adversarial. Not Brownian.

**Definition 3.4 (generation factorization).**

\[
P^{\mathrm{gen}}(a\mid H,M,C) = \int P^{\mathrm{dec}}_C(a\mid \tilde{\ell})\, P^{\mathrm{num}}(\mathrm{d}\tilde{\ell}\mid f_\theta(H),C).
\]

**Measurement (engineering interface, not a theorem).**

| Channel | Hold fixed | Vary |
| --- | --- | --- |
| samp | env replay, device, batch | seed, \(\tau\) |
| num | seed, prompts | kernel / batch / GPU |
| env | seed, \(\tau\), device | replay tools vs live |

---

### Lemma 3.5 (gap-sensitivity of numerical noise)

Let \(\ell\in\mathbb{R}^{|\mathcal{V}|}\) have unique argmax \(i^\star\), and \(\Delta\ell:=\ell_{(1)}-\ell_{(2)}\). Let \(\tilde{\ell}=\ell+\varepsilon\) and \(\eta=\|\varepsilon\|_\infty\).

**Claim.** If \(\Delta\ell > 2\eta\), then \(\arg\max\tilde{\ell}=i^\star\). Consequently

\[
\mathbb{P}(\arg\max\tilde{\ell}\ne i^\star) \le \mathbb{P}(\Delta\ell \le 2\|\varepsilon\|_\infty).
\]

**Proof.** Suppose \(j\neq i^\star\) and \(\tilde{\ell}_j>\tilde{\ell}_{i^\star}\). Then \(\ell_j+\varepsilon_j>\ell_{i^\star}+\varepsilon_{i^\star}\), so \(\ell_{i^\star}-\ell_j < \varepsilon_j-\varepsilon_{i^\star}\le 2\eta\). In particular \(\Delta\ell\le 2\eta\). The complementary event is therefore impossible off the near-tie set. \(\square\)

Numerical noise is a *boundary layer* on near-ties, not a volatility \(\sigma(x)\) in an SDE. Most tokens are insensitive.

---

## §4 Why classical tools break, what to invent

| Classical object | Why it fails as the primary model |
| --- | --- |
| Manifold SDE | \(\mathcal{X}\) is a product of discrete tokens, structured memory, and an external world. |
| Continuous time | Steps are generations and tool returns. |
| Brownian / Gaussian noise | Sampling is designed and categorical; env is heavy-tailed; num is a rare-tie perturbation. |
| Vector-field drift | Drift is \(f_\theta\) plus a decoder plus tools. |
| Infinitesimal generator on \(\mathcal{V}^*\) | Formal, not useful for builders. |
| Lyapunov Jacobians | Sampling is discrete; linearization is undefined. Use *couplings* and TV / Hamming / Wasserstein of kernels. |
| Fokker–Planck on embeddings | Coarse-grained approximation under mixing. Agents commit; they do not mix. |
| Freidlin–Wentzell LDP | Needs small-noise diffusions. Here small-noise is only the numerical channel. Path LDPs that *are* natural: Sanov on ensembles of rollouts; rare-event LDP for env failures. |

**What to invent (this framework).**

- Typed-noise hybrid kernels \(K_C = P^{\mathrm{gen}}_C\otimes P^{\mathrm{env}}\otimes P^{\mathrm{mem}}_C\otimes P^{\mathrm{ctrl}}\).
- Coupling Lyapunov / cascade exponents (Hamming on prefixes, not TV — TV Lipschitz of any kernel is \(\le 1\)).
- Control theory for decoding policies (\(\tau\), grammars, validators as Doob / rejection).
- Selection kernels: best-of-\(k\) is a nonlinear map on empirical measures (McKean–Vlasov-like).
- Commit as optional stopping: freeze a coordinate of \(X\), kill future branching.

---

## §5 Objects to study

**Definition 5.1 (trajectory).** \(\mathbf{X}=(X_n)_{n\le T}\) and the action-observation path \((a_n,o_n)\).

**Definition 5.2 (path measure).** \(\mathbb{P}_C\) is the law of \(\mathbf{X}\) on \(\mathcal{X}^{\mathbb{N}}\), parameterized by control \(C\) (or by a control process if \(C_n\) jumps).

**Definition 5.3 (first passage).** Let \(S,F\subset\mathcal{X}\) be disjoint measurable success / failure sets. Hitting times

\[
\tau_S:=\inf\{n:X_n\in S\},\qquad \tau_F:=\inf\{n:X_n\in F\},
\]

hit probability \(p_{\mathrm{hit}}=\mathbb{P}_C(\tau_S<\tau_F)\), and expected cost \(\mathbb{E}_C[\tau_S\wedge\tau_F\wedge T]\). This is what builders already measure (`runBenchmark` score, timeout). Name it.

**Definition 5.4 (cascade / coupling).** Let \(X_0,X_0'\) differ by one memory bit or one token. Couple the kernels. TV of the *laws* cannot expand: \(\|\mu K-\nu K\|_{\mathrm{TV}}\le\|\mu-\nu\|_{\mathrm{TV}}\). Expansion is visible in a *weaker* metric — Hamming on prefixes, or a Wasserstein on \(\Pi(X)\). Write

\[
\rho_n := \mathbb{E}\big[d(X_n,X_n')\big],\qquad d_{\mathrm{Ham}}(H,H')=\sum_i \mathbf{1}_{H_i\neq H_i'}+\big||H|-|H'|\big|.
\]

The *cascade exponent* is the local growth rate of \(\rho_n\) before coupling. Autoregression plus memory write is typically expanding in \(d_{\mathrm{Ham}}\): one bit becomes many tokens.

**Definition 5.5 (attractors / metastable regimes).** Looping, progressing, and tool-thrashing as quasi-stationary laws of \((z_n,M_n)\). Memory write rules create almost-absorbing sets (a lesson that is never revised).

**Definition 5.6 (large deviations).** Sanov on \(N\) i.i.d. rollouts (empirical path measure). Rare-event LDP for env failures. *Not* a default Freidlin–Wentzell on embeddings.

---


## §6 Self-observation and dual intervention

This is the reason the framework exists. Typed noise and the factored kernel are the *language*. The *act* is that a vdom agent watches its own path measure and then edits either the loop or the weights.

**Definition 6.1 (self-observation).** Let (\mathrm{traces}_n = (a_i,o_i,\text{channel tags})_{i\le n}) together with first-passage proxies ((\hat\tau_S,\hat\tau_F,\hat p_{\mathrm{hit}})). The observation operator

\[
\mathrm{Obs}: \text{traces} \to \text{features in }\mathcal{M}
\]

writes a critique of the agent's *own* path measure into memory:

\[
M \leftarrow M \cup \{\texttt{obs}: \mathrm{Obs}(\mathrm{traces})\}.
\]

This is a memory write, typically Dirac given traces. It is *not* a fourth noise channel. Examples of features: "\(p_{\mathrm{hit}}=0\) on the fixture", "tool-thrash on `search`", "\(\tau_S\) exceeded budget", "near-tie rate high (numerical channel)". In vdom this is `traces` plus `runBenchmark.score`.

**Definition 6.2 (control from observation).**

\[
C_{n+1} \sim P^{\mathrm{ctrl}}(\cdot \mid C_n, \mathrm{Obs}(\mathrm{traces}_n)).
\]

The support of (P^{\mathrm{ctrl}}) is a small discrete set of interventions, not an open-ended "do something":

| Intervention | What it does to \(K\) |
| --- | --- |
| `graph_mutation` | Scientist emits (G'). `reconcile((G,G'))` is a deterministic map. The *composition* of (K) changes (critics, refine, extra agents, validators). (f_\theta) is unchanged. |
| `spawn_trainer` | Dispatch an asynchronous sub-agent (Trainer port / HF job / LoRA) on traces. Serving continues on the current (K_C\). No immediate jump in (f_\theta\). |
| `mount_adapter` | Allowed only after the artifact is ready *and* an eval gate passes. Rebind `PhysicalNode.provider` / `adapterRef`. Jump (f_\theta \mapsto f_{\theta'}\). |
| `rollback` | Unmount. Restore the previous model pointer. Kernel returns to (K_C\). |
| `capability_mount` | Change the tool signature of (P^{\mathrm{env}}) (gated, same sandbox). |
| `commit` / `wait` | Optional stopping, or Dirac identity on (C\). |

**Definition 6.3 (two clocks).**

- **Fast clock** (n\in\mathbb{N}\): the serving kernel (K_C\). Sampling and environmental noise live here. Weights (\theta\) are frozen inside a generation and across serving steps until a slow jump.
- **Slow clock** (\sigma\in\mathbb{N}\): trainer jobs. Job (\sigma\) consumes traces and returns an artifact (A_\sigma\) at an optional time (T_{\mathrm{adapt}}\). Serving *does not block* on (\sigma\).

On (\{T_{\mathrm{adapt}}=n\}\) the gate (g(A_\sigma,\text{fixture})\in\{\mathrm{mount},\mathrm{reject}\}) is an empirical first-passage test (Definition 5.3). Mount is a jump (C\mapsto C'\) that changes (f_\theta\). Reject is the identity on (C\). The fast process is piecewise homogeneous: (K_C\) until a gated jump, then (K_{C'}\).

**Definition 6.4 (dual intervention).** Write (I_{\mathrm{loop}}) and (I_{\mathrm{weight}}) for the two arms of (P^{\mathrm{ctrl}}) after (\mathrm{Obs}\):

1. **Loop.** (I_{\mathrm{loop}}: G\mapsto G'\) via scientist + reconcile. Changes *who calls whom* and which validators / temperatures / capabilities are mounted. Same (f_\theta\).
2. **Weights.** (I_{\mathrm{weight}}\): spawn trainer; later, if (\hat p_{\mathrm{hit}}\ge\text{threshold}\), swap the model pointer. Jump in (f_\theta\). Topology may be unchanged.

Failed eval ⇒ no switch. Unmount ⇒ rollback. That is vdom PR #3 (`improveLoop`, `gateAdapter`, `gateCapability`, `unmountAdapterOnFailure`).

**Thesis (restated).** A vdom agent observes itself. From (\mathrm{Obs}(\mathrm{traces})\) it either edits its own loop or dispatches an asynchronous weight update while it keeps serving. Reconcile is the deterministic actuator. Determinism is allocated on the fast clock; learning is gated on the slow clock.

### Actuators available to (P^{\mathrm{ctrl}}) after Obs

| Control | Intervention on (K\) |
| --- | --- |
| temperature schedule (\tau_n\) | entropy of (P^{\mathrm{dec}}\); interpolates Dirac (\leftrightarrow\) high entropy |
| constrained decoding / grammars | support restriction / conditioning on a regular language |
| validators | rejection kernel, or Doob (h\)-transform toward a valid set |
| memory write rules | (often Dirac) (P^{\mathrm{mem}}\); (\mathrm{Obs}\) is one such write |
| parallel sample + select | nonlinear kernel (\mathrm{select}(A_1,\ldots,A_k)\) |
| commit gates | optional stopping; freeze a coordinate of (X\) |
| model / adapter swap | *slow* jump in (f_\theta\) after gated (I_{\mathrm{weight}}\) |
| capability mount | change available tools / (P^{\mathrm{env}}) action set |
| graph mutation (scientist) | *fast* (I_{\mathrm{loop}}\): change the composition of (K\) |

---

## §7 First lemmas

### Lemma 7.0 (observation is a statistic)

\(\mathrm{Obs}\) is a (usually deterministic) function of traces. It does not add a fourth noise channel. Randomness in (P^{\mathrm{ctrl}}\) is either Dirac (reconcile) or designed (scientist sampling, the sampling channel of a *different* generation).

### Lemma 7.1 (greedy collapse)

Assume (\tau=0\), the argmax of (f_\theta(H)\) is unique almost surely, (P^{\mathrm{num}}=\delta_{f_\theta(H)}\), and (P^{\mathrm{env}}\), (P^{\mathrm{mem}}\), (P^{\mathrm{ctrl}}\) are Dirac. Then (K_C(\cdot\mid x)=\delta_{\Phi(x)}\) for a deterministic map (\Phi:\mathcal{X}\to\mathcal{X}\). The process is an automaton. All residual randomness is environmental or a numerical tie.

**Proof.** Unique argmax and (\tau=0\) give a Dirac decoder. Dirac env / mem / append / ctrl compose to a function. (\square\)

### Lemma 7.2 (gap-sensitivity)

Lemma 3.5. Empirically, off-tie flips are a test of the model of (\varepsilon\): if they occur, (\|\varepsilon\|_\infty\) was underestimated or the perturbation is not additive in logit space.

### Lemma 7.3 (cascade / coupling; statement)

For any Markov kernel, (\|\mu K-\nu K\|_{\mathrm{TV}}\le\|\mu-\nu\|_{\mathrm{TV}}\). A bound of the form

\[
\mathrm{TV}(\mathrm{law}\,X_n,\mathrm{law}\,X_n')\le 1-(1-L)^n\,\mathrm{TV}(X_0,X_0')
\]

with (L>1\) is therefore impossible in TV. Expansion requires a metric that is *not* a probability metric of the laws but a path metric of a coupling: Hamming on prefixes, or a transport metric on (\Pi(X)\). **Conjecture.** For AR generation plus memory write, there exist couplings with (\rho_{n+1}\ge \lambda\rho_n\) on a transient set, (\lambda>1\), until a commit or a validator contracts.

### Lemma 7.4 (validator tradeoff; sketch)

Let (V\) be a valid set and (P^{\mathrm{dec},V}(\cdot)=P^{\mathrm{dec}}(\cdot\mid V)\) (or rejection with a bounded number of trials). If (F\subset V^c\), then (p_{\mathrm{hit}}\) is non-decreasing. Expected time (\mathbb{E}[\tau_S]\) may increase: rejected paths that would have failed *fast* are replaced by longer valid detours.

### Lemma 7.5 (best-of-\(k\); sketch)

Let (A_1,\ldots,A_k\) be i.i.d. (\sim P^{\mathrm{dec}}\) and (A^\star=\arg\max_i s(A_i)\). Under Gumbel / exponential tails on (s\), (\max_i s(A_i)\) concentrates at rate (\sim\log k\). This is *not* the same as lowering (\tau\): lowering (\tau\) concentrates on the mode of (P^{\mathrm{dec}}\); best-of-\(k\) concentrates on the mode of the *scorer* (s\). If (s\) is the model's logit, best-of-\(k\) reinforces a wrong mode.

### Lemma 7.6 (commit as information-value of optionality; conjecture)

A commit gate collapses an ensemble of (k\) particles to one trajectory. It raises (p_{\mathrm{hit}}\) iff the expected hit probability of the committed particle exceeds that of continuing the ensemble, net of compute.

### Lemma 7.7 (serving / trainer separation)

While a trainer job is in flight, the fast process remains Markov with kernel (K_C\) for the *pre-job* control (C\). Artifact arrival is an optional exogenous time (T_{\mathrm{adapt}}\). On (\{T_{\mathrm{adapt}}=n\}\cap\{g=\mathrm{mount}\}\) the kernel switches to (K_{C'}\); otherwise it does not. This is a piecewise-homogeneous hybrid Markov process. It is not a diffusion in (\theta\).

**Proof sketch.** (I_{\mathrm{weight}}) does not mutate (C\) at spawn time (Definition 6.2). The only (C\)-changing map is the gated mount / rollback, which is a function of ((A_\sigma,\hat p_{\mathrm{hit}})\). (\square\)

### Lemma 7.8 (eval gate is empirical first-passage)

`gateAdapter` / `gateCapability` compute (\hat p_{\mathrm{hit}}\) on a fixture and mount iff (\hat p_{\mathrm{hit}}\ge\text{threshold}\). This is Definition 5.3, not a new objective.

---

## §8 Open problems (for builders)

1. When should (\mathrm{Obs}\) choose (I_{\mathrm{loop}}\) versus (I_{\mathrm{weight}}\) versus wait? A decision rule in terms of cascade exponent and (\hat p_{\mathrm{hit}}\), not a vibe.
2. Measure the three channels on a real stack (vLLM / llama.cpp / OpenRouter) with replay.
3. Estimate cascade exponents on vdom word-reverse vs a tool-using task.
4. When does best-of-\(k\) *with an external grader* beat (\tau\downarrow\) for (p_{\mathrm{hit}}\) at fixed compute?
5. A calculus for composing vdom ops as kernel interventions (algebra of (C\)).
6. Quasi-stationary loop detector from traces (input to (\mathrm{Obs}\)).
7. Safety: scientist-emitted (C\) and spawned trainers are untrusted interventions; same sandbox as capabilities. Slow-clock mounts must stay gated.

---

## §9 What to do tomorrow in vdom-harness

Interface, not implementation in this repo.

- Make (\mathrm{Obs}\) a first-class memory write: first-passage stats and channel tags on `traces`.
- Treat (C\) as first-class: temperature, validator, commit, seed as node props (like `model` after PR #2).
- `improveLoop` already *is* (P^{\mathrm{ctrl}}(\cdot\mid\mathrm{Obs})\): topology / capability / adapter, gated by eval. Name it that way.
- Trainer port stays out-of-process. Serving must not block. Unmount remains rollback.
- Expose (\tau_S,\tau_F\) in `runBenchmark` (already has `score`).

The typed kernel in `src/` is the contract these props should satisfy.
