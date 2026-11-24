import { describe, expect, it } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { chatRequestSchema, MAX_HISTORY_MESSAGES, trimHistory, type ChatMessage } from "./schema";
import { buildSystemPrompt } from "./knowledge";
import { handleChatRequest, RateLimiter, type AssistantClient } from "./server";
import { askAssistant, splitAnswerLinks } from "./client";

const question: ChatMessage[] = [{ role: "user", content: "Jak wybieracie oferty?" }];

function post(body: unknown, ip = "203.0.113.1") {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function fakeClient(reply: Partial<Anthropic.Beta.BetaMessage>) {
  const calls: Anthropic.Beta.MessageCreateParamsNonStreaming[] = [];
  const client: AssistantClient = {
    beta: {
      messages: {
        create: async (params) => {
          calls.push(params);
          return {
            stop_reason: "end_turn",
            content: [{ type: "text", text: "Sprawdzamy cztery kryteria.", citations: null }],
            ...reply,
          } as Anthropic.Beta.BetaMessage;
        },
      },
    },
  };
  return { client, calls };
}

describe("assistant schema", () => {
  it("accepts a question and rejects a conversation ending with an answer", () => {
    expect(chatRequestSchema.safeParse({ messages: question }).success).toBe(true);
    expect(
      chatRequestSchema.safeParse({
        messages: [...question, { role: "assistant", content: "Odpowiedź" }],
      }).success,
    ).toBe(false);
  });

  it("rejects questions over the length limit and empty questions", () => {
    expect(
      chatRequestSchema.safeParse({ messages: [{ role: "user", content: "a".repeat(601) }] })
        .success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({ messages: [{ role: "user", content: "  " }] }).success,
    ).toBe(false);
  });

  it("trims long history to the limit and keeps a question first", () => {
    const long: ChatMessage[] = Array.from({ length: 15 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: `m${index}`,
    }));
    const trimmed = trimHistory(long);
    expect(trimmed.length).toBeLessThanOrEqual(MAX_HISTORY_MESSAGES);
    expect(trimmed[0]?.role).toBe("user");
    expect(trimmed.at(-1)?.content).toBe("m14");
  });
});

describe("assistant knowledge", () => {
  it("includes the methodology, categories and published offers", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Człowiek zachowuje odpowiedzialność");
    expect(prompt).toContain("Build: Tworzysz modele");
    expect(prompt).toContain("AI Product Manager — BrightLabs");
    expect(prompt).toContain("#/oferty/ai-product-manager");
    expect(prompt).toContain("22 000–29 000 PLN brutto / mies.");
    expect(prompt).toContain("Odpowiadaj po polsku");
  });
});

