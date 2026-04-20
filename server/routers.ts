import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
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
      const profile = await db.getProfileByUserId(ctx.user.id.toString());
      return { ...ctx.user, profile };
    }),
    upsert: protectedProcedure.input(z.object({
      birthdate: z.string().optional(),
      location: z.string().optional(),
      profession: z.string().optional(),
      position: z.string().optional(),
      skills: z.any().optional(),
      interests: z.any().optional(),
      quote: z.string().optional(),
      websites: z.any().optional(),
      socials: z.any().optional(),
      coping: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertProfile(ctx.user.id.toString(), input);
      await logEvent({ userId: ctx.user.id.toString(), action: "profile_updated", metadata: input });
      return { success: true };
    }),
  }),

  // ─── Team ───
  team: router({
    list: protectedProcedure.query(async () => {
      return db.getAllUsers();
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
      parentId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createRoom(input.name, input.description ?? null, ctx.user.id, input.parentId);
      await logEvent({ userId: ctx.user.id.toString(), action: "room_created", entityType: "room", entityId: id.toString(), metadata: { name: input.name } });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      parentId: z.string().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateRoom(id, data);
      await logEvent({ userId: ctx.user.id.toString(), action: "room_updated", entityType: "room", entityId: id.toString(), metadata: data });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteRoom(input.id);
      await logEvent({ userId: ctx.user.id.toString(), action: "room_deleted", entityType: "room", entityId: input.id.toString() });
      return { success: true };
    }),
    search: protectedProcedure.input(z.object({ q: z.string() })).query(async ({ input }) => {
      return db.searchRooms(input.q);
    }),
  }),

  // ─── Glossary ───
  glossary: router({
    list: protectedProcedure.query(async () => {
      return db.getGlossary();
    }),
    add: protectedProcedure.input(z.object({
      name: z.string().max(128),
      definition: z.string().max(1000),
      attachments: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      await db.createGlossaryEntry({
        id,
        ...input,
        createdBy: ctx.user.id.toString(),
        createdAt: new Date(),
      });
      await logEvent({ userId: ctx.user.id.toString(), action: "glossary_added", metadata: { name: input.name } });
      return { id };
    }),
  }),

  // ─── Resources ───
  resources: router({
    list: protectedProcedure.query(async () => {
      return db.getResources();
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().max(128),
      url: z.string().url(),
      category: z.string().optional(),
      tags: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      await db.createResource({
        id,
        ...input,
        createdBy: ctx.user.id.toString(),
        createdAt: new Date(),
      });
      await logEvent({ userId: ctx.user.id.toString(), action: "resource_added", metadata: { name: input.name } });
      return { id };
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
      await db.deleteResource(input.id);
      return { success: true };
    }),
  }),

  // ─── Presence ───
  presence: router({
    counts: protectedProcedure.query(async () => {
      const users = await db.getAllUsers();
      return { total: users.length };
    }),
  }),
});
