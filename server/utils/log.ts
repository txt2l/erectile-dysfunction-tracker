import { getDb } from "../db";
import { activityLogs } from "../../drizzle/schema";
import { randomUUID } from "crypto";

export async function logEvent(input: {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(activityLogs).values({
      id: randomUUID(),
      userId: input.userId,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to log event:", error);
  }
}
