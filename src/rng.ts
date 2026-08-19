/** Seeded mulberry32. Sampling-channel RNG; numerical noise uses a derived seed. */
export type RNG = {
  next(): number;
  int(n: number): number;
  normal(): number;
  fork(tag: number): RNG;
};

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(n: number) {
      return Math.floor(next() * n);
    },
    normal() {
      const u = Math.max(next(), Number.EPSILON);
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    fork(tag: number) {
      return mulberry32((seed ^ (tag * 0x9e3779b9)) >>> 0);
    },
  };
}

export function softmax(logits: Record<string, number>, temperature: number): Record<string, number> {
  const keys = Object.keys(logits);
  if (keys.length === 0) return {};
  if (temperature <= 0) {
    let best = keys[0]!;
    let bestV = logits[best]!;
    for (const k of keys) {
      if (logits[k]! > bestV) {
        best = k;
        bestV = logits[k]!;
      }
    }
    const out: Record<string, number> = {};
    for (const k of keys) out[k] = k === best ? 1 : 0;
    return out;
  }
  const max = Math.max(...keys.map((k) => logits[k]!));
  const exps: Record<string, number> = {};
  let z = 0;
  for (const k of keys) {
    const e = Math.exp((logits[k]! - max) / temperature);
    exps[k] = e;
    z += e;
  }
  for (const k of keys) exps[k]! /= z;
  return exps;
}

export function sampleCategorical(probs: Record<string, number>, rng: RNG): string {
  const keys = Object.keys(probs);
  let u = rng.next();
  for (const k of keys) {
    u -= probs[k]!;
    if (u <= 0) return k;
  }
  return keys[keys.length - 1]!;
}

export function argmax(logits: Record<string, number>): string {
  const keys = Object.keys(logits);
  if (keys.length === 0) throw new Error("argmax: empty logits");
  let best = keys[0]!;
  let bestV = logits[best]!;
  let tie = false;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]!;
    const v = logits[k]!;
    if (v > bestV) {
      best = k;
      bestV = v;
      tie = false;
    } else if (v === bestV) {
      tie = true;
    }
  }
  if (tie) {
    // Unique-argmax assumption failed; still return the first maximizer.
  }
  return best;
}

/** Top-2 logit gap Δℓ = ℓ_(1) − ℓ_(2). 0 if |V| < 2. */
export function top2Gap(logits: Record<string, number>): number {
  const vals = Object.values(logits).sort((a, b) => b - a);
  if (vals.length < 2) return Infinity;
  return vals[0]! - vals[1]!;
}

export function lInf(a: Record<string, number>, b: Record<string, number>): number {
  let m = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    m = Math.max(m, Math.abs((a[k] ?? 0) - (b[k] ?? 0)));
  }
  return m;
}
