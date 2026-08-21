# Runtime self-improvement: typed-noise hybrid dynamics

**Self-improvement**, in this paper, is \(\mathrm{Obs}\) plus a licensed edit of graph \(C\) or catalog pointer \(S\). Not weights. Not a trainer.

**Status.** Theoretical framework for ICLR 2027. Objects below are definitions, lemmas, conjectures, or engineering interfaces; the type is named at each claim. Dual *implemented* arms: \(I_{\mathrm{loop}}\) (graph \(C\)) | \(I_{\mathrm{sku}}\) (catalog pointer). Wait is the identity. \(f_\theta\) / trainer / \(I_{\mathrm{weight}}\) is unimplemented. Typed \(\mathrm{Obs}\) is a contribution only after the controller implements it — the controller log is [vdom-harness PR #11](https://github.com/keejkrej/vdom-harness/pull/11) (hung-first: 39 \(I_{\mathrm{loop}}\) / 44 \(I_{\mathrm{sku}}\) / `waitKept` empty). Experiments are existence and arm-choice diagnostics, not a \(\tau^2\) leaderboard.

**Accompanying implementation.** [vdom-harness](https://github.com/keejkrej/vdom-harness) is the runtime submitted with this paper (not a side project, not related-work-only). TypeScript virtual DOM: topology is a value; a reconciler mounts / updates / unmounts. This document does not clone that repo. Specified \(S\) is the catalog pointer of \(X=(H,M,E,C,S)\). [vdom-harness PR #13](https://github.com/keejkrej/vdom-harness/pull/13) (merged) stores a `CatalogPointer` `{ sku, servingPaused: false }` beside \(C\). That closes the `n.model` hole: \(I_{\mathrm{sku}}\) does not rewrite \(C\) topology; `n.model` stays 0731. Later serving is typed by \(S\) for mixed 39/44 (commit `7ae763a`): after fixture mount, `providerForNode(solve)` is 0731 on 39 and 0813 on 44. `rebindServing` is gone. `providerForNode` prefers the per-task `CatalogPointer`. `runGraph` passes that SKU as the `complete()` model. [vdom-harness PR #14](https://github.com/keejkrej/vdom-harness/pull/14) (merged) makes \(S\) a per-episode controller coordinate (`ControlledEpisode.serving`). A fresh 39-only batch after mixed mount stays 0731 and does not inherit leftover `servingSku=0813`. #13 closed `n.model`; #14 closed process `servingSku` as the lookup. [vdom-harness PR #15](https://github.com/keejkrej/vdom-harness/pull/15) (merged) is the \(I_{\mathrm{sku}}\) ACCEPT protocol cell: fixture after + one live 0813 serve recorded the serving id (`eval/tau2/improve-live-0731-isku-44-mount.json`; `servingPaused=false`, `gate.action=mount`, `jumped=true`, `servingModelAfter=deepseek/deepseek-v4-pro-0813`). Protocol cell, not a score. Not a Pro-vs-Flash lift. [vdom-harness PR #16](https://github.com/keejkrej/vdom-harness/pull/16) (merged, `1bbda40`) closes sidecar `servingByTask`-as-lookup: \(S\) lives on `HybridState` / \(X_n\). This is a controller \(X_n.S\) dump after a licensed write (`eval/tau2/hybrid-state-s-dump.json`): \(X_{44}.S.sku=\)`deepseek/deepseek-v4-pro-0813`, \(X_{39}.S.sku=\)`deepseek/deepseek-v4-flash-0731`, \(C_0\) flatten / `n.model` stay 0731 (`graphHash` before=after), fresh 39-only \(X_n.S=\)0731. Controller \(X\) from reconstructed hung obs. `H=[]` `M=[]`. Not a live serving-step HybridState. Not a score. Not a new 0813 serve. Sidecar `hybridByTask` is a process Map of those objects; writes stay on \(X.S\). `servingByTask` is a derived cache from \(X.S\), not the lookup. Dump is not assembled from that Map. `dumpIsNot=ping/get_state S0`. Fixture after stays labeled. Do not claim #16 closed live serving-step \(X_n\) or already had live \(H/M\). [vdom-harness PR #17](https://github.com/keejkrej/vdom-harness/pull/17) (merged, `cc9d812`) is the serving-step \(X_n\) dump after that licensed write (`eval/tau2/hybrid-state-serving-step-dump.json`): one live OpenRouter `runTau2Turn` on the same HybridState \(X_{44}\). Greeting-turn \(H/M\): incoming messages empty; assistant "Hello! How can I help you today?". Not a \(\tau^2\) user/gym step. `liveServingId=deepseek/deepseek-v4-pro-0813`. `mockProviderTurn=false`. `sameObjectAsTurnX=true`. Not stuffed \(H/M\). \(X_{44}.S=\)0813, `servingPaused=false`; \(X_{39}.S=\)0731; \(C\) `n.model` 0731; fresh39=0731. #17 is the greeting-turn \(H/M\) cell. [vdom-harness PR #18](https://github.com/keejkrej/vdom-harness/pull/18) (merged, `fe33ad2`) is dump-label honesty on that same JSON: `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. Do not claim #18 wrote `licenseE`/`servingE` onto the HybridState the turn used. [vdom-harness PR #19](https://github.com/keejkrej/vdom-harness/pull/19) (merged, `4aaf123`) writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). #19 is not a result. Not another \(X_n\) dump. After `runTau2Turn`, `finish()` writes runtime \(X.E\) via `writeHybridServingE` from the turn record (`hung=false`, `termination=null`, `kind=greeting-turn`, `incoming=[]`). Turn-derived facts: `servedModel=deepseek/deepseek-v4-pro-0813`, ts, content="Hello! How can I help you today?". Runtime `servingE` is the same object as runtime \(X.E\). Runtime fixture `licenseE` (beside \(X\), not a factor of paper \(X\)) is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE (`taskId=44`, `hung=true`, `termination=timeout`, `arm=I_sku`, `copiedIntoH=false`). Stored next to \(X\), not copied into H. `viewOfServingStep` does not replace \(X.E\) with a no-arg `servingEFromGreetingTurn()` constant overlay. After greeting, \(X.E.hung\) is false. `eSplit` still `licenseE ≠ servingE`. Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. `pHit0813=null`. No re-run. Fixture after labeled. Protocol cell, not a score. Not a new 0813 airline eval. Live airline `improveLoop` still omits after. See §9. Do not inject gold airline text. Do not turn on `after=` in `improveLoop`. \(I_{\mathrm{sku}}\) remains the stand-in cell. Trainer \(I_{\mathrm{weight}}\) remains unimplemented. Papers, blogs, GitHub, X, and other agents are inputs to that runtime, not the product.

**Thesis.** A serving agent is a **controlled hybrid Markov process** \(X=(H,M,E,C,S)\) with kernel \(K_{C,S}\). \(C\) is the *fast* graph (AgentGraph, decoding knobs). \(S\) is the *slow catalog pointer*. Do **not** write the slow factor as \(f_\theta\). We cannot train. Dual implemented arms: \(I_{\mathrm{loop}}\) mutates graph \(C\) (same SKU); \(I_{\mathrm{sku}}\) gated-rebinds the catalog pointer (same \(C\)). Wait is the identity. **License for \(I_{\mathrm{sku}}\) is an incomplete episode (hang / no-write / crash), not price.** Completed miss + attractor \(\to I_{\mathrm{loop}}\). Completed miss with no identified attractor of \(C\) \(\to I_{\mathrm{sku}}\) (Lemma 7.9 clause 4). Hits wait. Accumulating \(H\) is neither arm.

\(I_{\mathrm{sku}}\) (`0731` \(\to\) `0813`) is the *stand-in* slow cell on this stack, because \(f_\theta\) / trainer is unimplemented. **A cell, not the contribution.** `0813` is one available SKU, not the license. SKU swap alone is not novel (FrugalGPT, RouteLLM, OpenRouter fallbacks). The gate is eval / first-passage (Definition 5.3), not “0813 exists” (that would be always-mount). Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Do not lead with \(0.7\to 0.9\). Do not title this paper as model routing. Do not title this paper as async weight updates.

Two clocks (Lemma 7.7): `servingPaused=false`; jump of the catalog pointer only on gated mount; later serving must use the new SKU or there was no jump.

**What this paper is not.** SOTA on \(\tau^2\). A Pro-vs-Flash leaderboard. Async weight updates. LoRA / spawn-trainer / \(I_{\mathrm{weight}}\) as the claim. Mock \(0\to 0.5\to 1.0\) as a result. \(0.7\to 0.9\) in the abstract lead. A routing paper. One idea with two names (`improveLoop` writing a bag that contains both graph and SKU). A FRAMEWORK slogan that “typed Obs” is the contribution before the harness logs it.

---

## §0 Setup and gap

An LLM-based agent is not a token generator. It is a closed loop

\[
\text{model}\;\to\;\text{action / tool call}\;\to\;\text{observation}\;\to\;\text{memory / state}\;\to\;\text{model}.
\]

Inside one generation, weights \(\theta\) are fixed and the core map \(f_\theta\) from context to logits is deterministic. Between steps the graph \(C\), the catalog pointer \(S\), and the adapter may jump: that is what vdom's reconciler, a `CatalogPointer` write, capability gates, and adapter mounts do. Mount writes \(S\); it does not rebind `n.model` or spray a global `PhysicalNode.provider`.

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
- *Model routing / cascade.* FrugalGPT, RouteLLM, and OpenRouter fallbacks swap or cascade SKUs. That is a cell we can run (\(I_{\mathrm{sku}}\)). It is not this paper's contribution. Dual implemented arms are \(C\) vs SKU vs wait. Typed \(\mathrm{Obs}\) is a harness log after the controller implements it, not a slogan here.
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
| \(S_n\) | \(\mathcal{S}\) | **slow** | *Catalog pointer* (SKU). Frozen on the fast clock. \(I_{\mathrm{sku}}\) gated-rebinds this specified coordinate only. Not \(f_\theta\). Price is not a coordinate of \(\mathcal{S}\). Runtime ([vdom-harness PR #13](https://github.com/keejkrej/vdom-harness/pull/13) / [#14](https://github.com/keejkrej/vdom-harness/pull/14) / [#16](https://github.com/keejkrej/vdom-harness/pull/16) / [#17](https://github.com/keejkrej/vdom-harness/pull/17) / [#18](https://github.com/keejkrej/vdom-harness/pull/18) / [#19](https://github.com/keejkrej/vdom-harness/pull/19), merged): `CatalogPointer` beside \(C\); `n.model` stays 0731. Later serving is typed by \(S\) for mixed 39/44. Controller dump of \(X_n.S\) (vdom #16): reconstructed hung obs, `H=[]` `M=[]`. Serving-step dump (vdom #17): greeting-turn \(H/M\) on the same \(X\) after licensed write. Incoming messages empty; not a \(\tau^2\) user/gym step. Dump-label honesty (vdom #18): `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. vdom #19 writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. See §9. Sidecar `hybridByTask` is a process Map of those objects; writes stay on \(X.S\). `0813` is one available value, not the license. |

**Definition 1.2 (coarse field).** An optional projection \(z_n = \Pi(X_n)\in\mathbb{R}^d\) (embedding summary, score vector) is a *statistic*, never the true state. Fokker–Planck statements, if any, are about the law of \(z_n\), and only after a mixing hypothesis that must be stated.

**Definition 1.3 (core model).** For fixed \(\theta\),

\[
f_\theta : \mathcal{V}^* \to \mathbb{R}^{|\mathcal{V}|}, \qquad \ell = f_\theta(H)
\]

is the logit map of the *currently bound SKU*. We do not train it. Numerical noise may perturb \(\ell\); decoding samples a token (or an action string) from the perturbed logits. The catalog pointer \(S\) is constant *inside* a generation and across fast serving steps. A gated \(I_{\mathrm{sku}}\) mount is a jump \(S\mapsto S'\) on the slow clock. It does not write \(C\). \(f_\theta\) / trainer remains unimplemented.

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

This is the reason the framework exists. Typed noise and the factored kernel are the *language*. The *act* is \(C\) vs SKU vs wait. Not \(f_\theta\). Not a trainer. Not a price. Typed \(\mathrm{Obs}\) counts only after the harness logs it.

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
| `mount_sku` | \(S\) (slow) | Allowed only if the *eval / first-passage gate* passes (Definition 5.3 / Lemma 7.8). Specified write of catalog pointer \(S\). Runtime ([vdom-harness PR #13](https://github.com/keejkrej/vdom-harness/pull/13) / [#14](https://github.com/keejkrej/vdom-harness/pull/14) / [#16](https://github.com/keejkrej/vdom-harness/pull/16) / [#17](https://github.com/keejkrej/vdom-harness/pull/17) / [#18](https://github.com/keejkrej/vdom-harness/pull/18) / [#19](https://github.com/keejkrej/vdom-harness/pull/19), merged): `CatalogPointer` beside \(C\); `n.model` stays 0731. Later serving is typed by \(S\) for mixed 39/44 (`providerForNode` prefers the per-task pointer). Controller dump of \(X_n.S\) (vdom #16): reconstructed hung obs, `H=[]` `M=[]`. Serving-step dump (vdom #17): greeting-turn \(H/M\) on the same \(X\) after licensed write. Incoming messages empty; not a \(\tau^2\) user/gym step. Dump-label honesty (vdom #18): `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. vdom #19 writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. See §9. Sidecar `hybridByTask` is a process Map of those objects; writes stay on \(X.S\). “0813 exists” is not a gate (that is always-mount). |
| `rollback` | \(S\) | Restore the previous decoder pointer. \(C\) unchanged. |
| `capability_mount` | \(C\) | Change the tool signature of \(P^{\mathrm{env}}\) (gated, same sandbox). |
| `wait` | neither | Dirac identity. Wait-hit keeps \(C_0\) and \(S_0\) (vdom-harness PR #10). |

**Definition 6.3 (two clocks).**

- **Fast clock** \(n\in\mathbb{N}\): serving kernel \(K_{C,S}\) with \(S\) frozen. `servingPaused=false`. \(I_{\mathrm{loop}}\) lives here.
- **Slow clock** \(\sigma\in\mathbb{N}\): gated jump of \(S\) at optional time \(T_{\mathrm{adapt}}\). Serving does not block. Implemented actuator: catalog rebind. Not the title claim.

On \(\{T_{\mathrm{adapt}}=n\}\) the gate \(g(S',\mathrm{fixture})\in\{\mathrm{mount},\mathrm{reject}\}\) is empirical first-passage (Definition 5.3), **not** \(\mathbf{1}_{\{S'\text{ exists}\}}\). Reject is the identity on \(S\). Later serving must use \(S'\) or there was no jump.

**Definition 6.4 (dual implemented arms: \(C\) vs SKU vs wait).** After \(\mathrm{Obs}\), two licensed non-identity edits:

1. **\(I_{\mathrm{loop}}\) writes graph \(C\).** Same SKU. Fast clock. License: completed miss + policy / topology attractor.
2. **\(I_{\mathrm{sku}}\) writes catalog pointer \(S\).** Same \(C\). Specified gated rebind of \(S\). Runtime ([vdom-harness PR #13](https://github.com/keejkrej/vdom-harness/pull/13) / [#14](https://github.com/keejkrej/vdom-harness/pull/14) / [#16](https://github.com/keejkrej/vdom-harness/pull/16) / [#17](https://github.com/keejkrej/vdom-harness/pull/17) / [#18](https://github.com/keejkrej/vdom-harness/pull/18) / [#19](https://github.com/keejkrej/vdom-harness/pull/19), merged): `CatalogPointer` beside \(C\); \(I_{\mathrm{sku}}\) does not rewrite \(C\) topology; `n.model` stays 0731. Later serving is typed by \(S\) for mixed 39/44. Controller dump of \(X_n.S\) (vdom #16): reconstructed hung obs, `H=[]` `M=[]`. Serving-step dump (vdom #17): greeting-turn \(H/M\) on the same \(X\) after licensed write. Incoming messages empty; not a \(\tau^2\) user/gym step. Dump-label honesty (vdom #18): `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. vdom #19 writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. See §9. License: **incomplete episode (hang / no-write / crash).** Not price. Not \(f_\theta\). \(f_\theta\) / trainer / \(I_{\mathrm{weight}}\) is unimplemented. `0813` is one available SKU. SKU swap alone is not the contribution.

Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Failed eval \(\Rightarrow\) no switch.

**Thesis (restated).** Dual implemented arms: \(I_{\mathrm{loop}}\) (graph \(C\)) | \(I_{\mathrm{sku}}\) (catalog pointer) | wait. \(I_{\mathrm{sku}}\) is the stand-in slow cell, not the contribution. Typed \(\mathrm{Obs}\) is a harness log, not a slogan here. Not async weight updates. Not \(\tau^2\) SOTA. Not \(0.7\to 0.9\) in the abstract lead.

### Actuators available to (P^{\mathrm{ctrl}}) after Obs

| Control | Intervention on (K\) |
| --- | --- |
| temperature schedule (\tau_n\) | entropy of (P^{\mathrm{dec}}\); interpolates Dirac (\leftrightarrow\) high entropy |
| constrained decoding / grammars | support restriction / conditioning on a regular language |
| validators | rejection kernel, or Doob (h\)-transform toward a valid set |
| memory write rules | (often Dirac) (P^{\mathrm{mem}}\); (\mathrm{Obs}\) is one such write |
| parallel sample + select | nonlinear kernel (\mathrm{select}(A_1,\ldots,A_k)\) |
| commit gates | optional stopping; freeze a coordinate of (X\) |
| catalog rebind (\(I_{\mathrm{sku}}\)) | *stand-in* slow cell: specified write of catalog pointer \(S\). Runtime ([vdom-harness PR #13](https://github.com/keejkrej/vdom-harness/pull/13) / [#14](https://github.com/keejkrej/vdom-harness/pull/14) / [#16](https://github.com/keejkrej/vdom-harness/pull/16) / [#17](https://github.com/keejkrej/vdom-harness/pull/17) / [#18](https://github.com/keejkrej/vdom-harness/pull/18) / [#19](https://github.com/keejkrej/vdom-harness/pull/19), merged): `CatalogPointer` beside \(C\); later serving typed by \(S\) for mixed 39/44. Controller dump of \(X_n.S\) (vdom #16): reconstructed hung obs, `H=[]` `M=[]`. Serving-step dump (vdom #17): greeting-turn \(H/M\) on the same \(X\) after licensed write. Incoming messages empty; not a \(\tau^2\) user/gym step. Dump-label honesty (vdom #18): `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. vdom #19 writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. See §9. Not \(f_\theta\). Not the contribution. |
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

While a slow request is in flight, the fast process remains Markov with kernel \(K_{C,S}\) for the *pre-request* pair \((C,S)\). \(S\) is frozen. `servingPaused=false`. Arrival is an optional exogenous time \(T_{\mathrm{adapt}}\). On \(\{T_{\mathrm{adapt}}=n\}\cap\{g=\mathrm{mount}\}\) mount writes catalog pointer \(S\) and the kernel switches to \(K_{C,S'}\); otherwise it does not. Mount does not rebind `n.model` and does not spray a global `PhysicalNode.provider`. Jump iff later serving uses \(S'\). Official later-serving helpers must pass \(S\); if a caller omits the SKU argument, bound / `n.model` still win. Controller dump of \(X_n.S\) is vdom #16 (reconstructed hung obs; `H=[]` `M=[]`). Serving-step dump is vdom #17: greeting-turn \(H/M\) on the same \(X\) after licensed write. Incoming messages empty; not a \(\tau^2\) user/gym step. Dump-label honesty is vdom #18: `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. Do not claim #18 wrote those fields onto the HybridState the turn used. vdom #19 writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. See §9. This is a piecewise-homogeneous hybrid Markov process. It is not a diffusion in \(\theta\). It is not SGD. It is not a trainer job. On this stack the available actuator is \(I_{\mathrm{sku}}\) (0731 \(\to\) 0813), a cell.

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
- A *completed miss with no attractor* that only moves after \(C\) changes. Then clause 4 licensed the wrong arm (unidentified \(C\) was identified).
- If a mount never rebinds serving to 0813, there was no jump (Lemma 7.7: later serving must use the new SKU).
- Treating \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\) as a result of this paper (buying a stronger API; a diagnostic at most).

**Controller log (not a slogan).** [vdom-harness PR #11](https://github.com/keejkrej/vdom-harness/pull/11) implements the map hung-first: 39 \(I_{\mathrm{loop}}\) / 44 \(I_{\mathrm{sku}}\) / `waitKept` empty. [vdom-harness PR #12](https://github.com/keejkrej/vdom-harness/pull/12) is the live hung-44 reject cell (omit-after; serving stayed 0731; no live 0813 rebound). [vdom-harness PR #13](https://github.com/keejkrej/vdom-harness/pull/13) (merged) stores a `CatalogPointer` beside \(C\) and types later serving by \(S\) for mixed 39/44 (`7ae763a`). [vdom-harness PR #14](https://github.com/keejkrej/vdom-harness/pull/14) (merged) makes \(S\) a per-episode controller coordinate (`ControlledEpisode.serving`). A fresh 39-only batch after mixed mount stays 0731 and does not inherit leftover `servingSku=0813`. [vdom-harness PR #15](https://github.com/keejkrej/vdom-harness/pull/15) (merged) is the \(I_{\mathrm{sku}}\) ACCEPT protocol cell: fixture after + live 0813 serve recorded the serving id. Protocol cell, not a score. Not a Pro-vs-Flash lift. [vdom-harness PR #16](https://github.com/keejkrej/vdom-harness/pull/16) (merged) is the controller \(X_n.S\) dump after that licensed write. Controller \(X\) from reconstructed hung obs. `H=[]` `M=[]`. Not a live serving-step HybridState. Not a score. Not a new 0813 serve. [vdom-harness PR #17](https://github.com/keejkrej/vdom-harness/pull/17) (merged) is the serving-step \(X_n\) dump: greeting-turn \(H/M\) from a real OpenRouter `runTau2Turn` on the same object after the licensed write. Incoming messages empty; not a \(\tau^2\) user/gym step. [vdom-harness PR #18](https://github.com/keejkrej/vdom-harness/pull/18) (merged) is dump-label honesty: `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. Do not claim #18 wrote those fields onto the HybridState the turn used. [vdom-harness PR #19](https://github.com/keejkrej/vdom-harness/pull/19) (merged) writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. Protocol cell, not a score. Not a new 0813 airline eval. See §9.

**Diagnostics (evidence for \(\delta\), not SOTA).** See `paper/NOTES_ARM_CHOICE.md`. Self \(I_{\mathrm{loop}}\) on airline \(39/44\) went \(0.5\to 0.0\): \(C\) moved the path measure (loop is real) and a global cancel-policy overwrote a wait-hit (illegal apply; licenses the wait-hit gate). Post-gate, task 44 hung: clause 2 licenses \(I_{\mathrm{sku}}\); the controller log is [vdom-harness PR #11](https://github.com/keejkrej/vdom-harness/pull/11). Extra \(H\) is not \(I_{\mathrm{loop}}\) (Proposition 7.8a.3). Mock \(0\to 0.5\to 1.0\) is a protocol unit test, not a result. Do not report \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\) as a result.

---

## §8 Open problems (for builders)

### §8.1 Arm choice: decision rule stated; cascade-exponent refinement remains

Lemma 7.9 is the typed rule in \((\mathrm{completion},\,\mathrm{attractors},\,\mathrm{wait\text{-}hit},\,\hat p_{\mathrm{hit}})\). It is not a vibe and it does not delete this problem. Remaining work is to put the cascade exponent \(\lambda\) of \(\rho_n\) (Definition 5.4, Lemma 7.3) *into* \(\delta\): when should local Hamming growth tip a completed miss from \(I_{\mathrm{loop}}\) to \(I_{\mathrm{sku}}\)? The catalog pointer jumped only if serving rebinds. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). SKU swap is not the open problem. Typed \(\mathrm{Obs}\) counts only after the harness logs it.

2. Measure the three channels on a real stack (vLLM / llama.cpp / OpenRouter) with replay.
3. Estimate cascade exponents on vdom word-reverse vs a tool-using task.
4. When does best-of-\(k\) *with an external grader* beat (\tau\downarrow\) for (p_{\mathrm{hit}}\) at fixed compute?
5. A calculus for composing vdom ops as kernel interventions (algebra of (C\)).
6. Quasi-stationary loop detector from traces (attractor flags into Lemma 7.9).
7. Safety: scientist-emitted \(C\) and requested \(f_{\theta'}\) are untrusted interventions; same sandbox as capabilities. Slow-clock mounts must stay gated.

---

## §9 Controller log (vdom-harness)

Lemma 7.9 is not a tomorrow item. License is incompleteness, not `loopExhausted`. Nine merged citations plus two open [vdom-harness PR #21](https://github.com/keejkrej/vdom-harness/pull/21) packets (keep both):

- [vdom-harness PR #11](https://github.com/keejkrej/vdom-harness/pull/11): typed \(\mathrm{Obs}\), hung-first, 39 \(I_{\mathrm{loop}}\) / 44 \(I_{\mathrm{sku}}\) / `waitKept` empty.
- [vdom-harness PR #12](https://github.com/keejkrej/vdom-harness/pull/12): live hung-44 reject cell; omit-after still rejects; no live 0813 rebound.
- [vdom-harness PR #13](https://github.com/keejkrej/vdom-harness/pull/13) (merged): stores a `CatalogPointer` `{ sku, servingPaused: false }` beside \(C\). \(I_{\mathrm{sku}}\) writes that pointer; \(I_{\mathrm{loop}}\) writes \(C\); `n.model` stays 0731. Later serving is typed by \(S\) for mixed 39/44 (commit `7ae763a`): after fixture mount, `providerForNode(solve)` is 0731 on 39 and 0813 on 44. `rebindServing` is gone. `providerForNode` prefers the per-task `CatalogPointer`. `runGraph` passes that SKU as the `complete()` model. Unit tests only. The mount is a unit fixture. Not a \(\tau^2\) result.
- [vdom-harness PR #14](https://github.com/keejkrej/vdom-harness/pull/14) (merged): \(S\) is a per-episode controller coordinate (`ControlledEpisode.serving`). A fresh 39-only batch after mixed mount stays 0731 and does not inherit leftover `servingSku=0813`. Process `servingSku` is no longer the lookup. `batch.servingSku` is a cell log, not the lookup; do not put it back as the lookup. Unit tests only. Not a live dump. Not a live 0813 serve. Not a \(\tau^2\) result.
- [vdom-harness PR #15](https://github.com/keejkrej/vdom-harness/pull/15) (merged): \(I_{\mathrm{sku}}\) ACCEPT protocol cell. Hung-44 traces; controller 44 \(I_{\mathrm{sku}}\), 39 \(I_{\mathrm{loop}}\), `waitKept=[]`. Fixture after (`after=1 > before=0`, labeled `incompleteFixture` / `notTau2Lift`). Mount: `controllerServing` `39.sku=0731 44.sku=0813`; \(C\) topology / `n.model` stay 0731. One live OpenRouter completion after mount recorded `servingModelAfter=deepseek/deepseek-v4-pro-0813`; `jumped=true`; `servingPaused=false`; `gate.action=mount`; `pHit0813=null`. Contrast #12 reject (omit after): `jumped=false`, serving stayed 0731. JSON: `eval/tau2/improve-live-0731-isku-44-mount.json`. Protocol cell, not a score. Not a Pro-vs-Flash lift. Not a \(\tau^2\) result. Live airline `improveLoop` still omits after. Trainer \(I_{\mathrm{weight}}\) remains unimplemented.
- [vdom-harness PR #16](https://github.com/keejkrej/vdom-harness/pull/16) (merged, `1bbda40`): controller \(X_n.S\) dump after licensed write. JSON: `eval/tau2/hybrid-state-s-dump.json`. \(X_{44}.S.sku=deepseek/deepseek-v4-pro-0813\), `servingPaused=false`; \(X_{39}.S.sku=deepseek/deepseek-v4-flash-0731\). \(C_0\) flatten / `n.model` stay 0731 (`graphHash` before=after). \(I_{\mathrm{loop}}\) may write \(C\) on 39 only. Fresh 39-only \(X_n.S=\)0731, no inherited 0813. Controller \(X\) from reconstructed hung obs. `H=[]` `M=[]`. Not a live serving-step HybridState. Sidecar `hybridByTask` is a process Map of those objects; writes stay on \(X.S\). `servingByTask` is a derived cache from \(X.S\), not the lookup. Dump is not assembled from that Map. `dumpIsNot=ping/get_state S0`. `pHit0813=null`. Fixture after stays labeled. Not a score. Not a new 0813 serve. Not a sidecar rename. Not a Pro-vs-Flash score. Not a \(\tau^2\) result. Live airline `improveLoop` still omits after. \(I_{\mathrm{sku}}\) remains the stand-in cell. Trainer \(I_{\mathrm{weight}}\) remains unimplemented.
- [vdom-harness PR #17](https://github.com/keejkrej/vdom-harness/pull/17) (merged, `cc9d812`): serving-step \(X_n\) dump after licensed write. JSON: `eval/tau2/hybrid-state-serving-step-dump.json`. One live OpenRouter `runTau2Turn` on the same HybridState \(X_{44}\). Greeting-turn \(H/M\): incoming messages empty; assistant "Hello! How can I help you today?". Not a \(\tau^2\) user/gym step. `liveServingId=deepseek/deepseek-v4-pro-0813`. `mockProviderTurn=false`. `sameObjectAsTurnX=true`. Not stuffed: not `hung44LicenseObs`, not #15 pong, not `sourceEval`, not a serving-step-turn stamp. \(X_{44}.S.sku=0813\), `servingPaused=false`; \(X_{39}.S.sku=0731\); \(C\) `n.model` stays 0731; fresh39=0731. Missing \(X["39"]\) fails. `pHit0813=null`. Fixture after labeled. Protocol cell, not a score. Not a new 0813 airline eval. Not a Pro-vs-Flash score. Not a \(\tau^2\) result. Live airline `improveLoop` still omits after. Not the r6 live hang-then-\(I_{\mathrm{sku}}\) cell (that packet is the #21 r6 bullet). Do not inject gold airline text. Do not turn on `after=` in `improveLoop`. #16 remains the controller dump (`H=[]` `M=[]`). #17 is the greeting-turn \(H/M\) cell. Trainer \(I_{\mathrm{weight}}\) remains unimplemented. \(I_{\mathrm{sku}}\) remains the stand-in cell.
- [vdom-harness PR #18](https://github.com/keejkrej/vdom-harness/pull/18) (merged, `fe33ad2`): dump-label honesty on that same JSON. `licenseE` and `servingE` are two named facts. Greeting turn, not live hung-44 then served. Not a score. #18 was dump-label honesty only. Do not claim #18 wrote `licenseE`/`servingE` onto the HybridState the turn used. `pHit0813=null`. No re-run. H/M still "Hello! How can I help you today?". `liveServingId=0813`. Not a \(\tau^2\) result. Not a Pro-vs-Flash score. Live airline `improveLoop` still omits after. Do not inject gold airline text. Do not turn on `after=`. Not the r6 live hang-then-\(I_{\mathrm{sku}}\) cell (that packet is the #21 r6 bullet). Trainer \(I_{\mathrm{weight}}\) remains unimplemented. \(I_{\mathrm{sku}}\) remains the stand-in cell.
- [vdom-harness PR #19](https://github.com/keejkrej/vdom-harness/pull/19) (merged, `4aaf123`): writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). #19 is not a result. Not another \(X_n\) dump. After `runTau2Turn`, `finish()` writes runtime \(X.E\) via `writeHybridServingE` from the turn record (`hung=false`, `termination=null`, `kind=greeting-turn`, `incoming=[]`). Turn-derived facts: `servedModel=deepseek/deepseek-v4-pro-0813`, ts, content="Hello! How can I help you today?". Runtime `servingE` is the same object as runtime \(X.E\). Runtime fixture `licenseE` (beside \(X\), not a factor of paper \(X\)) is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE (`taskId=44`, `hung=true`, `termination=timeout`, `arm=I_sku`, `copiedIntoH=false`). Stored next to \(X\), not copied into H. `viewOfServingStep` does not replace \(X.E\) with a no-arg `servingEFromGreetingTurn()` constant overlay. After greeting, \(X.E.hung\) is false. `eSplit` still `licenseE ≠ servingE`. Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. `pHit0813=null`. No re-run. Trainer off. Live airline `improveLoop` still omits after. Do not inject gold airline text. Do not turn on `after=`. Not the r6 live hang-then-\(I_{\mathrm{sku}}\) cell (that packet is the #21 r6 bullet). Trainer \(I_{\mathrm{weight}}\) remains unimplemented. \(I_{\mathrm{sku}}\) remains the stand-in cell.
- [vdom-harness PR #21](https://github.com/keejkrej/vdom-harness/pull/21) (open, `1c3528c`): earlier completed-episode honesty packet. JSON: `eval/tau2/improve-live-0731-hang-obs-isku.json`. Fresh 0731 airline 44; `pendingKey=false`, `hung=false`, `freshHang=false`, `holeOpen=true`, `controllerReplay=false`. \(\mathrm{Obs}\) arm \(I_{\mathrm{loop}}\), `taskId=44`, `termination=user_stop`, `nSuccessProxy=0`. \(I_{\mathrm{sku}}\) not licensed (`weighted=[]`, `iSkuRequest=null`). `omitAfter=true`, `jumped=false`, serving 0731, `servingPaused=false`, `pHit0813=null`. Not overwritten by r6. Not a score. Not a dump. Not live hung-44 then served. #12 remains the `controllerReplay` reject cell.
- [vdom-harness PR #21](https://github.com/keejkrej/vdom-harness/pull/21) (open, `b608151`) r6: live timeout → \(I_{\mathrm{sku}}\) → omit-after reject cell. JSON: `eval/tau2/improve-live-0731-hang-obs-isku-r6.json`. Later live 0731 airline 44 timed out. `hung=true`, `freshHang=true`, `controllerReplay=false`, `obs.arm=I_sku`, `taskId=44`, `termination=timeout`, `nSuccessProxy=0`, `weighted=[44]`, `waitKept=[]`, `iSkuRequest={op:i_sku,before:0}` (no `after`; `omitAfter=true`), `gate.action=reject`, `jumped=false`, serving 0731, `servingPaused=false`, `pHit0813=null`. Protocol cell. n=1. `holeOpen=false` is a cell flag, not a paper result. Not a score. Not a dump. Not self-improvement. Not a catalog win. Not live hung-44 then served as a mount. Do not call #21 a closed hole. #12 remains the `controllerReplay` reject cell. \(I_{\mathrm{sku}}\) remains the stand-in; trainer off.

Remaining identification (not a Lemma 7.9 rewrite): #13 closed `n.model`; #14 closed process `servingSku` as the lookup. #15 is the \(I_{\mathrm{sku}}\) ACCEPT protocol cell, not a Pro-vs-Flash score. #16 closed sidecar `servingByTask`-as-lookup: \(S\) lives on `HybridState` / \(X_n\) as a controller dump. This is a controller \(X\) from reconstructed hung obs. `H=[]` `M=[]`. Not a live serving-step HybridState. Do not claim #16 already had live \(H/M\). #17 is greeting-turn \(H/M\) on the same \(X\) after licensed write: incoming messages empty; not a \(\tau^2\) user/gym step. #18 is dump-label honesty: `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. Do not claim #18 wrote those fields onto the HybridState the turn used. #19 writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. Not a new 0813 airline eval. Do not write "live hung-44 then served." The named live hang-then-\(I_{\mathrm{sku}}\) packet now exists as r6 ([vdom-harness PR #21](https://github.com/keejkrej/vdom-harness/pull/21), open, `b608151`; `eval/tau2/improve-live-0731-hang-obs-isku-r6.json`): timeout → \(I_{\mathrm{sku}}\) → omit-after reject, serving stayed 0731. Protocol cell. n=1. Not self-improvement. Not a catalog win. Not `holeOpen=false` as a result. The earlier 1c3528c file on the same PR remains the completed-episode honesty packet (`hung=false`, \(I_{\mathrm{loop}}\), `user_stop`, `holeOpen=true`); it is not overwritten. #12 remains the `controllerReplay` reject cell. Do not call #21 a closed hole. Do not fill a score or turn on `after=`. Not by turning on `after=` in `improveLoop`. Do not inject gold airline text. If a caller omits the SKU argument, bound / `n.model` still win; official later-serving helpers must keep passing \(S\). Gate is eval / first-passage, not “0813 exists.” \(f_\theta\) / trainer remains unimplemented. \(I_{\mathrm{sku}}\) is the stand-in slow cell. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Do not put the pointer back inside the *specified* \(C\). Rating is not a SOTA claim.

---

## §10 Diagnostics (existence and arm choice; not a leaderboard)

Dual implemented arms: \(I_{\mathrm{loop}}\) (graph \(C\)) | \(I_{\mathrm{sku}}\) (catalog pointer). Wait is the identity. \(f_\theta\) / trainer / \(I_{\mathrm{weight}}\) is unimplemented. \(I_{\mathrm{sku}}\) is the stand-in slow cell, not the contribution. Typed \(\mathrm{Obs}\) is a harness log after the controller implements it, not a slogan in this file. \(\tau^2\) and the 0731 rollouts are **diagnostics**. Do not claim SOTA on \(\tau^2\). Do not invent scores. Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\). Do not lead with \(0.7\to 0.9\). Do not treat mock \(0\to 0.5\to 1.0\) as a result. Do not title the paper as model routing or async weight updates. Do not put the catalog pointer back inside \(C\).

**Held-out is the eval.** Airline tasks \(18,20,23,25,30,35,38,42,45,48\) (OpenRouter `deepseek/deepseek-v4-flash-0731`, user+judge same model, 1 trial, max 2 rounds, one policy-checklist \(I_{\mathrm{loop}}\) only). Official DB hash. Audit: no gold reservation ID and no gold action leaked into the live prompt. The checklist was not written for these IDs; method overfit on \(39/41/44\) is why held-out exists. `pHitSequence` \(0.7\to 0.9\). One-shot misses \(23,35,48\) (hits the other 7). Policy-checklist lifts those three and **regresses 18** (\(1\to 0\)). Completion: r0 finished 8 / transfer 2; r1 finished 9 / transfer 1; hung 0, error 0. JSON: `experiments/improve-live-0731-heldout.json` (source: vdom-harness `eval/tau2/improve-live-0731-heldout.json`). Better than this one-shot control on a \(10\times 1\) slice. Not a reliability claim. The loop is real; the content of \(C\) is a static prior, not self-reflection. Discovery slice = test-hacking risk. Held-out = weak generalization, including a regression on a task \(\mathrm{Obs}\) marked `wait`. Not SOTA, not a \(\tau^2\) win. See `paper/ANALYSIS.md` §0c.

**Replication (overfit slice, secondary).** \(39/41/44\times 3\) trials: \(\mathrm{pass}^1\) \(0.333\to 0.556\); \(\mathrm{pass}^2\) \(0.333\to 0.444\); \(\mathrm{pass}^3\) \(0.333\to 0.333\) (flat). Task 39: \(0/3\to 2/3\); 44: \(0/3\to 0/3\); 41: \(3/3\to 3/3\). JSON: `experiments/improve-live-0731-replication.json`. The earlier \(0.333\to 0.667\) was \(n=1\) on this same slice — do not lead with \(0.667\). Older licensing traces on that slice: generic \(I_{\mathrm{loop}}\) \(0.333\to 0\to 0.333\); first policy draft \(0.333\to 0\). Remaining incomplete episodes license \(I_{\mathrm{sku}}\) (0731 \(\to\) 0813). Not a Pro-vs-Flash leaderboard.

**Self-obs \(I_{\mathrm{loop}}\) on \(39+44\) (diagnostic; do not lead).** Live 0731, 2026-08-19, tasks \(39+44\), 1 trial, max-rounds 1, `selfObsPath=self`. Round 0: \(p_{\mathrm{hit}}=0.5\) (39 miss, Obs \(I_{\mathrm{loop}}\); 44 hit, Obs `wait`). Model returned valid \(I_{\mathrm{loop}}\) JSON and mounted a global `cancel_policy` (wrong attractor: it thought 44 / sophia needed a cancel). Round 1: \(p_{\mathrm{hit}}=0.0\) (39 still miss, same `MSJ4OA`; 44 regressed \(1\to 0\), `KC18K6` `action_match` false). Mid-turn `get_agent_graph` / `set_agent_graph`: zero calls. `servingPaused` false. Not an \(I_{\mathrm{sku}}\) jump (episodes completed with writes). Same shape as held-out task 18: Obs said `wait` on a hit; a global \(I_{\mathrm{loop}}\) still changed \(C\) for the whole slice. That unscoped apply is illegal — evidence the loop ran and Obs chose \(I_{\mathrm{loop}}\), not a SOTA miss. JSON: `experiments/improve-live-0731-self-3944.json` (source: vdom-harness `eval/tau2/improve-live-0731-self-3944.json`).

**Runtime fix (already merged).** [vdom-harness PR #10](https://github.com/keejkrej/vdom-harness/pull/10) (2026-08-19): “Gate \(I_{\mathrm{loop}}\): wait-hit tasks keep \(C_0\)”. Mixed batch: wait+hit served on \(C_0\), miss / \(I_{\mathrm{loop}}\) served on \(C_1\). Logged as `applyScope {waitKept, looped}`. Host fallback `applyILoop` uses the same gate. Mock \(0\to 0.5\to 1.0\) still holds. That gate is clause 1 of Lemma 7.9.

**Post-gate hang licenses \(I_{\mathrm{sku}}\) (evidence for the rule; do not lead).** Live JSON (`experiments/improve-live-0731-self-3944-postgate.json`, 2026-08-20): hung-44, `applyScope looped=[39,44]`, \(I_{\mathrm{loop}}\) on empty traces. The hang licensed \(I_{\mathrm{sku}}\). The live airline `improveLoop` still omits after (that honesty lock is unchanged). [vdom-harness PR #11](https://github.com/keejkrej/vdom-harness/pull/11) is a later unit replay of the rule, not \(\mathrm{Obs}\) on those 0731 traces. The dedicated ACCEPT cell is [vdom-harness PR #15](https://github.com/keejkrej/vdom-harness/pull/15): fixture after + live 0813 serve recorded the serving id. Protocol cell, not a score. The controller dump is [vdom-harness PR #16](https://github.com/keejkrej/vdom-harness/pull/16): \(X_n.S\) after that licensed write, reconstructed hung obs, `H=[]` `M=[]`. The serving-step dump is [vdom-harness PR #17](https://github.com/keejkrej/vdom-harness/pull/17): greeting-turn \(H/M\) on the same \(X\) after licensed write. Incoming messages empty; not a \(\tau^2\) user/gym step. Dump-label honesty is [vdom-harness PR #18](https://github.com/keejkrej/vdom-harness/pull/18): `licenseE` and `servingE` are two named facts. #18 was dump-label honesty only. Do not claim #18 wrote those fields onto the HybridState the turn used. [vdom-harness PR #19](https://github.com/keejkrej/vdom-harness/pull/19) writes `licenseE` and \(E\)/`servingE` onto the HybridState the turn used. Dump serializes those fields from \(X\). Leftover phrase dropped. `licenseE` is a fixture field beside paper \(X=(H,M,E,C,S)\). Paper \(E\) is the environment coordinate. `licenseE` is the reconstructed hung/timeout \(I_{\mathrm{sku}}\) LICENSE stored next to \(X\), not paper \(E\), not the \(E\) factor of the hybrid process, not a sixth paper coordinate. Do not write `licenseE` is \(E\). After #19, runtime \(X.E\) / `servingE` is greeting-turn serving-step \(E\) (`hung=false`). Greeting-turn \(E\), not a \(\tau^2\) user/gym step. Not live hung-44 then served. Not a score. #19 is not a result. Not another \(X_n\) dump. Protocol cell, not a score. Not a new 0813 airline eval. See §9. Do not invent post-mount \(p_{\mathrm{hit}}\). Do not sell \(p_{\mathrm{hit}}(0813)-p_{\mathrm{hit}}(0731)\).

Mock closed loop \(0\to 0.5\to 1.0\) on official `update_task_1` / `impossible_task_1` is a **protocol unit test**, not an ICLR result.

Static retail \(5\times 4\) \(\mathrm{pass}^k=1\) (`experiments/tau2-retail-0731.json`) is \(\mathbb{P}_{C_0}\) at a \(\mathrm{wait}\) fixed point, not self-improvement.

The three fixtures in `src/tasks.ts` (word-reverse, calculator, retrieval-QA) diagnose \(K_{C,S}\): same \(S\), two temperatures, first-passage. They **license** \(I_{\mathrm{loop}}\) when the miss is a topology attractor (retrieval 12/12, sequential toys 0/12, \(\tau\)-invariant loops). They are **not** the agent benchmark. Counts: `paper/ANALYSIS.md`, `experiments/live-0731.json`.

The established *diagnostic* environment is [τ²-bench](https://github.com/sierra-research/tau2-bench) (Barres et al., 2025). \(\mathrm{pass}^k\) is first-passage under \(k\) i.i.d. repeats, not \(\mathrm{pass}@k\). Implementation: [vdom-harness](https://github.com/keejkrej/vdom-harness) `improveLoop` + `python -m tau2_vdom`. Do not invent a larger \(\tau^2\) table.

