import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, date } from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  location: varchar("location", { length: 128 }), // Updated to match PDF (country/city)
  timezone: varchar("timezone", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Profiles ───
export const profiles = mysqlTable("profiles", {
  userId: varchar("user_id", { length: 36 }).primaryKey(), // PDF: userId is PK, varchar(36)
  birthdate: date("birthdate"), // PDF: date type
  location: varchar("location", { length: 128 }), // PDF: varchar(128)
  profession: varchar("profession", { length: 128 }), // PDF: varchar(128)
  position: varchar("position", { length: 128 }), // PDF: varchar(128)
  skills: json("skills"), // PDF: json type
  interests: json("interests"), // PDF: json type
  quote: varchar("quote", { length: 255 }), // PDF: varchar(255)
  websites: json("websites"), // PDF: json type
  socials: json("socials"), // PDF: json type
  coping: text("coping"), // PDF: text type
});

// ─── Rooms ───
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  parentId: varchar("parent_id", { length: 36 }), // PDF: parentId varchar(36)
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const roomMembers = mysqlTable("room_members", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("memberRole", ["owner", "collaborator", "viewer"]).default("collaborator").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// ─── Chat Messages ───
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reactions = mysqlTable("reactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  emoji: varchar("emoji", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Memory Bank ───
export const memoryFiles = mysqlTable("memory_files", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  tags: text("tags"),
  metadata: json("metadata"), // PDF: json type
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Tasks ───
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "done"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assigneeId: int("assigneeId"),
  dueDate: timestamp("dueDate"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Calendar Events ───
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  allDay: boolean("allDay").default(false).notNull(),
  taskId: int("taskId"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Files ───
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  parentId: int("parentId"),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 32 }),
  archived: boolean("archived").default(false).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  folderId: int("folderId"),
  name: varchar("name", { length: 500 }).notNull(),
  url: text("url").notNull(),
  fileKey: text("fileKey").notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  size: int("size"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Mindmap ───
export const mindmapNodes = mysqlTable("mindmap_nodes", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  label: varchar("label", { length: 500 }),
  content: text("content"),
  nodeType: mysqlEnum("nodeType", ["text", "image", "link", "document"]).default("text").notNull(),
  posX: int("posX").default(0).notNull(),
  posY: int("posY").default(0).notNull(),
  width: int("width").default(200).notNull(),
  height: int("height").default(100).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mindmapEdges = mysqlTable("mindmap_edges", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  sourceId: int("sourceId").notNull(),
  targetId: int("targetId").notNull(),
  label: varchar("label", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Signatures ───
export const signatures = mysqlTable("signatures", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const signedDocuments = mysqlTable("signed_documents", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  fileId: int("fileId"),
  signatureId: int("signatureId").notNull(),
  userId: int("userId").notNull(),
  signedUrl: text("signedUrl"),
  signedKey: text("signedKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Notebook ───
export const notebooks = mysqlTable("notebooks", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Activity Log ───
export const activityLogs = mysqlTable("activity_logs", {
  id: varchar("id", { length: 36 }).primaryKey(), // PDF: varchar(36)
  userId: varchar("user_id", { length: 36 }).notNull(), // PDF: user_id varchar(36)
  action: varchar("action", { length: 64 }).notNull(), // PDF: varchar(64)
  entityType: varchar("entity_type", { length: 64 }), // PDF: entity_type varchar(64)
  entityId: varchar("entity_id", { length: 36 }), // PDF: entity_id varchar(36)
  metadata: json("metadata"), // PDF: json type
  createdAt: timestamp("created_at").defaultNow().notNull(), // PDF: created_at
});

// ─── Glossary ───
export const glossary = mysqlTable("glossary", {
  id: varchar("id", { length: 36 }).primaryKey(), // PDF: varchar(36)
  name: varchar("name", { length: 128 }).notNull(), // PDF: varchar(128)
  definition: varchar("definition", { length: 1000 }).notNull(), // PDF: varchar(1000)
  attachments: json("attachments"), // PDF: json type
  createdBy: varchar("created_by", { length: 36 }).notNull(), // PDF: varchar(36)
  createdAt: timestamp("created_at").defaultNow().notNull(), // PDF: created_at
});

// ─── Connectors ───
export const connectors = mysqlTable("connectors", {
  id: varchar("id", { length: 36 }).primaryKey(), // PDF: varchar(36)
  userId: varchar("user_id", { length: 36 }).notNull(), // PDF: varchar(36)
  type: varchar("type", { length: 64 }).notNull(), // PDF: varchar(64)
  config: json("config"), // PDF: json type
  createdAt: timestamp("created_at").defaultNow().notNull(), // PDF: created_at
});

// ─── Resources ───
export const resources = mysqlTable("resources", {
  id: varchar("id", { length: 36 }).primaryKey(), // PDF: varchar(36)
  name: varchar("name", { length: 128 }).notNull(), // PDF: varchar(128)
  url: text("url").notNull(), // PDF: text type
  category: varchar("category", { length: 64 }), // PDF: varchar(64)
  tags: json("tags"), // PDF: json type
  createdBy: varchar("created_by", { length: 36 }).notNull(), // PDF: varchar(36)
  createdAt: timestamp("created_at").defaultNow().notNull(), // PDF: created_at
});
