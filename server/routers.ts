import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ───
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    update: protectedProcedure.input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      timezone: z.string().optional(),
      avatarUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
  }),

  // ─── Rooms ───
  rooms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserRooms(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createRoom(input.name, input.description ?? null, ctx.user.id);
      await db.logActivity(id, ctx.user.id, "room_created", "room", id, `Created room "${input.name}"`);
      return { id };
    }),
    members: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomMembers(input.roomId);
    }),
    join: protectedProcedure.input(z.object({ roomId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.joinRoom(input.roomId, ctx.user.id);
      await db.logActivity(input.roomId, ctx.user.id, "user_joined", "room", input.roomId);
      return { success: true };
    }),
  }),

  // ─── Messages ───
  messages: router({
    list: protectedProcedure.input(z.object({
      roomId: z.number(),
      limit: z.number().optional(),
      beforeId: z.number().optional(),
    })).query(async ({ input }) => {
      return db.getRoomMessages(input.roomId, input.limit ?? 50, input.beforeId);
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      content: z.string().min(1),
      parentId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createMessage(input.roomId, ctx.user.id, input.content, input.parentId);
      await db.logActivity(input.roomId, ctx.user.id, "message_sent", "message", id);
      return { id };
    }),
    react: protectedProcedure.input(z.object({
      messageId: z.number(),
      emoji: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.addReaction(input.messageId, ctx.user.id, input.emoji);
      return { result };
    }),
    reactions: protectedProcedure.input(z.object({ messageId: z.number() })).query(async ({ input }) => {
      return db.getMessageReactions(input.messageId);
    }),
  }),

  // ─── Memory Bank ───
  memory: router({
    list: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomMemoryFiles(input.roomId);
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      title: z.string().min(1),
      content: z.string().optional(),
      tags: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createMemoryFile(input.roomId, ctx.user.id, input.title, input.content ?? "", input.tags ?? "");
      await db.logActivity(input.roomId, ctx.user.id, "memory_created", "memory", id, input.title);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      tags: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.updateMemoryFile(input.id, input);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteMemoryFile(input.id);
      return { success: true };
    }),
  }),

  // ─── Tasks ───
  tasks: router({
    list: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomTasks(input.roomId);
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      assigneeId: z.number().optional(),
      dueDate: z.date().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createTask(input.roomId, ctx.user.id, input);
      await db.logActivity(input.roomId, ctx.user.id, "task_created", "task", id, input.title);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["todo", "in_progress", "done"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      assigneeId: z.number().nullable().optional(),
      dueDate: z.date().nullable().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTask(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTask(input.id);
      return { success: true };
    }),
  }),

  // ─── Calendar ───
  calendar: router({
    list: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomCalendarEvents(input.roomId);
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      startTime: z.date(),
      endTime: z.date().optional(),
      allDay: z.boolean().optional(),
      taskId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createCalendarEvent(input.roomId, ctx.user.id, input);
      await db.logActivity(input.roomId, ctx.user.id, "event_created", "calendar", id, input.title);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      startTime: z.date().optional(),
      endTime: z.date().nullable().optional(),
      allDay: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCalendarEvent(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCalendarEvent(input.id);
      return { success: true };
    }),
  }),

  // ─── Files ───
  files: router({
    listFolders: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomFolders(input.roomId);
    }),
    createFolder: protectedProcedure.input(z.object({
      roomId: z.number(),
      name: z.string().min(1),
      parentId: z.number().optional(),
      color: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createFolder(input.roomId, ctx.user.id, input.name, input.parentId, input.color);
      await db.logActivity(input.roomId, ctx.user.id, "folder_created", "folder", id, input.name);
      return { id };
    }),
    updateFolder: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      color: z.string().optional(),
      archived: z.boolean().optional(),
      parentId: z.number().nullable().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateFolder(id, data);
      return { success: true };
    }),
    deleteFolder: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteFolder(input.id);
      return { success: true };
    }),
    listFiles: protectedProcedure.input(z.object({
      roomId: z.number(),
      folderId: z.number().optional(),
    })).query(async ({ input }) => {
      return db.getRoomFiles(input.roomId, input.folderId);
    }),
    upload: protectedProcedure.input(z.object({
      roomId: z.number(),
      name: z.string(),
      base64: z.string(),
      mimeType: z.string().optional(),
      size: z.number().optional(),
      folderId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const fileKey = `rooms/${input.roomId}/files/${Date.now()}-${input.name}`;
      const { url, key } = await storagePut(fileKey, buffer, input.mimeType ?? "application/octet-stream");
      const id = await db.createFile(input.roomId, ctx.user.id, {
        name: input.name, url, fileKey: key,
        mimeType: input.mimeType, size: input.size, folderId: input.folderId,
      });
      await db.logActivity(input.roomId, ctx.user.id, "file_uploaded", "file", id, input.name);
      return { id, url };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteFile(input.id);
      return { success: true };
    }),
  }),

  // ─── Mindmap ───
  mindmap: router({
    listNodes: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomMindmapNodes(input.roomId);
    }),
    createNode: protectedProcedure.input(z.object({
      roomId: z.number(),
      label: z.string().optional(),
      content: z.string().optional(),
      nodeType: z.enum(["text", "image", "link", "document"]).optional(),
      posX: z.number(),
      posY: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createMindmapNode(input.roomId, ctx.user.id, input);
      return { id };
    }),
    updateNode: protectedProcedure.input(z.object({
      id: z.number(),
      label: z.string().optional(),
      content: z.string().optional(),
      posX: z.number().optional(),
      posY: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateMindmapNode(id, data);
      return { success: true };
    }),
    deleteNode: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteMindmapNode(input.id);
      return { success: true };
    }),
    listEdges: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomMindmapEdges(input.roomId);
    }),
    createEdge: protectedProcedure.input(z.object({
      roomId: z.number(),
      sourceId: z.number(),
      targetId: z.number(),
      label: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createMindmapEdge(input.roomId, input.sourceId, input.targetId, input.label);
      return { id };
    }),
    deleteEdge: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteMindmapEdge(input.id);
      return { success: true };
    }),
  }),

  // ─── Signatures ───
  signatures: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSignatures(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      imageBase64: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const fileKey = `signatures/${ctx.user.id}/${Date.now()}-${input.name}.png`;
      const { url, key } = await storagePut(fileKey, buffer, "image/png");
      const id = await db.createSignature(ctx.user.id, input.name, url, key);
      return { id, url };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteSignature(input.id);
      return { success: true };
    }),
    signDocument: protectedProcedure.input(z.object({
      roomId: z.number(),
      signatureId: z.number(),
      fileId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createSignedDocument(input.roomId, ctx.user.id, input.signatureId, input.fileId);
      await db.logActivity(input.roomId, ctx.user.id, "document_signed", "signature", id);
      return { id };
    }),
    listSigned: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomSignedDocuments(input.roomId);
    }),
  }),

  // ─── Notebooks ───
  notebooks: router({
    list: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomNotebooks(input.roomId);
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      title: z.string().min(1),
      content: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createNotebook(input.roomId, ctx.user.id, input.title, input.content);
      await db.logActivity(input.roomId, ctx.user.id, "notebook_created", "notebook", id, input.title);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNotebook(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteNotebook(input.id);
      return { success: true };
    }),
  }),

  // ─── Activity Log ───
  activityLog: router({
    list: protectedProcedure.input(z.object({
      roomId: z.number(),
      limit: z.number().optional(),
    })).query(async ({ input }) => {
      return db.getRoomActivityLogs(input.roomId, input.limit ?? 100);
    }),
  }),

  // ─── AI Translation ───
  ai: router({
    translate: protectedProcedure.input(z.object({
      text: z.string().min(1),
      mode: z.enum(["dev_to_casual", "casual_to_dev", "ja_to_en", "en_to_ja"]),
    })).mutation(async ({ input }) => {
      const prompts: Record<string, string> = {
        dev_to_casual: "You are a translator. Convert the following technical developer jargon into simple, casual everyday language that a non-technical person can understand. Keep the meaning intact but make it friendly and approachable. Return ONLY the translated text, nothing else.",
        casual_to_dev: "You are a translator. Convert the following casual language into precise, developer-centric technical language. Include proper technical terminology, clear acceptance criteria, and structured requirements where applicable. Return ONLY the translated text, nothing else.",
        ja_to_en: "You are a translator. Translate the following Japanese text into natural English. Return ONLY the translated text, nothing else.",
        en_to_ja: "You are a translator. Translate the following English text into natural Japanese. Return ONLY the translated text, nothing else.",
      };
      const result = await invokeLLM({
        messages: [
          { role: "system", content: prompts[input.mode] },
          { role: "user", content: input.text },
        ],
      });
      const translated = typeof result.choices[0]?.message?.content === "string"
        ? result.choices[0].message.content
        : "";
      return { translated };
    }),
  }),
});

export type AppRouter = typeof appRouter;
