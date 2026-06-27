import { Router } from "express";
import { db, fuelPricesTable, petrolPumpsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

function buildFuelPriceResponse(fp: typeof fuelPricesTable.$inferSelect) {
  return {
    id: fp.id,
    pumpId: fp.pumpId,
    fuelType: fp.fuelType,
    pricePerLiter: parseFloat(fp.pricePerLiter),
    isAvailable: fp.isAvailable,
    updatedAt: fp.updatedAt.toISOString(),
  };
}

router.get("/pumps/:pumpId/fuel", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.pumpId) ? req.params.pumpId[0] : req.params.pumpId;
  const pumpId = parseInt(rawId, 10);
  if (isNaN(pumpId)) {
    res.status(400).json({ error: "Invalid pump ID" });
    return;
  }

  const prices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pumpId));
  res.json(prices.map(buildFuelPriceResponse));
});

router.put("/pumps/:pumpId/fuel", requireRole("pump_owner"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.pumpId) ? req.params.pumpId[0] : req.params.pumpId;
  const pumpId = parseInt(rawId, 10);
  const userId = req.user!.userId;

  if (isNaN(pumpId)) {
    res.status(400).json({ error: "Invalid pump ID" });
    return;
  }

  const [pump] = await db.select().from(petrolPumpsTable).where(
    and(eq(petrolPumpsTable.id, pumpId), eq(petrolPumpsTable.ownerId, userId))
  );

  if (!pump) {
    res.status(403).json({ error: "Forbidden: not your pump" });
    return;
  }

  const { prices } = req.body;
  if (!Array.isArray(prices)) {
    res.status(400).json({ error: "prices must be an array" });
    return;
  }

  const results: typeof fuelPricesTable.$inferSelect[] = [];

  for (const p of prices) {
    const { fuelType, pricePerLiter, isAvailable } = p;

    const [existing] = await db.select().from(fuelPricesTable).where(
      and(eq(fuelPricesTable.pumpId, pumpId), eq(fuelPricesTable.fuelType, fuelType))
    );

    if (existing) {
      const [updated] = await db.update(fuelPricesTable)
        .set({ pricePerLiter: String(pricePerLiter), isAvailable })
        .where(eq(fuelPricesTable.id, existing.id))
        .returning();
      results.push(updated);
    } else {
      const [inserted] = await db.insert(fuelPricesTable).values({
        pumpId,
        fuelType,
        pricePerLiter: String(pricePerLiter),
        isAvailable,
      }).returning();
      results.push(inserted);
    }
  }

  res.json(results.map(buildFuelPriceResponse));
});

export default router;
