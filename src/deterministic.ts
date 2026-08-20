import type { CompleteOpts, Message, Provider } from "./types.js";

export function reverseEntire(s: string): string {
  return [...s].reverse().join("");
}

export function reverseEachWord(s: string): string {
  return s
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => [...w].reverse().join(" "))
    .join(" ")
    .replace(/ /g, "")
    .split("")
    // keep word-level reverse
    .join("");
}

/** Correct word-reverse used by the vdom-harness fixture. */
export function reverseEachWordCorrect(s: string): string {
  return s
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => [...w].reverse().join(""))
    .join(" ");
}

function extractInput(msgs: Message[]): string {
  const text = msgs.map((m) => m.content).join("\n");
  const inputLine = text.match(/Input:\s*(.+)/i);
  if (inputLine?.[1]) return inputLine[1].trim().split("\n")[0]!.trim();
  const lastUser = [...msgs].reverse().find((m) => m.role === "user");
  return lastUser?.content ?? "";
}

function inferRole(msgs: Message[], opts?: CompleteOpts): string {
  if (opts?.role) return opts.role.toLowerCase();
  for (const m of msgs) {
    const match = m.content.match(/^Role:\s*(\S+)/im);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return "";
}

function hasLesson(msgs: Message[]): boolean {
  const text = msgs.map((m) => m.content).join("\n").toLowerCase();
  return text.includes("reverse each word") || (text.includes("independently") && text.includes("reverse"));
}

/**
 * Dirac sampling channel. Role-aware fixed maps — the vdom-harness DeterministicProvider story.
 * Temperature is ignored: this is the τ → 0 unique-argmax automaton.
 */
export class DeterministicProvider implements Provider {
  name = "deterministic";
  model: string;

  constructor(model = "deterministic") {
    this.model = model;
  }

  async complete(msgs: Message[], opts?: CompleteOpts): Promise<string> {
    const role = inferRole(msgs, opts);
    const input = extractInput(msgs);

    if (role === "critic" || role === "feedback") {
      return "The transformation is incorrect. Reverse each word independently, not the whole string.";
    }
    if (role === "refine" || role === "refiner") {
      return reverseEachWordCorrect(input);
    }
    if (role === "reflect" || role === "reflection") {
      return "reverse each word independently; do not reverse the entire string.";
    }
    if (role === "scientist") {
      return JSON.stringify({
        id: "evolved-self-refine",
        version: 2,
        meta: { technique: "self-refine" },
        root: { key: "solve", role: "solve", objective: "Generate", children: [] },
      });
    }
    if (
      role === "solve" ||
      role === "actor" ||
      role === "one-shot" ||
      role === "generator" ||
      role === "calc" ||
      role === "qa" ||
      role === ""
    ) {
      if (hasLesson(msgs)) return reverseEachWordCorrect(input);
      if (input.includes("dom virtual") || input.includes("hello world") || /^[a-z]+(\s+[a-z]+)+$/i.test(input)) {
        return reverseEntire(input);
      }
      return input;
    }
    return input;
  }
}

/**
 * Adapted (post-mount) Dirac map: always reverse-each-word. Models an I_sku catalog-pointer jump.
 */
export class AdaptedProvider implements Provider {
  name = "adapted";
  model: string;
  constructor(model = "adapted") {
    this.model = model;
  }
  async complete(msgs: Message[], _opts?: CompleteOpts): Promise<string> {
    return reverseEachWordCorrect(extractInput(msgs));
  }
}
