export type EmailCategory =
  | "interview"
  | "recruiter"
  | "action_needed"
  | "fyi"
  | "newsletter"
  | "promotion"
  | "other";

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  snippet: string;
  labelIds: string[];
}

export interface EmailClassification {
  id: string;
  category: EmailCategory;
  isUrgent: boolean;
  summary: string;
  actionItems: string[];
}

export interface EmailInsightView {
  id: string;
  gmailId: string;
  subject: string;
  sender: string;
  snippet: string;
  summary: string;
  category: EmailCategory;
  isUrgent: boolean;
  isNoise: boolean;
  actionItems: string[];
  receivedAtIso: string;
}

export interface PlannerTaskView {
  id: string;
  title: string;
  startMinutes: number;
  endMinutes: number;
  notes: string | null;
  sourceEmailId: string | null;
  completed: boolean;
}

export interface TaskDraft {
  id?: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  title: string;
  notes?: string;
  sourceEmailId?: string;
}
