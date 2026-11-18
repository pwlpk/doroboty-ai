import { z } from "zod";
import raw from "./scenario.json" with { type: "json" };

// Prepared scenario for the I2 + I5 scope-review test (E4). Summaries are
// hand-written stand-ins for AI output (Wizard of Oz); nothing is generated live.
const summaryItem = z.object({
  text: z.string().min(1).max(400),
  quote: z.string().min(1).max(400).optional(),
  source: z.enum(["raw", "portfolio"]).optional(),
});
const applicationSchema = z.object({
  id: z.string().regex(/^scope-[a-z]$/),
  sourceApplicationId: z.string().min(1),
  candidateName: z.string().min(1).max(200),
  headline: z.string().min(1).max(200),
  seniority: z.enum(["junior", "mid", "senior", "lead"]),
  score: z.number().int().min(0).max(100),
  assistantAnswer: z.string().min(20),
  answerWithScope: z.string().min(20),
  originalAnswer: z.string().min(20),
  portfolio: z.string(),
  summary: z.object({
    own: z.array(summaryItem).min(1),
    others: z.array(summaryItem),
    unknown: z.array(summaryItem),
  }),
  // Known only to the moderator: the historical decision after the first conversation.
  outcome: z.object({
    decision: z.enum(["continue", "reject"]),
    scopeClass: z.enum(["własny", "ograniczona"]),
  }),
});
export const scenarioSchema = z
  .object({
    jobId: z.string().min(1),
    sourcePublicationId: z.string().min(1),
    sourceNote: z.string(),
    applications: z.array(applicationSchema).length(6),
  })
  .superRefine((s, ctx) => {
    for (const a of s.applications)
      for (const item of [...a.summary.own, ...a.summary.others, ...a.summary.unknown]) {
        if (!item.quote) continue;
        const source = item.source === "portfolio" ? a.portfolio : a.originalAnswer;
        if (!source.includes(item.quote))
          ctx.addIssue({ code: "custom", message: `Quote not verbatim in ${a.id}: ${item.quote}` });
      }
  });

export type ScopeApplication = z.infer<typeof applicationSchema>;
export type SummaryItem = z.infer<typeof summaryItem>;
export const scenario = scenarioSchema.parse(raw);

export const variants = ["obecna", "i2", "i2-i5"] as const;
export type Variant = (typeof variants)[number];
export const variantLabels: Record<Variant, string> = {
  obecna: "Obecna lista",
  i2: "I2: zdanie o zakresie",
  "i2-i5": "I2 + I5: z podsumowaniem",
};
export function parseVariant(value: string | null): Variant {
  return variants.includes(value as Variant) ? (value as Variant) : "i2-i5";
}
export const INVITE_LIMIT = 2;

export function scoreSelection(selected: string[]) {
  const hits = selected.filter(
    (id) => scenario.applications.find((a) => a.id === id)?.outcome.decision === "continue",
  ).length;
  return { hits, total: selected.length };
}
