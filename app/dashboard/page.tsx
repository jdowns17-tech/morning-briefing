import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommandCenter } from "@/components/CommandCenter";
import { SignOutButton } from "@/components/SignOutButton";
import { shiftDateString, todayDateString } from "@/lib/time";
import type { EmailCategory, EmailInsightView, PlannerTaskView } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  const userId = session?.user?.email;
  if (!userId) return null;

  const { date: requestedDate } = await searchParams;
  const date = requestedDate ?? todayDateString();

  const [insights, tasks] = await Promise.all([
    prisma.emailInsight.findMany({
      where: { userId },
      orderBy: { receivedAt: "desc" },
    }),
    prisma.scheduledTask.findMany({
      where: { userId, date },
      orderBy: { startMinutes: "asc" },
    }),
  ]);

  const insightViews: EmailInsightView[] = insights.map((insight) => ({
    id: insight.id,
    gmailId: insight.gmailId,
    subject: insight.subject,
    sender: insight.sender,
    snippet: insight.snippet,
    summary: insight.summary,
    category: insight.category as EmailCategory,
    isUrgent: insight.isUrgent,
    isNoise: insight.isNoise,
    actionItems: Array.isArray(insight.actionItems) ? (insight.actionItems as string[]) : [],
    receivedAtIso: insight.receivedAt.toISOString(),
  }));

  const taskViews: PlannerTaskView[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    startMinutes: task.startMinutes,
    endMinutes: task.endMinutes,
    notes: task.notes,
    sourceEmailId: task.sourceEmailId,
    completed: task.completed,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Morning Briefing</h1>
          <p className="text-sm text-slate-500">{userId}</p>
        </div>
        <SignOutButton />
      </div>

      <CommandCenter
        urgent={insightViews.filter((i) => i.isUrgent)}
        digest={insightViews.filter((i) => !i.isUrgent && !i.isNoise)}
        noise={insightViews.filter((i) => i.isNoise)}
        tasks={taskViews}
        date={date}
        prevDate={shiftDateString(date, -1)}
        nextDate={shiftDateString(date, 1)}
        isToday={date === todayDateString()}
        hasAnyInsights={insights.length > 0}
        sessionError={session?.error}
      />
    </main>
  );
}
