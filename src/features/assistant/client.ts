import {
  chatErrorSchema,
  chatRequestSchema,
  chatResponseSchema,
  trimHistory,
  type ChatMessage,
} from "./schema";

export const ASSISTANT_ENDPOINT = "api/chat";

export type AskResult = { ok: true; reply: string } | { ok: false; error: string };

/** Sends the conversation to the site assistant endpoint and maps failures to Polish messages. */
export async function askAssistant(
  messages: ChatMessage[],
  fetcher: typeof fetch = fetch,
): Promise<AskResult> {
  const request = chatRequestSchema.safeParse({ messages: trimHistory(messages) });
  if (!request.success) {
    return { ok: false, error: request.error.issues[0]?.message ?? "Nieprawidłowe pytanie." };
  }
  let response: Response;
  try {
    response = await fetcher(ASSISTANT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request.data),
    });
  } catch {
    return {
      ok: false,
      error: "Brak połączenia z asystentem. Sprawdź internet i spróbuj ponownie.",
    };
  }
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) {
    const parsed = chatResponseSchema.safeParse(body);
    if (parsed.success) return { ok: true, reply: parsed.data.reply };
  }
  const error = chatErrorSchema.safeParse(body);
  if (error.success) return { ok: false, error: error.data.error };
  if (response.status === 404) {
    return { ok: false, error: "Asystent nie jest dostępny w tej wersji strony." };
  }
  return { ok: false, error: "Asystent jest chwilowo niedostępny. Spróbuj ponownie później." };
}

export type AnswerPart = { type: "text"; text: string } | { type: "link"; href: string };

/** Splits an answer into text and in-app hash links (#/oferty, #/metodologia, ...). */
export function splitAnswerLinks(text: string): AnswerPart[] {
  const parts: AnswerPart[] = [];
  const pattern = /#\/[\p{L}\p{N}\-_/?=&.]*[\p{L}\p{N}\-_/=&]/gu;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", text: text.slice(last, index) });
    parts.push({ type: "link", href: match[0] });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}
