import { eq, and, desc, asc, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  rooms, roomMembers, messages, reactions,
  memoryFiles, tasks, calendarEvents,
  folders, files, mindmapNodes, mindmapEdges,
  signatures, signedDocuments, notebooks, activityLogs,
  profiles, glossary, connectors, resources
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "location"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    avatarUrl: users.avatarUrl,
    location: users.location
  }).from(users);
}

export async function updateUserProfile(userId: number, data: { name?: string; bio?: string; timezone?: string; avatarUrl?: string; location?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data }).where(eq(users.id, userId));
}

// ─── Profiles ───
export async function getProfileByUserId(userId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertProfile(userId: string, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(profiles).values({ userId, ...data }).onDuplicateKeyUpdate({ set: data });
}

// ─── Rooms ───
export async function createRoom(name: string, description: string | null, createdBy: number, parentId?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(rooms).values({ name, description, createdBy, parentId: parentId ?? null }).$returningId();
  await db.insert(roomMembers).values({ roomId: result.id, userId: createdBy, role: "owner" });
  return result.id;
}

export async function updateRoom(id: number, data: { name?: string; description?: string; parentId?: string | null }) {
  const db = await getDb();
  if (!db) return;
  await db.update(rooms).set(data).where(eq(rooms.id, id));
}

export async function deleteRoom(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rooms).where(eq(rooms.id, id));
}

export async function searchRooms(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rooms).where(like(rooms.name, `%${query}%`));
}

export async function getUserRooms(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ room: rooms, membership: roomMembers })
    .from(roomMembers)
    .innerJoin(rooms, eq(roomMembers.roomId, rooms.id))
    .where(eq(roomMembers.userId, userId))
    .orderBy(desc(rooms.updatedAt));
  return result.map(r => ({ ...r.room, memberRole: r.membership.role }));
}

export async function getRoomMembers(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ member: roomMembers, user: users })
    .from(roomMembers)
    .innerJoin(users, eq(roomMembers.userId, users.id))
    .where(eq(roomMembers.roomId, roomId));
  return result.map(r => ({ ...r.user, memberRole: r.member.role }));
}

export async function joinRoom(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))).limit(1);
  if (existing.length === 0) {
    await db.insert(roomMembers).values({ roomId, userId, role: "collaborator" });
  }
}

// ─── Messages ───
export async function createMessage(roomId: number, userId: number, content: string, parentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(messages).values({ roomId, userId, content, parentId: parentId ?? null }).$returningId();
  return result.id;
}

export async function getRoomMessages(roomId: number, limit = 50, beforeId?: number) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select({ message: messages, user: users })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(beforeId ? and(eq(messages.roomId, roomId), sql`${messages.id} < ${beforeId}`) : eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  const result = await query;
  return result.map(r => ({
    ...r.message,
    userName: r.user.name,
    userAvatar: r.user.avatarUrl,
  })).reverse();
}

export async function addReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(reactions).where(and(eq(reactions.messageId, messageId), eq(reactions.userId, userId), eq(reactions.emoji, emoji))).limit(1);
  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    return "removed";
  }
  await db.insert(reactions).values({ messageId, userId, emoji });
  return "added";
}

export async function getMessageReactions(messageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reactions).where(eq(reactions.messageId, messageId));
}

// ─── Memory Bank ───
export async function createMemoryFile(roomId: number, userId: number, title: string, content: string, tags: string, metadata?: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(memoryFiles).values({ roomId, userId, title, content, tags, metadata: metadata ? JSON.stringify(metadata) : null }).$returningId();
  return result.id;
}

export async function getRoomMemoryFiles(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memoryFiles).where(eq(memoryFiles.roomId, roomId)).orderBy(desc(memoryFiles.updatedAt));
}

export async function updateMemoryFile(id: number, data: { title?: string; content?: string; tags?: string; metadata?: any }) {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { ...data };
  if (data.metadata) updateData.metadata = JSON.stringify(data.metadata);
  await db.update(memoryFiles).set(updateData).where(eq(memoryFiles.id, id));
}

export async function deleteMemoryFile(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(memoryFiles).where(eq(memoryFiles.id, id));
}

// ─── Tasks ───
export async function createTask(roomId: number, createdBy: number, data: { title: string; description?: string; priority?: string; assigneeId?: number; dueDate?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(${tasks.sortOrder}), 0)` }).from(tasks).where(eq(tasks.roomId, roomId));
  const [result] = await db.insert(tasks).values({
    roomId, createdBy, title: data.title, description: data.description ?? null,
    priority: (data.priority as any) ?? "medium", assigneeId: data.assigneeId ?? null,
    dueDate: data.dueDate ?? null, sortOrder: (maxOrder[0]?.max ?? 0) + 1,
  }).$returningId();
  return result.id;
}

export async function getRoomTasks(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.roomId, roomId)).orderBy(asc(tasks.sortOrder));
}

export async function updateTask(id: number, data: { title?: string; description?: string; status?: string; priority?: string; assigneeId?: number | null; dueDate?: Date | null; sortOrder?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data as any).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Glossary ───
export async function getGlossary() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(glossary).orderBy(asc(glossary.name));
}

export async function createGlossaryEntry(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(glossary).values(data);
}

// ─── Resources ───
export async function getResources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resources).orderBy(asc(resources.name));
}

export async function createResource(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(resources).values(data);
}

export async function updateResource(id: string, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(resources).set(data).where(eq(resources.id, id));
}

export async function deleteResource(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(resources).where(eq(resources.id, id));
}
