/**
 * OpenRouter chat client (OpenAI-compatible).
 * Base: https://openrouter.ai/api/v1
 * Env:  OPENROUTER_API_KEY
 *
 * Absent key → DeterministicProvider. The pipeline is real either way.
 */
import { DeterministicProvider } from "./deterministic.js";
import type { CompleteOpts, Message, Provider } from "./types.js";

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v4-flash-0731";

export function openRouterKey(): string | undefined {
  const k = process.env.OPENROUTER_API_KEY?.trim();
  return k && k.length > 0 ? k : undefined;
}

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

export class OpenRouterProvider implements Provider {
  name = "openrouter";
  model: string;

  constructor(
    private readonly apiKey: string,
    model: string = DEFAULT_OPENROUTER_MODEL,
    private readonly baseUrl: string = OPENROUTER_BASE,
  ) {
    this.model = model;
  }

  async complete(msgs: Message[], opts?: CompleteOpts): Promise<string> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://github.com/keejkrej/agent-stochastic-dynamics",
        "X-Title": "agent-stochastic-dynamics",
      },
      body: JSON.stringify({
        model: this.model,
        messages: msgs,
        temperature: opts?.temperature ?? 0,
        seed: opts?.seed,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${body}`);
    }
    const data = (await res.json()) as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content ?? "";
  }
}

/** Prefer OpenRouter when keyed; otherwise Dirac mock. */
export function createProvider(modelId?: string): Provider {
  const key = openRouterKey();
  if (key) {
    return new OpenRouterProvider(key, modelId ?? DEFAULT_OPENROUTER_MODEL);
  }
  return new DeterministicProvider(modelId ?? "deterministic");
}

export function providerKind(p: Provider): "openrouter" | "deterministic" | "adapted" | "other" {
  if (p.name === "openrouter") return "openrouter";
  if (p.name === "deterministic") return "deterministic";
  if (p.name === "adapted") return "adapted";
  return "other";
}
