import { Router } from "express";
import { db, usersTable, petrolPumpsTable, favoritesTable, fuelPricesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireRole } from "../middlewares/auth";

const router = Router();

function buildPumpResponse(pump: typeof petrolPumpsTable.$inferSelect, fuelPrices: typeof fuelPricesTable.$inferSelect[]) {
  return {
    id: pump.id,
    ownerId: pump.ownerId,
    businessName: pump.businessName,
    ownerName: pump.ownerName,
    phone: pump.phone,
    email: pump.email,
    address: pump.address,
    latitude: pump.latitude ? parseFloat(pump.latitude) : null,
    longitude: pump.longitude ? parseFloat(pump.longitude) : null,
    operatingHoursStart: pump.operatingHoursStart,
    operatingHoursEnd: pump.operatingHoursEnd,
    deliveryRadius: pump.deliveryRadius ? parseFloat(pump.deliveryRadius) : null,
    deliveryCharges: pump.deliveryCharges ? parseFloat(pump.deliveryCharges) : null,
    description: pump.description,
    logoUrl: pump.logoUrl,
    status: pump.status,
    rejectionReason: pump.rejectionReason,
    averageRating: pump.averageRating ? parseFloat(pump.averageRating) : null,
    totalReviews: pump.totalReviews,
    isOpen: pump.isOpen,
    fuelPrices: fuelPrices.map(fp => ({
      id: fp.id,
      pumpId: fp.pumpId,
      fuelType: fp.fuelType,
      pricePerLiter: parseFloat(fp.pricePerLiter),
      isAvailable: fp.isAvailable,
      updatedAt: fp.updatedAt.toISOString(),
    })),
    createdAt: pump.createdAt.toISOString(),
  };
}

router.patch("/customers/profile", requireRole("customer"), async (req, res): Promise<void> => {
  const { fullName, email, address, latitude, longitude, profilePicture } = req.body;
  const userId = req.user!.userId;

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (fullName != null) updateData.fullName = fullName;
  if (email != null) updateData.email = email;
  if (address != null) updateData.address = address;
  if (latitude != null) updateData.latitude = String(latitude);
  if (longitude != null) updateData.longitude = String(longitude);
  if (profilePicture != null) updateData.profilePicture = profilePicture;

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();

  res.json({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    profilePicture: user.profilePicture,
    address: user.address,
    latitude: user.latitude ? parseFloat(user.latitude) : null,
    longitude: user.longitude ? parseFloat(user.longitude) : null,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/customers/favorites", requireRole("customer"), async (req, res): Promise<void> => {
  const customerId = req.user!.userId;

  const favoriteRows = await db.select().from(favoritesTable).where(eq(favoritesTable.customerId, customerId));
  const pumpIds = favoriteRows.map(f => f.pumpId);

  if (pumpIds.length === 0) {
    res.json([]);
    return;
  }

  const pumps = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.status, "approved"));
  const filteredPumps = pumps.filter(p => pumpIds.includes(p.id));

  const result = await Promise.all(filteredPumps.map(async (pump) => {
    const fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pump.id));
    return buildPumpResponse(pump, fuelPrices);
  }));

  res.json(result);
});

router.post("/customers/favorites", requireRole("customer"), async (req, res): Promise<void> => {
  const customerId = req.user!.userId;
  const { pumpId } = req.body;

  if (!pumpId) {
    res.status(400).json({ error: "pumpId is required" });
    return;
  }

  const [existing] = await db.select().from(favoritesTable).where(
    and(eq(favoritesTable.customerId, customerId), eq(favoritesTable.pumpId, pumpId))
  );

  if (existing) {
    res.status(201).json({ success: true, message: "Already in favorites" });
    return;
  }

  await db.insert(favoritesTable).values({ customerId, pumpId });
  res.status(201).json({ success: true, message: "Added to favorites" });
});

router.delete("/customers/favorites/:pumpId", requireRole("customer"), async (req, res): Promise<void> => {
  const customerId = req.user!.userId;
  const rawId = Array.isArray(req.params.pumpId) ? req.params.pumpId[0] : req.params.pumpId;
  const pumpId = parseInt(rawId, 10);

  await db.delete(favoritesTable).where(
    and(eq(favoritesTable.customerId, customerId), eq(favoritesTable.pumpId, pumpId))
  );

  res.sendStatus(204);
});

export default router;
