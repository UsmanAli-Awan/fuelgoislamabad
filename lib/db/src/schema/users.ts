import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["customer", "pump_owner", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  role: userRoleEnum("role").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  profilePicture: text("profile_picture"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
