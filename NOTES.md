# Related work and citations

Gap: no existing framework does all three of (i) closed-loop hybrid Markov process, (ii) typed samp/num/env channels, (iii) graph edits as kernel interventions. The literature is not empty.

## Table

| Paper | Models | Misses |
| --- | --- | --- |
| Unraveling Text Generation (2408.11863) | token generation SDE | no tools/memory/graph C |
| Multi-objective LLM SDE (2510.10739) | score-space drift-diffusion | not typed noise |
| Language Generation as Optimal Control (2605.14531) | SOC in latent control space | no tool+memory loop |
| SuperLocalMemory V3 (2603.14588) | memory lifecycle Langevin+FP | memory only |
| MemCon (2607.13591) | memory-as-MDP | no factored channels |
| Memento 2 SRDP (2512.22716) | write=eval, read=improve | not typed-noise K |
| Memp (2508.06433) | procedural memory | no K_C |
| Reflexion (2303.11366) | linguistic feedback | a particular Pmem |
| Self-Refine (2303.17651) | generate-feedback-refine | a particular graph |
| Langevin / Fokker-Planck / Freidlin-Wentzell | small-noise diffusions | wrong primary language |
| MDP/POMDP | controlled Markov | does not type the three channels |
| Doob h-transform | condition on a set | language for validators |
| Gumbel-max | categorical / extremes | language for decoding and best-of-k |

## Citations

- arXiv:2408.11863, 2510.10739, 2605.14531 (generation SDE / control)
- arXiv:2603.14588, 2607.13591, 2512.22716, 2508.06433 (memory)
- arXiv:2303.11366 Reflexion; 2303.17651 Self-Refine
- Freidlin-Wentzell; Puterman MDP; Kaelbling POMDP; Gumbel 1954
- https://github.com/keejkrej/vdom-harness