describe("assistant handler", () => {
  it("answers 503 without an API key", async () => {
    const response = await handleChatRequest(post({ messages: question }), { env: {} });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Asystent nie jest jeszcze włączony w tej wersji strony.",
    });
  });

  it("rejects other methods and invalid bodies", async () => {
    const env = { ANTHROPIC_API_KEY: "test" };
    const get = await handleChatRequest(new Request("http://localhost/api/chat"), { env });
    expect(get.status).toBe(405);
    const broken = await handleChatRequest(post("{"), { env, limiter: new RateLimiter() });
    expect(broken.status).toBe(400);
    const invalid = await handleChatRequest(post({ messages: [] }), {
      env,
      limiter: new RateLimiter(),
    });
    expect(invalid.status).toBe(400);
  });

  it("sends the conversation with a cached system prompt and returns the text", async () => {
    const { client, calls } = fakeClient({});
    const response = await handleChatRequest(post({ messages: question }), {
      env: { ANTHROPIC_API_KEY: "test" },
      createClient: () => client,
      limiter: new RateLimiter(),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reply: "Sprawdzamy cztery kryteria." });
    const params = calls[0]!;
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.fallbacks).toBe("default");
    expect(params.messages).toEqual([{ role: "user", content: "Jak wybieracie oferty?" }]);
    const system = params.system as Anthropic.Beta.BetaTextBlockParam[];
    expect(system[0]?.cache_control).toEqual({ type: "ephemeral" });
  });

  it("uses ANTHROPIC_MODEL and skips fallbacks for models without them", async () => {
    const { client, calls } = fakeClient({});
    await handleChatRequest(post({ messages: question }), {
      env: { ANTHROPIC_API_KEY: "test", ANTHROPIC_MODEL: "claude-haiku-5-5" },
      createClient: () => client,
      limiter: new RateLimiter(),
    });
    expect(calls[0]?.model).toBe("claude-haiku-5-5");
    expect(calls[0]?.fallbacks).toBeUndefined();
  });

  it("retries without the refusal fallback when the API rejects it and logs the reason", async () => {
    const calls: Anthropic.Beta.MessageCreateParamsNonStreaming[] = [];
    const logged: string[] = [];
    const original = console.error;
    console.error = (line: string) => void logged.push(line);
    const client: AssistantClient = {
      beta: {
        messages: {
          create: async (params) => {
            calls.push(params);
            if (params.fallbacks) {
              throw new Anthropic.BadRequestError(
                400,
                { error: { type: "invalid_request_error", message: "fallbacks not enabled" } },
                "fallbacks not enabled",
                new Headers(),
              );
            }
            return {
              stop_reason: "end_turn",
              content: [{ type: "text", text: "Tak.", citations: null }],
            } as unknown as Anthropic.Beta.BetaMessage;
          },
        },
      },
    };
    try {
      const response = await handleChatRequest(post({ messages: question }), {
        env: { ANTHROPIC_API_KEY: "test" },
        createClient: () => client,
        limiter: new RateLimiter(),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ reply: "Tak." });
    } finally {
      console.error = original;
    }
    expect(calls).toHaveLength(2);
    expect(calls[1]?.fallbacks).toBeUndefined();
    expect(calls[1]?.betas).toBeUndefined();
    expect(logged[0]).toContain("invalid_request_error");
    expect(logged[0]).toContain("fallbacks not enabled");
    expect(logged[0]).not.toContain("Jak wybieracie");
  });

  it("replaces a refusal with a polite answer", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", content: [] });
    const response = await handleChatRequest(post({ messages: question }), {
      env: { ANTHROPIC_API_KEY: "test" },
      createClient: () => client,
      limiter: new RateLimiter(),
    });
    expect(response.status).toBe(200);
    expect(((await response.json()) as { reply: string }).reply).toContain("Nie mogę pomóc");
  });

  it("limits requests per address", async () => {
    const { client } = fakeClient({});
    const limiter = new RateLimiter(2, 60_000);
    const options = {
      env: { ANTHROPIC_API_KEY: "test" },
      createClient: () => client,
      limiter,
      now: () => 1_000,
    };
    expect((await handleChatRequest(post({ messages: question }), options)).status).toBe(200);
    expect((await handleChatRequest(post({ messages: question }), options)).status).toBe(200);
    expect((await handleChatRequest(post({ messages: question }), options)).status).toBe(429);
    expect(
      (await handleChatRequest(post({ messages: question }, "198.51.100.9"), options)).status,
    ).toBe(200);
  });
});

describe("assistant client", () => {
  it("returns the reply or the server's error message", async () => {
    const ok = await askAssistant(question, async () => Response.json({ reply: "Tak." }));
    expect(ok).toEqual({ ok: true, reply: "Tak." });
    const off = await askAssistant(question, async () =>
      Response.json({ error: "Asystent nie jest jeszcze włączony." }, { status: 503 }),
    );
    expect(off).toEqual({ ok: false, error: "Asystent nie jest jeszcze włączony." });
    const missing = await askAssistant(question, async () => new Response("", { status: 404 }));
    expect(missing.ok).toBe(false);
    const offline = await askAssistant(question, async () => {
      throw new TypeError("network");
    });
    expect(offline).toMatchObject({ ok: false, error: expect.stringContaining("Brak połączenia") });
  });

  it("splits hash links out of answers", () => {
    expect(splitAnswerLinks("Zobacz #/metodologia. Oferty: #/oferty?category=build")).toEqual([
      { type: "text", text: "Zobacz " },
      { type: "link", href: "#/metodologia" },
      { type: "text", text: ". Oferty: " },
      { type: "link", href: "#/oferty?category=build" },
    ]);
  });
});
