import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { petrolPumpsTable } from "./pumps";
import { ordersTable } from "./orders";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  pumpId: integer("pump_id").notNull().references(() => petrolPumpsTable.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
