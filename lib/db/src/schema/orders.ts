import { pgTable, serial, integer, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { petrolPumpsTable } from "./pumps";
import { fuelTypeEnum } from "./fuel";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "rejected",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  pumpId: integer("pump_id").notNull().references(() => petrolPumpsTable.id),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  quantityLiters: numeric("quantity_liters", { precision: 10, scale: 2 }).notNull(),
  pricePerLiter: numeric("price_per_liter", { precision: 10, scale: 2 }).notNull(),
  deliveryCharges: numeric("delivery_charges", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLat: text("delivery_lat"),
  deliveryLng: text("delivery_lng"),
  notes: text("notes"),
  statusNotes: text("status_notes"),
  estimatedDelivery: text("estimated_delivery"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
