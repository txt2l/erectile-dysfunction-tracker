import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";
import { logEvent } from "./utils/log";
import { randomUUID } from "crypto";

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
      const profile = await db.getProfileByUserId(ctx.user.id);
      return { ...ctx.user, profile };
    }),
    update: protectedProcedure.input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      timezone: z.string().optional(),
      avatarUrl: z.string().optional(),
      location: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      await logEvent({ userId: ctx.user.id, action: "profile_updated", metadata: input });
      return { success: true };
    }),
    upsert: protectedProcedure.input(z.object({
      birthdate: z.string().optional(),
      profession: z.string().optional(),
      position: z.string().optional(),
      skills: z.string().optional(),
      interests: z.string().optional(),
      quote: z.string().optional(),
      websites: z.string().optional(),
      socials: z.string().optional(),
      coping: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertProfile(ctx.user.id, input);
      await logEvent({ userId: ctx.user.id, action: "profile_details_updated" });
      return { success: true };
    }),
  }),

  // ─── Team ───
  team: router({
    list: protectedProcedure.query(async () => {
      return db.getAllUsers();
    }),
    getProfile: protectedProcedure.input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getProfileByUserId(input.userId);
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
      parentId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createRoom(input.name, input.description ?? null, ctx.user.id, input.parentId);
      await logEvent({ userId: ctx.user.id, roomId: id, action: "room_created", entityType: "room", entityId: id, metadata: { name: input.name } });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      parentId: z.number().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateRoom(id, data);
      await logEvent({ userId: ctx.user.id, roomId: id, action: "room_updated", entityType: "room", entityId: id, metadata: data });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteRoom(input.id);
      await logEvent({ userId: ctx.user.id, action: "room_deleted", entityType: "room", entityId: input.id });
      return { success: true };
    }),
    search: protectedProcedure.input(z.object({ q: z.string() })).query(async ({ input }) => {
      return db.searchRooms(input.q);
    }),
    members: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomMembers(input.roomId);
    }),
    join: protectedProcedure.input(z.object({ roomId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.joinRoom(input.roomId, ctx.user.id);
      await logEvent({ userId: ctx.user.id, roomId: input.roomId, action: "user_joined", entityType: "room", entityId: input.roomId });
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
      await logEvent({ userId: ctx.user.id, roomId: input.roomId, action: "message_sent", entityType: "message", entityId: id });
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
      metadata: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createMemoryFile(input.roomId, ctx.user.id, input.title, input.content ?? "", input.tags ?? "", input.metadata);
      await logEvent({ userId: ctx.user.id, roomId: input.roomId, action: "memory_created", entityType: "memory", entityId: id, metadata: { title: input.title } });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      tags: z.string().optional(),
      metadata: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateMemoryFile(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
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
      await logEvent({ userId: ctx.user.id, roomId: input.roomId, action: "task_created", entityType: "task", entityId: id, metadata: { title: input.title } });
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
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateTask(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteTask(input.id);
      return { success: true };
    }),
  }),

  // ─── Glossary ───
  glossary: router({
    list: protectedProcedure.query(async () => {
      return db.getGlossary();
    }),
    add: protectedProcedure.input(z.object({
      name: z.string(),
      definition: z.string().max(1000),
      attachments: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      await db.createGlossaryEntry({
        id,
        ...input,
        attachments: input.attachments ? JSON.stringify(input.attachments) : null,
        createdBy: ctx.user.id,
        createdAt: new Date(),
      });
      await logEvent({ userId: ctx.user.id, action: "glossary_added", metadata: { name: input.name } });
      return { id };
    }),
  }),

  // ─── Resources ───
  resources: router({
    list: protectedProcedure.input(z.object({ roomId: z.number() })).query(async ({ input }) => {
      return db.getRoomResources(input.roomId);
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      title: z.string().min(1),
      url: z.string().url(),
      category: z.string().optional(),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createResource(input.roomId, ctx.user.id, {
        title: input.title,
        url: input.url,
        category: input.category ?? "general",
        description: input.description,
      });
      await logEvent({ userId: ctx.user.id, roomId: input.roomId, action: "resource_added", metadata: { title: input.title } });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      url: z.string().url().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateResource(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteResource(input.id);
      return { success: true };
    }),
  }),
});
