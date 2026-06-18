"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRecentMessages, isNoiseLabelled } from "@/lib/gmail";
import { classifyEmails } from "@/lib/classify";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  const userId = session?.user?.email;
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

async function requireGmailAccess(): Promise<{ userId: string; accessToken: string }> {
  const session = await getSession();
  const userId = session?.user?.email;
  if (!userId) throw new Error("Not authenticated.");
  if (!session?.accessToken) {
    throw new Error("Your Google session expired. Sign out and sign back in to keep syncing Gmail.");
  }
  return { userId, accessToken: session.accessToken };
}

export async function syncGmail(): Promise<{ synced: number }> {
  const { userId, accessToken } = await requireGmailAccess();

  const existing = await prisma.emailInsight.findMany({
    where: { userId },
    select: { gmailId: true },
  });
  const excludeIds = new Set(existing.map((row) => row.gmailId));

  const messages = await fetchRecentMessages(accessToken, { days: 30, excludeIds });
  if (messages.length === 0) {
    return { synced: 0 };
  }

  const messagesToClassify = messages.filter((m) => !isNoiseLabelled(m.labelIds));
  const classifications = await classifyEmails(messagesToClassify);
  const classificationById = new Map(classifications.map((c) => [c.id, c]));

  const rows = messages.map((message) => {
    if (isNoiseLabelled(message.labelIds)) {
      const category = message.labelIds.includes("CATEGORY_PROMOTIONS") ? "promotion" : "newsletter";
      return {
        userId,
        gmailId: message.id,
        threadId: message.threadId,
        subject: message.subject,
        sender: message.sender,
        receivedAt: new Date(message.receivedAt),
        snippet: message.snippet,
        category,
        isUrgent: false,
        isNoise: true,
        summary: message.subject,
        actionItems: [] as string[],
      };
    }

    const classification = classificationById.get(message.id);
    const category = classification?.category ?? "other";
    const isNoise = category === "newsletter" || category === "promotion";

    return {
      userId,
      gmailId: message.id,
      threadId: message.threadId,
      subject: message.subject,
      sender: message.sender,
      receivedAt: new Date(message.receivedAt),
      snippet: message.snippet,
      category,
      isUrgent: classification?.isUrgent ?? false,
      isNoise,
      summary: classification?.summary ?? message.subject,
      actionItems: classification?.actionItems ?? [],
    };
  });

  await prisma.$transaction(
    rows.map((row) =>
      prisma.emailInsight.upsert({
        where: { userId_gmailId: { userId: row.userId, gmailId: row.gmailId } },
        create: row,
        update: row,
      }),
    ),
  );

  revalidatePath("/dashboard");
  return { synced: rows.length };
}

export async function createTask(input: {
  date: string;
  startMinutes: number;
  endMinutes: number;
  title: string;
  notes?: string | null;
  sourceEmailId?: string;
}): Promise<void> {
  const userId = await requireUserId();

  await prisma.scheduledTask.create({
    data: {
      userId,
      date: input.date,
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
      title: input.title,
      notes: input.notes || null,
      sourceEmailId: input.sourceEmailId,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateTask(
  id: string,
  input: Partial<{
    startMinutes: number;
    endMinutes: number;
    title: string;
    notes: string | null;
    completed: boolean;
  }>,
): Promise<void> {
  const userId = await requireUserId();

  await prisma.scheduledTask.updateMany({
    where: { id, userId },
    data: input,
  });

  revalidatePath("/dashboard");
}

export async function deleteTask(id: string): Promise<void> {
  const userId = await requireUserId();

  await prisma.scheduledTask.deleteMany({
    where: { id, userId },
  });

  revalidatePath("/dashboard");
}
