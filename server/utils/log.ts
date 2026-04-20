import { getDb } from "../db";
import { activityLogs } from "../../drizzle/schema";
import { randomUUID } from "crypto";

export async function logEvent(input: {
  userId: number;
  roomId?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(activityLogs).values({
    id: randomUUID(),
    userId: input.userId,
    roomId: input.roomId ?? null,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: new Date(),
  });
}
