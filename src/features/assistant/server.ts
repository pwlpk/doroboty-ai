/**
 * Server side of the site assistant: validates the request, applies a best-effort rate limit
 * and asks Claude for an answer. Runs in the Vercel function (api/chat.ts) and in the Vite
 * dev/preview middleware. Never import it from browser code: it reads the API key.
 * Questions and answers are never logged.
 */
import Anthropic from "@anthropic-ai/sdk";
import { chatRequestSchema, type ChatMessage } from "./schema.js";
import { buildSystemPrompt } from "./knowledge.js";

export const DEFAULT_ASSISTANT_MODEL = "claude-opus-5-5";
/** Models that accept the server-side refusal fallback ("default" routing). */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export interface AssistantEnv {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
}

/** The part of the Anthropic client the handler uses; tests pass a fake. */
export interface AssistantClient {
  beta: {
    messages: {
      create(
        params: Anthropic.Beta.MessageCreateParamsNonStreaming,
      ): Promise<Anthropic.Beta.BetaMessage>;
    };
  };
}

export interface HandlerOptions {
  env: AssistantEnv;
  createClient?: (apiKey: string) => AssistantClient;
  now?: () => number;
  limiter?: RateLimiter;
}

export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private limit = RATE_LIMIT,
    private windowMs = RATE_WINDOW_MS,
  ) {}
  allow(key: string, now: number): boolean {
    const recent = (this.hits.get(key) ?? []).filter((time) => now - time < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 5000) this.hits.clear();
    return true;
  }
}

const sharedLimiter = new RateLimiter();
let cachedSystemPrompt: string | undefined;

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "anonymous";
}

function toApiMessages(messages: ChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  return messages.map((message) => ({ role: message.role, content: message.content }));
}

export async function handleChatRequest(
  request: Request,
  options: HandlerOptions,
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Użyj metody POST." }, 405, { allow: "POST" });
  }
  const apiKey = options.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return json({ error: "Asystent nie jest jeszcze włączony w tej wersji strony." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowe zapytanie." }, 400);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe zapytanie." }, 400);
  }

  const now = options.now?.() ?? Date.now();
  if (!(options.limiter ?? sharedLimiter).allow(clientKey(request), now)) {
    return json({ error: "Zbyt wiele pytań naraz. Spróbuj ponownie za kilka minut." }, 429, {
      "retry-after": "600",
    });
  }

  const model = options.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ASSISTANT_MODEL;
  const client = (options.createClient ?? ((key) => new Anthropic({ apiKey: key })))(apiKey);
  cachedSystemPrompt ??= buildSystemPrompt();

  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 1024,
      output_config: { effort: "low" },
      system: [{ type: "text", text: cachedSystemPrompt, cache_control: { type: "ephemeral" } }],
      messages: toApiMessages(parsed.data.messages),
      ...(FALLBACK_MODELS.has(model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });
    if (response.stop_reason === "refusal") {
      return json(
        { reply: "Nie mogę pomóc w tej sprawie. Zapytaj o oferty lub działanie serwisu." },
        200,
      );
    }
    const reply = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    if (!reply) {
      return json({ error: "Asystent nie przygotował odpowiedzi. Spróbuj zapytać inaczej." }, 502);
    }
    return json({ reply }, 200);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "Asystent jest teraz mocno obciążony. Spróbuj za chwilę." }, 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Site assistant: Anthropic API key was rejected.");
      return json({ error: "Asystent jest chwilowo niedostępny." }, 503);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Site assistant: Anthropic API error ${error.status ?? "unknown"}.`);
    } else {
      console.error("Site assistant: request to Anthropic failed.");
    }
    return json({ error: "Asystent jest chwilowo niedostępny. Spróbuj ponownie później." }, 502);
  }
}
