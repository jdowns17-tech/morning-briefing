import { mapWithConcurrency } from "@/lib/concurrency";
import type { GmailMessageSummary } from "@/lib/types";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const NOISE_LABELS = new Set(["CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_FORUMS"]);

interface GmailHeader {
  name: string;
  value: string;
}

async function gmailFetch(accessToken: string, path: string) {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API error ${response.status}: ${body}`);
  }

  return response.json();
}

async function listMessageIds(accessToken: string, query: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ q: query, maxResults: "500" });
    if (pageToken) params.set("pageToken", pageToken);

    const page = await gmailFetch(accessToken, `/messages?${params.toString()}`);
    for (const message of page.messages ?? []) ids.push(message.id);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return ids;
}

function headerValue(headers: GmailHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

async function getMessageSummary(accessToken: string, id: string): Promise<GmailMessageSummary> {
  const params = new URLSearchParams({ format: "metadata" });
  params.append("metadataHeaders", "Subject");
  params.append("metadataHeaders", "From");

  const message = await gmailFetch(accessToken, `/messages/${id}?${params.toString()}`);
  const headers: GmailHeader[] = message.payload?.headers ?? [];

  return {
    id: message.id,
    threadId: message.threadId,
    subject: headerValue(headers, "Subject") || "(no subject)",
    sender: headerValue(headers, "From") || "(unknown sender)",
    receivedAt: new Date(Number(message.internalDate)).toISOString(),
    snippet: message.snippet ?? "",
    labelIds: message.labelIds ?? [],
  };
}

export function isNoiseLabelled(labelIds: string[]): boolean {
  return labelIds.some((label) => NOISE_LABELS.has(label));
}

export async function fetchRecentMessages(
  accessToken: string,
  options: { days?: number; excludeIds?: Set<string> } = {},
): Promise<GmailMessageSummary[]> {
  const { days = 30, excludeIds } = options;
  const allIds = await listMessageIds(accessToken, `newer_than:${days}d`);
  const idsToFetch = excludeIds ? allIds.filter((id) => !excludeIds.has(id)) : allIds;

  return mapWithConcurrency(idsToFetch, 10, (id) => getMessageSummary(accessToken, id));
}
