import { pgTable, serial, text, timestamp, integer, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const pumpStatusEnum = pgEnum("pump_status", ["pending", "approved", "rejected", "suspended"]);

export const petrolPumpsTable = pgTable("petrol_pumps", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  cnic: text("cnic"),
  licenseNumber: text("license_number"),
  businessRegNumber: text("business_reg_number"),
  address: text("address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  operatingHoursStart: text("operating_hours_start"),
  operatingHoursEnd: text("operating_hours_end"),
  deliveryRadius: numeric("delivery_radius", { precision: 10, scale: 2 }),
  deliveryCharges: numeric("delivery_charges", { precision: 10, scale: 2 }),
  description: text("description"),
  logoUrl: text("logo_url"),
  isOpen: boolean("is_open").notNull().default(true),
  status: pumpStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPumpSchema = createInsertSchema(petrolPumpsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPump = z.infer<typeof insertPumpSchema>;
export type PetrolPump = typeof petrolPumpsTable.$inferSelect;
