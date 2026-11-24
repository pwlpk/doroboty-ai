/**
 * Shared request/response contract of the site assistant. Used by the chat widget before
 * sending and by the serverless function (api/chat.ts) before calling the model.
 * Keep imports relative and framework-free.
 */
import { z } from "zod";

export const MAX_QUESTION_LENGTH = 600;
export const MAX_HISTORY_MESSAGES = 12;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1, "Wpisz pytanie.")
    .max(MAX_QUESTION_LENGTH * 4, "Wiadomość jest za długa."),
});

export const chatRequestSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(MAX_HISTORY_MESSAGES),
  })
  .superRefine((value, ctx) => {
    const last = value.messages.at(-1);
    if (!last || last.role !== "user") {
      ctx.addIssue({ code: "custom", message: "Ostatnia wiadomość musi być pytaniem." });
      return;
    }
    if (last.content.length > MAX_QUESTION_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: `Pytanie może mieć najwyżej ${MAX_QUESTION_LENGTH} znaków.`,
      });
    }
    if (value.messages[0]?.role !== "user") {
      ctx.addIssue({ code: "custom", message: "Rozmowa musi zaczynać się od pytania." });
    }
  });

export const questionSchema = z
  .string()
  .trim()
  .min(1, "Wpisz pytanie.")
  .max(MAX_QUESTION_LENGTH, `Pytanie może mieć najwyżej ${MAX_QUESTION_LENGTH} znaków.`);

export const chatResponseSchema = z.object({ reply: z.string().min(1) });
export const chatErrorSchema = z.object({ error: z.string().min(1) });

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;

/** Keeps the most recent turns that fit the history limit and still start with a question. */
export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  const recent = messages.slice(-MAX_HISTORY_MESSAGES);
  const firstQuestion = recent.findIndex((message) => message.role === "user");
  return firstQuestion === -1 ? [] : recent.slice(firstQuestion);
}
