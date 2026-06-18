import Anthropic from "@anthropic-ai/sdk";
import { mapWithConcurrency } from "@/lib/concurrency";
import type { EmailClassification, GmailMessageSummary } from "@/lib/types";

const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 20;
const BATCH_CONCURRENCY = 5;

let client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "classify_emails",
  description: "Classify a batch of emails for a job-seeker's daily briefing dashboard.",
  input_schema: {
    type: "object",
    properties: {
      classifications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The message id, copied verbatim from the input.",
            },
            category: {
              type: "string",
              enum: [
                "interview",
                "recruiter",
                "action_needed",
                "fyi",
                "newsletter",
                "promotion",
                "other",
              ],
            },
            isUrgent: {
              type: "boolean",
              description:
                "true only for emails about a specific interview (scheduling/confirming/rescheduling) or direct recruiter outreach about a real role.",
            },
            summary: {
              type: "string",
              description: "One sentence, plain-language summary of the email.",
            },
            actionItems: {
              type: "array",
              items: { type: "string" },
              description:
                "Concrete next steps the recipient should take. Empty array if there's nothing to do.",
            },
          },
          required: ["id", "category", "isUrgent", "summary", "actionItems"],
        },
      },
    },
    required: ["classifications"],
  },
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function classifyBatch(messages: GmailMessageSummary[]): Promise<EmailClassification[]> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      "You triage email for a job seeker's daily briefing dashboard. " +
      "Mark isUrgent=true ONLY for emails about a specific interview (scheduling, confirming, rescheduling) " +
      "or direct recruiter outreach about a real role. Generic newsletters, marketing, and automated digests are " +
      "'newsletter' or 'promotion'. Receipts/confirmations with nothing to act on are 'fyi'. Anything needing a " +
      "reply or action that isn't urgent is 'action_needed'. Use 'other' only when nothing else fits.",
    messages: [
      {
        role: "user",
        content: JSON.stringify(
          messages.map((m) => ({
            id: m.id,
            from: m.sender,
            subject: m.subject,
            snippet: m.snippet,
            date: m.receivedAt,
          })),
        ),
      },
    ],
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classify_emails" },
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) return [];

  const input = toolUse.input as { classifications: EmailClassification[] };
  return input.classifications;
}

export async function classifyEmails(
  messages: GmailMessageSummary[],
): Promise<EmailClassification[]> {
  if (messages.length === 0) return [];

  const batches = chunk(messages, BATCH_SIZE);
  const results = await mapWithConcurrency(batches, BATCH_CONCURRENCY, classifyBatch);
  return results.flat();
}
