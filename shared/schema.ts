import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"),
  processingLogs: json("processing_logs").$type<string[]>().default([]),
  originalPath: text("original_path").notNull(),
  processedPath: text("processed_path"),
  error: text("error"),
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  filename: true,
  originalPath: true,
});

export const processingStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "error"
]);

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type ProcessingStatus = z.infer<typeof processingStatusSchema>;
