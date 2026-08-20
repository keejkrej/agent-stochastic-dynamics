# Runtime self-improvement: typed-noise hybrid dynamics

**Status.** Theoretical framework for ICLR 2027. Objects below are definitions, lemmas, conjectures, or engineering interfaces; the type is named at each claim. The contribution is the **framework + theory**. Experiments are existence and arm-choice diagnostics, not a \(\tau^2\) leaderboard.

**Accompanying implementation.** [vdom-harness](https://github.com/keejkrej/vdom-harness) is the runtime submitted with this paper (not a side project, not related-work-only): a self-observing agent that types its own failure and intervenes on \(C\) or on \(f_\theta\). TypeScript virtual DOM: topology is a value; a reconciler mounts / updates / unmounts. This document does not clone that repo. It writes the process of which vdom is the control. Papers, blogs, GitHub, X, and other agents are inputs to that runtime, not the product.

**Thesis (author lock).** A serving agent is a **controlled hybrid Markov process** \(X=(H,M,E,C,S)\) with kernel \(K_{C,S}\). \(C\) is the *fast* graph (AgentGraph, decoding knobs). \(S\) is the *slow* decoder pointer (\(f_\theta\) / SKU). They are different coordinates on different clocks. Self-observation types the failure and chooses which coordinate to edit. Two licensed edits: \(I_{\mathrm{loop}}\) mutates \(C\) (same \(S\)); the slow arm gated-rebinds \(S\) (same \(C\)). Wait is the identity. **License for the slow arm is an incomplete episode (hang / no-write / crash), not “a more expensive checkpoint.”** Price is not a coordinate. Completed miss + attractor \(\to I_{\mathrm{loop}}\). Hits wait. Accumulating \(H\) is neither arm.

Catalog rebind \(I_{\mathrm{sku}}\) (`0731` \(\to\) `0813`) is the *implemented* slow actuator on this stack, because we cannot train. **A cell, not the title claim.** `0813` is one available value of \(S\), not the license. SKU swap alone is not novel (FrugalGPT, RouteLLM, OpenRouter fallbacks). The gate is eval / first-passage (Definition 5.3), not “0813 exists” (that would be always-mount). Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Do not lead with \(0.7\to 0.9\). Do not title this paper as model routing.

Two clocks (Lemma 7.7): `servingPaused=false`; jump of \(S\) only on gated mount; later serving must use the new \(S\) or there was no jump.

**What this paper is not.** SOTA on \(\tau^2\). A Pro-vs-Flash leaderboard. Async weight updates / LoRA / spawn-trainer. Mock \(0\to 0.5\to 1.0\) as a result. \(0.7\to 0.9\) in the abstract lead. A routing paper. One idea with two names (`improveLoop` writing a bag that contains both graph and SKU).

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
- *Model routing / cascade.* FrugalGPT, RouteLLM, and OpenRouter fallbacks swap or cascade SKUs. That is a cell we can run (\(I_{\mathrm{sku}}\)). It is not this paper's contribution. The contribution is that \(\mathrm{Obs}\) types the failure and chooses the factor \((C\) vs \(f_\theta)\).
- *Classical.* Langevin, Fokker–Planck, Freidlin–Wentzell LDP, MDP/POMDP, Doob \(h\)-transform, Gumbel-max: used below as named tools, not as “the model of an agent.”

---

## §1 State space

**Definition 1.1 (hybrid state; two control coordinates).** At step \(n\),

\[
X_n = (H_n, M_n, E_n, C_n, S_n) \in \mathcal{X} = \mathcal{V}^* \times \mathcal{M} \times \mathcal{E} \times \mathcal{C} \times \mathcal{S}.
\]

If the model pointer sits *inside* fast \(C\) and both arms are `improveLoop` writing \(C\), that is one idea with two names. It is not. \(C\) and \(S\) are different coordinates on different clocks.

| Symbol | Space | Clock | Meaning |
| --- | --- | --- | --- |
| \(H_n\) | \(\mathcal{V}^*\) | fast | Context / token-or-event history. |
| \(M_n\) | \(\mathcal{M}\) | fast | Structured memory: vdom `memoryStore`, traces, persistence. |
| \(E_n\) | \(\mathcal{E}\) | fast | Environment / tool world. |
| \(C_n\) | \(\mathcal{C}\) | **fast** | *Graph control*: AgentGraph plus decoding knobs (temperature, constraints, validators, commit gates, mounted capabilities). **Does not contain the decoder pointer.** \(I_{\mathrm{loop}}\) writes this coordinate only. |
| \(S_n\) | \(\mathcal{S}\) | **slow** | *Decoder pointer*: the bound \(f_\theta\) / SKU (`PhysicalNode.provider` / `n.model`). Frozen on the fast clock. The slow arm gated-rebinds this coordinate only. Price is not a coordinate of \(\mathcal{S}\). `0813` is one available value, not the license. |

**Definition 1.2 (coarse field).** An optional projection \(z_n = \Pi(X_n)\in\mathbb{R}^d\) (embedding summary, score vector) is a *statistic*, never the true state. Fokker–Planck statements, if any, are about the law of \(z_n\), and only after a mixing hypothesis that must be stated.

**Definition 1.3 (core model).** For fixed \(\theta\),

\[
f_\theta : \mathcal{V}^* \to \mathbb{R}^{|\mathcal{V}|}, \qquad \ell = f_\theta(H)
\]

is a deterministic logit map for the bound pointer \(S\). Numerical noise may perturb \(\ell\); decoding samples a token (or an action string) from the perturbed logits. \(S\) is constant *inside* a generation and across fast serving steps. A gated rebind is a jump \(S\mapsto S'\) on the slow clock. It does not write \(C\).

---

## §2 Transition kernel, factored

One agent step is a *composition*, not a diffusion.

**Definition 2.1 (factored step).** Given \(X_n=(H_n,M_n,E_n,C_n,S_n)\),

1. **Generation.** \(a_{n+1}\sim P^{\mathrm{gen}}_{C_n,S_n}(\cdot\mid H_n,M_n)\) (text and/or tool calls). Uses \(f_{S_n}\) under graph \(C_n\).
2. **Environment.** \((E_{n+1},o_{n+1})\sim P^{\mathrm{env}}(\cdot\mid E_n,a_{n+1})\).
3. **Memory.** \(M_{n+1}\sim P^{\mathrm{mem}}_{C_n}(\cdot\mid M_n,H_n,a_{n+1},o_{n+1})\).
4. **Context.** \(H_{n+1}=\mathrm{append}(H_n,a_{n+1},o_{n+1})\) (Dirac given those arguments).
5. **Fast control.** \(C_{n+1}\sim P^{\mathrm{fast}}(\cdot\mid C_n,\mathrm{Obs}(\mathrm{traces}_n))\). Graph mutation / wait. **Does not write \(S\).**
6. **Slow pointer.** \(S_{n+1}=S_n\) unless a gated mount fires on the slow clock. **Does not write \(C\).**

**Definition 2.2 (controlled hybrid Markov process).** The composition is a kernel

\[
X_{n+1} \sim K_{C_n,S_n}(\cdot\mid X_n)
\]

on \(\mathcal{X}\). On the fast clock \(S\) is a parameter, not a field of \(C\). The process is Markov on \(\mathcal{X}\) with kernel \(K_{C,S}\).

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
P^{\mathrm{gen}}(a\mid H,M,C,S) = \int P^{\mathrm{dec}}_C(a\mid \tilde{\ell})\, P^{\mathrm{num}}(\mathrm{d}\tilde{\ell}\mid f_S(H),C).
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

- Typed-noise hybrid kernels \(K_{C,S} = P^{\mathrm{gen}}_{C,S}\otimes P^{\mathrm{env}}\otimes P^{\mathrm{mem}}_C\otimes P^{\mathrm{fast}}\). \(S\) is a parameter of the fast kernel, not a field of \(C\).
- Coupling Lyapunov / cascade exponents (Hamming on prefixes, not TV — TV Lipschitz of any kernel is \(\le 1\)).
- Control theory for decoding policies (\(\tau\), grammars, validators as Doob / rejection).
- Selection kernels: best-of-\(k\) is a nonlinear map on empirical measures (McKean–Vlasov-like).
- Commit as optional stopping: freeze a coordinate of \(X\), kill future branching.

---

## §5 Objects to study

**Definition 5.1 (trajectory).** \(\mathbf{X}=(X_n)_{n\le T}\) and the action-observation path \((a_n,o_n)\).

**Definition 5.2 (path measure).** \(\mathbb{P}_{C,S}\) is the law of \(\mathbf{X}\) on \(\mathcal{X}^{\mathbb{N}}\), parameterized by the pair \((C,S)\). Not by \(C\) alone (that would put \(S\subset C\)).

**Definition 5.3 (first passage).** Let \(S,F\subset\mathcal{X}\) be disjoint measurable success / failure sets. Hitting times

\[
\tau_S:=\inf\{n:X_n\in S\},\qquad \tau_F:=\inf\{n:X_n\in F\},
\]

hit probability \(p_{\mathrm{hit}}=\mathbb{P}_{C,S}(\tau_S<\tau_F)\), and expected cost \(\mathbb{E}_{C,S}[\tau_S\wedge\tau_F\wedge T]\). This is what builders already measure (`runBenchmark` score, timeout). Name it. The path measure is parameterized by the pair, not by \(C\) alone.

**Definition 5.4 (cascade / coupling).** Let \(X_0,X_0'\) differ by one memory bit or one token. Couple the kernels. TV of the *laws* cannot expand: \(\|\mu K-\nu K\|_{\mathrm{TV}}\le\|\mu-\nu\|_{\mathrm{TV}}\). Expansion is visible in a *weaker* metric — Hamming on prefixes, or a Wasserstein on \(\Pi(X)\). Write

\[
\rho_n := \mathbb{E}\big[d(X_n,X_n')\big],\qquad d_{\mathrm{Ham}}(H,H')=\sum_i \mathbf{1}_{H_i\neq H_i'}+\big||H|-|H'|\big|.
\]

The *cascade exponent* is the local growth rate of \(\rho_n\) before coupling. Autoregression plus memory write is typically expanding in \(d_{\mathrm{Ham}}\): one bit becomes many tokens.

**Definition 5.5 (attractors / metastable regimes).** Looping, progressing, and tool-thrashing as quasi-stationary laws of \((z_n,M_n)\). Memory write rules create almost-absorbing sets (a lesson that is never revised).

**Definition 5.6 (large deviations).** Sanov on \(N\) i.i.d. rollouts (empirical path measure). Rare-event LDP for env failures. *Not* a default Freidlin–Wentzell on embeddings.

---


## §6 Self-observation and dual intervention

This is the reason the framework exists. Typed noise and the factored kernel are the *language*. The *act* is that a vdom agent watches its own path measure and then edits either graph \(C\) or decoder pointer \(S\). Not a trainer. Not a price.

**Definition 6.1 (self-observation).** Let \(\mathrm{traces}_n = (a_i,o_i,\text{channel tags})_{i\le n}\) together with first-passage proxies \((\hat\tau_S,\hat\tau_F,\hat p_{\mathrm{hit}})\) and a typed completion

\[
\mathrm{completion}\in\{\mathrm{hit},\,\mathrm{completed\text{-}miss},\,\mathrm{incomplete}\},
\]

where \(\mathrm{incomplete}=\mathrm{hung}\cup\mathrm{transfer\text{-}without\text{-}writes}\cup\mathrm{crash}\). The observation operator

\[
\mathrm{Obs}: (\text{traces},\,\hat\tau_S,\hat\tau_F,\hat p_{\mathrm{hit}},\,\mathrm{completion}) \to \text{features in }\mathcal{M}
\]

writes a critique of the agent's *own* path measure into memory:

\[
M \leftarrow M \cup \{\texttt{obs}: \mathrm{Obs}(\mathrm{traces},\hat\tau_S,\hat\tau_F,\hat p_{\mathrm{hit}},\mathrm{completion})\}.
\]

This is a memory write, typically Dirac given traces. It is *not* a fourth noise channel. Incomplete episodes stay in the task set and are not silent zeros. Attractor flags (invented policy, extra write, tool thrash) and wait-hit are features of \(\mathrm{Obs}\), not extra noise. Examples: "\(p_{\mathrm{hit}}=0\) on the fixture", "tool-thrash on `search`", "\(\tau_S\) exceeded budget", "hung \(>8\) min", "transfer with zero required writes", "near-tie rate high (numerical channel)". In vdom this is `traces` plus `runBenchmark.score` plus episode completion. The typed arm is Lemma 7.9.

**Definition 6.2 (two licensed edits, different coordinates).**

\[
C_{n+1} \sim P^{\mathrm{fast}}(\cdot \mid C_n, \mathrm{Obs}(\mathrm{traces}_n)),\qquad
S_{n+1} =
\begin{cases}
S' & \text{on }\{T_{\mathrm{adapt}}=n\}\cap\{g=\mathrm{mount}\},\\
S_n & \text{otherwise.}
\end{cases}
\]

\(P^{\mathrm{fast}}\) writes \(C\) only. The slow map writes \(S\) only. They are not two names for `improveLoop` on one bag.

| Intervention | Coordinate | What it does |
| --- | --- | --- |
| `graph_mutation` (\(I_{\mathrm{loop}}\)) | \(C\) (fast) | Scientist emits \(G'\). `reconcile` is deterministic. Same \(S\). Serving does not pause. |
| `I_sku` (request) | none yet | Request one available value of \(S\) (on this stack, `0813`). Serving continues on current \(S\) (`servingPaused=false`). **License is incomplete episode, not price.** |
| `mount_sku` | \(S\) (slow) | Allowed only if the *eval / first-passage gate* passes (Definition 5.3 / Lemma 7.8). Rebind `PhysicalNode.provider` / `n.model`. Jump iff later serving uses \(S'\). “0813 exists” is not a gate (that is always-mount). |
| `rollback` | \(S\) | Restore the previous decoder pointer. \(C\) unchanged. |
| `capability_mount` | \(C\) | Change the tool signature of \(P^{\mathrm{env}}\) (gated, same sandbox). |
| `wait` | neither | Dirac identity. Wait-hit keeps \(C_0\) and \(S_0\) (vdom-harness PR #10). |

**Definition 6.3 (two clocks).**

- **Fast clock** \(n\in\mathbb{N}\): serving kernel \(K_{C,S}\) with \(S\) frozen. `servingPaused=false`. \(I_{\mathrm{loop}}\) lives here.
- **Slow clock** \(\sigma\in\mathbb{N}\): gated jump of \(S\) at optional time \(T_{\mathrm{adapt}}\). Serving does not block. Implemented actuator: catalog rebind. Not the title claim.

On \(\{T_{\mathrm{adapt}}=n\}\) the gate \(g(S',\mathrm{fixture})\in\{\mathrm{mount},\mathrm{reject}\}\) is empirical first-passage (Definition 5.3), **not** \(\mathbf{1}_{\{S'\text{ exists}\}}\). Reject is the identity on \(S\). Later serving must use \(S'\) or there was no jump.

**Definition 6.4 (dual intervention on \(C\) vs \(S\)).** After \(\mathrm{Obs}\), two licensed non-identity edits:

1. **\(I_{\mathrm{loop}}\) writes \(C\).** Same \(S\). Fast clock. License: completed miss + policy / topology attractor.
2. **Slow arm writes \(S\).** Same \(C\). Gated rebind of the decoder pointer. License: **incomplete episode (hang / no-write / crash).** Not “more expensive checkpoint.” Price is not a coordinate. Available cell on this stack: \(I_{\mathrm{sku}}\), one value `0813`. SKU swap alone is not the contribution (FrugalGPT, RouteLLM, OpenRouter fallbacks).

Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Failed eval \(\Rightarrow\) no switch.

**Thesis (restated).** \(X=(H,M,E,C,S)\), \(K_{C,S}\). Typed \(\mathrm{Obs}\). Two licensed edits on different clocks. Catalog rebind is the implemented slow actuator, not the title. Not \(\tau^2\) SOTA. Not a routing paper. Not \(0.7\to 0.9\) in the abstract lead.

### Actuators available to (P^{\mathrm{ctrl}}) after Obs

| Control | Intervention on (K\) |
| --- | --- |
| temperature schedule (\tau_n\) | entropy of (P^{\mathrm{dec}}\); interpolates Dirac (\leftrightarrow\) high entropy |
| constrained decoding / grammars | support restriction / conditioning on a regular language |
| validators | rejection kernel, or Doob (h\)-transform toward a valid set |
| memory write rules | (often Dirac) (P^{\mathrm{mem}}\); (\mathrm{Obs}\) is one such write |
| parallel sample + select | nonlinear kernel (\mathrm{select}(A_1,\ldots,A_k)\) |
| commit gates | optional stopping; freeze a coordinate of (X\) |
| gated \(f_\theta\) jump (\(I_{\mathrm{sku}}\) on this stack) | *available* slow actuator: catalog rebind of `PhysicalNode.provider` / `n.model`. A cell, not the claim. |
| capability mount | change available tools / (P^{\mathrm{env}}) action set |
| graph mutation (scientist) | *fast* (I_{\mathrm{loop}}\): change the composition of (K\) |

---

## §7 First lemmas

### Lemma 7.0 (observation is a statistic)

\(\mathrm{Obs}\) is a (usually deterministic) function of traces. It does not add a fourth noise channel. Randomness in (P^{\mathrm{ctrl}}\) is either Dirac (reconcile) or designed (scientist sampling, the sampling channel of a *different* generation).

### Lemma 7.1 (greedy collapse)

Assume \(\tau=0\), the argmax of \(f_S(H)\) is unique almost surely, \(P^{\mathrm{num}}=\delta_{f_S(H)}\), and \(P^{\mathrm{env}}\), \(P^{\mathrm{mem}}\), \(P^{\mathrm{fast}}\) are Dirac. Then \(K_{C,S}(\cdot\mid x)=\delta_{\Phi(x)}\) for a deterministic map \(\Phi:\mathcal{X}\to\mathcal{X}\). The process is an automaton. All residual randomness is environmental or a numerical tie. \(S\) is frozen.

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

### Lemma 7.7 (two clocks; request \(\neq\) rebind)

While a slow request is in flight, the fast process remains Markov with kernel \(K_{C,S}\) for the *pre-request* pair \((C,S)\). \(S\) is frozen. `servingPaused=false`. Arrival is an optional exogenous time \(T_{\mathrm{adapt}}\). On \(\{T_{\mathrm{adapt}}=n\}\cap\{g=\mathrm{mount}\}\) the kernel switches to \(K_{C,S'}\) by rebinding `PhysicalNode.provider` / `n.model`; otherwise it does not. This is a piecewise-homogeneous hybrid Markov process. It is not a diffusion in \(\theta\). It is not SGD. It is not a trainer job. On this stack the available actuator is \(I_{\mathrm{sku}}\) (0731 \(\to\) 0813), a cell.

**Proof sketch.** The slow request writes neither \(C\) nor \(S\) at request time (Definition 6.2). The only \(S\)-changing map is the gated mount / rollback, a function of first-passage (Definition 5.3), not of “the other SKU exists.” \(S\) jumped iff later serving uses the new pointer. If later serving still uses 0731, there was no jump. \(\square\)

### Lemma 7.8 (eval gate is empirical first-passage)

`gateAdapter` / `gateCapability` compute (\hat p_{\mathrm{hit}}\) on a fixture and mount iff (\hat p_{\mathrm{hit}}\ge\text{threshold}\). This is Definition 5.3, not a new objective.

### Proposition 7.8a (two licensed arms; kernel factorization)

Generation uses \(f_S\) *under* graph \(C\). From Definition 3.4 / 2.1,

\[
P^{\mathrm{gen}}_{C,S}(a\mid H,M)=\int P^{\mathrm{dec}}_C(a\mid\tilde\ell)\,P^{\mathrm{num}}(\mathrm{d}\tilde\ell\mid f_S(H),C).
\]

The path measure \(\mathbb{P}_{C,S}\) is a function of the pair \((C,S)\), not of \(C\) alone, not of a price, and not of chat history \(H\) alone (\(H_{n+1}=\mathrm{append}(H_n,a_{n+1},o_{n+1})\) is Dirac given the step; accumulating \(H\) is not an arm). If \(S\subset C\) and both arms write \(C\), this is one idea with two names.

**Claim.** The support of \(P^{\mathrm{fast}}\) after \(\mathrm{Obs}\) needs (at least) two licensed non-identity arms on *different coordinates*.

1. **Completed miss, attractor of \(C\).** The episode finished. There is a completed action-observation path. A metastable policy or tool attractor (invented policy, extra write, tool thrash) at fixed \(S\) is a failure of the composition \(K_{C,S}\) in the \(C\) factor. Same \(S\); mutate \(C\). That is \(I_{\mathrm{loop}}\). Serving does not pause.
2. **Incomplete episode.** Hang, no-write, or crash yields no completed path to edit. **That is the license**, not “a more expensive checkpoint.” \(I_{\mathrm{loop}}\) on empty (or non-completing) traces is *unidentified*: there is no observed path measure of a finished miss on which a graph mutation is a well-posed intervention. Serving continues on the current \(S\) (`servingPaused=false`); mount only if the *eval / first-passage* gate passes and later serving uses \(S'\) (Lemma 7.7). “0813 exists” is always-mount, not a gate. Reject is the identity on \(S\). On this stack the available actuator is \(I_{\mathrm{sku}}\) (0731 \(\to\) 0813) because we cannot train. That is a cell. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Price is not a coordinate.
3. **Neither arm is extra \(H\).** Appending context is coordinate (iv) of Definition 2.1. CL-Bench exploitable-poker ICL (Asawa et al., arXiv:2606.05661) measures gain \(g=r^{\mathrm{sf}}-r^{\mathrm{sl}}\) (stateful history vs the same system stateless). On poker the published curves overlap and accumulated state can hurt. That is a diagnostic that extra \(H\) is not \(I_{\mathrm{loop}}\), not a number we measured and not a SOTA claim.

**Proof sketch.** Factorization (Definition 3.4) holds \(S\) fixed inside a generation and across the fast clock. A completed path with an attractor of \(C\) is an identified intervention on \(P^{\mathrm{fast}}\) at that \(S\). An incomplete episode is not an identified intervention on \(C\): the scientist would be fitting a graph to a missing path. The two-clock construction (Definition 6.3, Lemma 7.7) is the residual: a gated rebind of \(S\), or reject. Which actuator implements that rebind is a cell. \(\square\)

### Lemma 7.9 (typed \(\mathrm{Obs}\) decision rule)

A map, not a vibe. Cascade exponent \(\lambda\) of \(\rho_n\) (Definition 5.4) is *not* yet an input; §8.1 is the remaining refinement.

**Inputs.**

| Symbol | Type | Meaning |
| --- | --- | --- |
| \(\mathrm{completion}\) | \(\{\mathrm{hit},\,\mathrm{completed\text{-}miss},\,\mathrm{incomplete}\}\) | Finished hit; finished miss; or hung / transfer-without-writes / crash. Hung is never a hit. |
| \(\mathrm{attractors}\) | \(\{0,1\}^3\) | Flags: invented policy, extra write, tool thrash (metastable loop of Definition 5.5). |
| \(\mathrm{wait\text{-}hit}\) | \(\{0,1\}\) | \(\mathrm{completion}=\mathrm{hit}\) and \(\mathrm{Obs}\) selected \(\mathrm{wait}\) (per-task). |
| \(\hat p_{\mathrm{hit}}\) | \([0,1]\) | Empirical first-passage (Definition 5.3). |

**Output.** \(\delta\in\{\mathrm{wait},\,I_{\mathrm{loop}},\,I_{\mathrm{sku}}\}\). Two licensed edits. Catalog rebind is the implemented slow actuator, not the title claim.

**Rule \(\delta\)** (first match):

1. If \(\mathrm{wait\text{-}hit}=1\), or \(\mathrm{completion}=\mathrm{hit}\) and \(\hat p_{\mathrm{hit}}=1\): \(\delta=\mathrm{wait}\). Identity on \(C\) and on \(S\). An unscoped \(I_{\mathrm{loop}}\) onto a wait-hit is an illegal apply.
2. If \(\mathrm{completion}=\mathrm{incomplete}\) (hang / crash / no-write): \(\delta=I_{\mathrm{sku}}\). **License is incompleteness**, not price and not “0813 exists.” Serving stays on the current \(S\) (`servingPaused=false`; Lemma 7.7). \(I_{\mathrm{loop}}\) on empty traces is unidentified (Proposition 7.8a). Gate is eval / first-passage and may reject. Available cell: catalog rebind, 0731 \(\to\) 0813, because we cannot train.
3. If \(\mathrm{completion}=\mathrm{completed\text{-}miss}\) and at least one attractor flag is 1: \(\delta=I_{\mathrm{loop}}\). Same \(S\); mutate \(C\); serving does not pause.
4. If \(\mathrm{completion}=\mathrm{completed\text{-}miss}\) and every attractor flag is 0: \(\delta=I_{\mathrm{sku}}\). The miss is not an identified failure of \(C\). Still a rebind of \(S\), not a price comparison.

Wait is the identity. Accumulating \(H\) is not in the output type.

**What would falsify the split.**

- A *completed miss* that only moves after \(S\) changes (no \(C\) mutation suffices). Then the miss was not a \(C\)-attractor; clause 3 licensed the wrong arm.
- An *incomplete* episode that completes after a \(C\) mutation with no \(S\) change. Then \(I_{\mathrm{loop}}\) was identified on that incomplete trace; clause 2 licensed the wrong arm.
- Putting the model pointer back inside \(C\) so both arms write the same coordinate.
- If hung-44 is still \(I_{\mathrm{loop}}\) unless `loopExhausted`, the split is dead (clause 2 was not implemented).
- If a mount never rebinds serving to 0813, there was no jump (Lemma 7.7: later serving must use the new SKU).
- Treating \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\) as a result of this paper (buying a stronger API; a diagnostic at most).

The runtime already has `obs.arm`. Hung still defaults to \(I_{\mathrm{loop}}\) in vdom-harness `runner.py` (`elif hung: arm = "I_loop"`) and `recommendIntervention` waits for `loopExhausted`. That is a type error against clause 2, not a measurement. If hung-44 stays \(I_{\mathrm{loop}}\) unless `loopExhausted`, the split is dead.

**Diagnostics (evidence for \(\delta\), not SOTA).** See `paper/NOTES_ARM_CHOICE.md`. Self \(I_{\mathrm{loop}}\) on airline \(39/44\) went \(0.5\to 0.0\): \(C\) moved the path measure (loop is real) and a global cancel-policy overwrote a wait-hit (illegal apply; licenses the wait-hit gate). Post-gate, task 44 hung: clause 2 licenses \(I_{\mathrm{sku}}\) (0731 \(\to\) 0813). Extra \(H\) is not \(I_{\mathrm{loop}}\) (Proposition 7.8a.3). Mock \(0\to 0.5\to 1.0\) is a protocol unit test, not a result. Do not report \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\) as a result.

---

## §8 Open problems (for builders)

### §8.1 Arm choice: decision rule stated; cascade-exponent refinement remains

Lemma 7.9 is the typed rule in \((\mathrm{completion},\,\mathrm{attractors},\,\mathrm{wait\text{-}hit},\,\hat p_{\mathrm{hit}})\). It is not a vibe and it does not delete this problem. Remaining work is to put the cascade exponent \(\lambda\) of \(\rho_n\) (Definition 5.4, Lemma 7.3) *into* \(\delta\): when should local Hamming growth tip a completed miss from \(I_{\mathrm{loop}}\) to the slow \(f_\theta\) actuator? \(f_\theta\) jumped only if serving rebinds. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). SKU swap is not the open problem.

2. Measure the three channels on a real stack (vLLM / llama.cpp / OpenRouter) with replay.
3. Estimate cascade exponents on vdom word-reverse vs a tool-using task.
4. When does best-of-\(k\) *with an external grader* beat (\tau\downarrow\) for (p_{\mathrm{hit}}\) at fixed compute?
5. A calculus for composing vdom ops as kernel interventions (algebra of (C\)).
6. Quasi-stationary loop detector from traces (attractor flags into Lemma 7.9).
7. Safety: scientist-emitted \(C\) and requested \(f_{\theta'}\) are untrusted interventions; same sandbox as capabilities. Slow-clock mounts must stay gated.

---

## §9 What to do tomorrow in vdom-harness

Interface, not implementation in this repo.

- Make (\mathrm{Obs}\) a first-class memory write: first-passage stats and channel tags on `traces`.
- Split the runtime state: graph \(C\) (temperature, validator, commit, seed) is not the decoder pointer \(S\) (`PhysicalNode.provider` / `n.model`).
- `improveLoop` writes \(C\) only. The slow arm gated-rebinds \(S\). They are not two names for one bag.
- Implement Lemma 7.9: hung / crash / no-write \(\to I_{\mathrm{sku}}\), not a default \(I_{\mathrm{loop}}\) and not “\(I_{\mathrm{loop}}\) until `loopExhausted`”. License is incompleteness. Wait-hit stays the identity on \(C\) and \(S\).
- Available cell \(I_{\mathrm{sku}}\): `0731` \(\to\) `0813`. A cell, not the title. `servingPaused=false`. Gate is eval / first-passage, not “0813 exists.” Later serving must use 0813 or there was no jump. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Do not title the runtime as a router.
- Do not spawn a trainer. That sentence is not the claim. Catalog rebind is the implemented slow actuator.
- Expose (\tau_S,\tau_F\) in `runBenchmark` (already has `score`).

The typed kernel in `src/` is the contract these props should satisfy.

---

## §10 Diagnostics (existence and arm choice; not a leaderboard)

The ICLR contribution is the framework + theory: two licensed edits, typed \(\mathrm{Obs}\). \(I_{\mathrm{loop}}\) mutates graph \(C\). \(I_{\mathrm{sku}}\) gated-rebinds decoder pointer \(S\). Catalog rebind is the implemented slow actuator, not the title claim. \(\tau^2\) and the 0731 rollouts are **diagnostics that the loop ran and that \(\mathrm{Obs}\) chose a coordinate**. Do not claim SOTA on \(\tau^2\). Do not invent scores. Do not spawn a trainer as the claim. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Do not lead with \(0.7\to 0.9\). Do not treat mock \(0\to 0.5\to 1.0\) as a result. Do not title the paper as model routing. Do not put the model pointer back inside \(C\).

**Held-out is the eval.** Airline tasks \(18,20,23,25,30,35,38,42,45,48\) (OpenRouter `deepseek/deepseek-v4-flash-0731`, user+judge same model, 1 trial, max 2 rounds, one policy-checklist \(I_{\mathrm{loop}}\) only). Official DB hash. Audit: no gold reservation ID and no gold action leaked into the live prompt. The checklist was not written for these IDs; method overfit on \(39/41/44\) is why held-out exists. `pHitSequence` \(0.7\to 0.9\). One-shot misses \(23,35,48\) (hits the other 7). Policy-checklist lifts those three and **regresses 18** (\(1\to 0\)). Completion: r0 finished 8 / transfer 2; r1 finished 9 / transfer 1; hung 0, error 0. JSON: `experiments/improve-live-0731-heldout.json` (source: vdom-harness `eval/tau2/improve-live-0731-heldout.json`). Better than this one-shot control on a \(10\times 1\) slice. Not a reliability claim. The loop is real; the content of \(C\) is a static prior, not self-reflection. Discovery slice = test-hacking risk. Held-out = weak generalization, including a regression on a task \(\mathrm{Obs}\) marked `wait`. Not SOTA, not a \(\tau^2\) win. See `paper/ANALYSIS.md` §0c.

**Replication (overfit slice, secondary).** \(39/41/44\times 3\) trials: \(\mathrm{pass}^1\) \(0.333\to 0.556\); \(\mathrm{pass}^2\) \(0.333\to 0.444\); \(\mathrm{pass}^3\) \(0.333\to 0.333\) (flat). Task 39: \(0/3\to 2/3\); 44: \(0/3\to 0/3\); 41: \(3/3\to 3/3\). JSON: `experiments/improve-live-0731-replication.json`. The earlier \(0.333\to 0.667\) was \(n=1\) on this same slice — do not lead with \(0.667\). Older licensing traces on that slice: generic \(I_{\mathrm{loop}}\) \(0.333\to 0\to 0.333\); first policy draft \(0.333\to 0\). Remaining incomplete episodes license \(I_{\mathrm{sku}}\) (0731 \(\to\) 0813). Not a Pro-vs-Flash leaderboard.

**Self-obs \(I_{\mathrm{loop}}\) on \(39+44\) (diagnostic; do not lead).** Live 0731, 2026-08-19, tasks \(39+44\), 1 trial, max-rounds 1, `selfObsPath=self`. Round 0: \(p_{\mathrm{hit}}=0.5\) (39 miss, Obs \(I_{\mathrm{loop}}\); 44 hit, Obs `wait`). Model returned valid \(I_{\mathrm{loop}}\) JSON and mounted a global `cancel_policy` (wrong attractor: it thought 44 / sophia needed a cancel). Round 1: \(p_{\mathrm{hit}}=0.0\) (39 still miss, same `MSJ4OA`; 44 regressed \(1\to 0\), `KC18K6` `action_match` false). Mid-turn `get_agent_graph` / `set_agent_graph`: zero calls. `servingPaused` false. Not a slow \(f_\theta\) jump (episodes completed with writes). Same shape as held-out task 18: Obs said `wait` on a hit; a global \(I_{\mathrm{loop}}\) still changed \(C\) for the whole slice. That unscoped apply is illegal — evidence the loop ran and Obs chose \(I_{\mathrm{loop}}\), not a SOTA miss. JSON: `experiments/improve-live-0731-self-3944.json` (source: vdom-harness `eval/tau2/improve-live-0731-self-3944.json`).

**Runtime fix (already merged).** [vdom-harness PR #10](https://github.com/keejkrej/vdom-harness/pull/10) (2026-08-19): “Gate \(I_{\mathrm{loop}}\): wait-hit tasks keep \(C_0\)”. Mixed batch: wait+hit served on \(C_0\), miss / \(I_{\mathrm{loop}}\) served on \(C_1\). Logged as `applyScope {waitKept, looped}`. Host fallback `applyILoop` uses the same gate. Mock \(0\to 0.5\to 1.0\) still holds. That gate is clause 1 of Lemma 7.9.

**Post-gate hang licenses the slow \(f_\theta\) actuator (evidence for the rule; do not lead).** Live 0731, 2026-08-20, after the wait-hit gate, same \(39+44\), 1 trial, max-rounds 1. Round 0: 39 completed-miss (Obs \(I_{\mathrm{loop}}\)); 44 hung (`taskPHit` null, skipped `44:t0:timeout`, reward null, nmsg 0 — not a measured 0). Runtime still emitted \(I_{\mathrm{loop}}\)+hung unless `loopExhausted` (type error vs Lemma 7.9 clause 2; that falsifies the split if left in place). `applyScope waitKept=[] looped=[39,44]`: no wait-hit, so the gate behaved. Round 1: 44 completed (hang \(\to\) finished miss) under a cancel attractor. The hang is an incomplete episode: \(I_{\mathrm{loop}}\) on empty traces is unidentified; the available cell is \(I_{\mathrm{sku}}\) (`0731` \(\to\) `0813`) because we cannot train. That is not the paper's contribution. `servingPaused=false`. If later serving does not use 0813, there was no jump. Do not invent post-mount numbers. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). JSON: `experiments/improve-live-0731-self-3944-postgate.json`. See `paper/NOTES_ARM_CHOICE.md`.

Mock closed loop \(0\to 0.5\to 1.0\) on official `update_task_1` / `impossible_task_1` is a **protocol unit test**, not an ICLR result.

Static retail \(5\times 4\) \(\mathrm{pass}^k=1\) (`experiments/tau2-retail-0731.json`) is \(\mathbb{P}_{C_0}\) at a \(\mathrm{wait}\) fixed point, not self-improvement.

The three fixtures in `src/tasks.ts` (word-reverse, calculator, retrieval-QA) diagnose \(K_{C,S}\): same \(S\), two temperatures, first-passage. They **license** \(I_{\mathrm{loop}}\) when the miss is a topology attractor (retrieval 12/12, sequential toys 0/12, \(\tau\)-invariant loops). They are **not** the agent benchmark. Counts: `paper/ANALYSIS.md`, `experiments/live-0731.json`.

The established *diagnostic* environment is [τ²-bench](https://github.com/sierra-research/tau2-bench) (Barres et al., 2025). \(\mathrm{pass}^k\) is first-passage under \(k\) i.i.d. repeats, not \(\mathrm{pass}@k\). Implementation: [vdom-harness](https://github.com/keejkrej/vdom-harness) `improveLoop` + `python -m tau2_vdom`. Do not invent a larger \(\tau^2\) table.

