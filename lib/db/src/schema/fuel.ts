import { pgTable, serial, integer, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { petrolPumpsTable } from "./pumps";

export const fuelTypeEnum = pgEnum("fuel_type", ["petrol", "diesel", "hi_octane"]);

export const fuelPricesTable = pgTable("fuel_prices", {
  id: serial("id").primaryKey(),
  pumpId: integer("pump_id").notNull().references(() => petrolPumpsTable.id, { onDelete: "cascade" }),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  pricePerLiter: numeric("price_per_liter", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFuelPriceSchema = createInsertSchema(fuelPricesTable).omit({ id: true, updatedAt: true });
export type InsertFuelPrice = z.infer<typeof insertFuelPriceSchema>;
export type FuelPrice = typeof fuelPricesTable.$inferSelect;
