# Venue track

First target: **ICLR 2027**. Abstract 18 Sep 2026 AoE, paper 25 Sep 2026 AoE.
Backup: ICML 2027 (Jan 2027) if ICLR slips.
PRL is not the first submission.

## Contribution (locked)

Write **\(C\) vs SKU vs wait**. Dual *implemented* arms: \(I_{\mathrm{loop}}\) (graph \(C\)) | \(I_{\mathrm{sku}}\) (catalog pointer). Wait is the identity. Do not write the slow factor as \(f_\theta\). We cannot train. \(f_\theta\) / trainer / \(I_{\mathrm{weight}}\) is unimplemented. \(I_{\mathrm{sku}}\) is the stand-in slow cell, not the contribution. License for \(I_{\mathrm{sku}}\) is an incomplete episode, not price. Typed \(\mathrm{Obs}\) is a harness log after the controller implements it, not a FRAMEWORK slogan. Not async weight updates.

- An LLM agent is a controlled hybrid Markov process. State \(X=(H,M,E,C,S)\). Kernel \(K_{C,S}\). \(S\) is the catalog pointer, not \(f_\theta\). Three typed noise channels (samp, num, env).
- Dual implemented arms: \(I_{\mathrm{loop}}\) mutates \(C\) (same SKU); \(I_{\mathrm{sku}}\) gated-rebinds the catalog pointer (same \(C\)).
- Arm choice (Lemma 7.9): hit \(\to\) wait. Incomplete \(\to I_{\mathrm{sku}}\). Completed miss + attractor \(\to I_{\mathrm{loop}}\). Extra \(H\) is not an arm. Not a routing paper.

**Experiments are existence and arm-choice diagnostics**, not a \(\tau^2\) SOTA attempt and not “we improve \(\tau^2\) airline.”

Do not claim SOTA. Do not claim saturation. Do not invent scores. Do not encode gold reservation IDs as the method. Do not call \(I_{\mathrm{sku}}\) fine-tuning or a trainer. On this stack it is a catalog pointer rebind (0731 \(\to\) 0813). A mount that never rebinds serving to 0813 is not a jump.

Done when the abstract cannot be misread as a \(\tau^2\) SOTA paper or as async weight updates.
