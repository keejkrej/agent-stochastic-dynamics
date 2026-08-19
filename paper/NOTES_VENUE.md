# Venue track

First target: ICLR 2027. Abstract 18 Sep 2026 AoE, paper 25 Sep 2026 AoE.
Backup: ICML 2027 (Jan 2027) if ICLR slips.
PRL is not the first submission.

## Why ICLR first

The object is a self-observing agent with a dual intervention (loop vs async weights) on a typed-noise hybrid kernel. That is representation / agent / test-time compute, not a four-page physics letter. ICLR takes 9-page theory-plus-small-experiments drafts. Reciprocal reviewing and the one-paper cap for authors without a listed venue paper apply; OpenReview profiles must exist before the abstract deadline.

ICML is the same intellectual home with a later deadline. Use it if the ICLR draft is not tight by mid-September (missing live-channel measurement, missing cascade on vdom-harness, or an intro that still reads as a kernel manifesto).

## What would make a PRL letter

PRL rejects framework surveys. Extract a 4-page letter only if one crisp physics result exists, with one figure:

- gap-sensitivity of numerical noise (Lemma 3.5 / 7.2) plus
- a measured cascade exponent on a coupling, plus
- a single plot (Hamming vs n after a one-bit memory split).

Until that figure is from a real stack (not only the toy kernel), do not submit to PRL. See paper/prl/.

## Experiments that remain

- Three-channel measurement on vLLM / llama.cpp / OpenRouter with replay.
- Cascade on vdom-harness word-reverse vs a tool-using task (not only src/tasks.ts).
- When best-of-k with an *external* grader beats tau-down at fixed compute.
- Obs decision rule: I_loop vs I_weight vs wait, in terms of p_hit and cascade.
- Safety: scientist-emitted C as an untrusted intervention.

Live traces in this repo use deepseek/deepseek-v4-flash-0731 only.
