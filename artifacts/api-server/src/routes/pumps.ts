import { Router } from "express";
import { db, petrolPumpsTable, fuelPricesTable, usersTable, ordersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

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

function buildOrderResponse(order: typeof ordersTable.$inferSelect, customerName?: string | null, customerPhone?: string | null, pumpName?: string | null) {
  return {
    id: order.id,
    customerId: order.customerId,
    pumpId: order.pumpId,
    fuelType: order.fuelType,
    quantityLiters: parseFloat(order.quantityLiters),
    pricePerLiter: parseFloat(order.pricePerLiter),
    deliveryCharges: parseFloat(order.deliveryCharges),
    totalAmount: parseFloat(order.totalAmount),
    status: order.status,
    deliveryAddress: order.deliveryAddress,
    deliveryLat: order.deliveryLat ? parseFloat(order.deliveryLat) : null,
    deliveryLng: order.deliveryLng ? parseFloat(order.deliveryLng) : null,
    notes: order.notes,
    statusNotes: order.statusNotes,
    estimatedDelivery: order.estimatedDelivery,
    customerName: customerName || null,
    customerPhone: customerPhone || null,
    pumpName: pumpName || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.get("/pumps", async (req, res): Promise<void> => {
  const { search, fuelType } = req.query as { search?: string; fuelType?: string };

  let query = db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.status, "approved"));
  const pumps = await query.orderBy(desc(petrolPumpsTable.createdAt));

  const filtered = pumps.filter(pump => {
    if (search) {
      const s = search.toLowerCase();
      if (!pump.businessName.toLowerCase().includes(s) && !pump.address.toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  const result = await Promise.all(filtered.map(async (pump) => {
    let fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pump.id));
    if (fuelType) {
      const hasFuel = fuelPrices.some(fp => fp.fuelType === fuelType && fp.isAvailable);
      if (!hasFuel) return null;
    }
    return buildPumpResponse(pump, fuelPrices);
  }));

  res.json(result.filter(Boolean));
});

router.get("/pumps/my", requireRole("pump_owner"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.ownerId, userId));

  if (!pump) {
    res.status(404).json({ error: "No pump found for this owner" });
    return;
  }

  const fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pump.id));
  res.json(buildPumpResponse(pump, fuelPrices));
});

router.patch("/pumps/my", requireRole("pump_owner"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [existingPump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.ownerId, userId));

  if (!existingPump) {
    res.status(404).json({ error: "No pump found for this owner" });
    return;
  }

  const {
    businessName, description, address, latitude, longitude,
    operatingHoursStart, operatingHoursEnd, deliveryRadius, deliveryCharges, logoUrl, isOpen
  } = req.body;

  const updateData: Partial<typeof petrolPumpsTable.$inferInsert> = {};
  if (businessName != null) updateData.businessName = businessName;
  if (description != null) updateData.description = description;
  if (address != null) updateData.address = address;
  if (latitude != null) updateData.latitude = String(latitude);
  if (longitude != null) updateData.longitude = String(longitude);
  if (operatingHoursStart != null) updateData.operatingHoursStart = operatingHoursStart;
  if (operatingHoursEnd != null) updateData.operatingHoursEnd = operatingHoursEnd;
  if (deliveryRadius != null) updateData.deliveryRadius = String(deliveryRadius);
  if (deliveryCharges != null) updateData.deliveryCharges = String(deliveryCharges);
  if (logoUrl != null) updateData.logoUrl = logoUrl;
  if (isOpen != null) updateData.isOpen = isOpen;

  const [pump] = await db.update(petrolPumpsTable).set(updateData).where(eq(petrolPumpsTable.id, existingPump.id)).returning();
  const fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pump.id));
  res.json(buildPumpResponse(pump, fuelPrices));
});

router.get("/pumps/my/stats", requireRole("pump_owner"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.ownerId, userId));

  if (!pump) {
    res.status(404).json({ error: "No pump found" });
    return;
  }

  const allOrders = await db.select().from(ordersTable).where(eq(ordersTable.pumpId, pump.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
  const pendingOrders = allOrders.filter(o => ["pending", "accepted", "preparing", "out_for_delivery"].includes(o.status));
  const completedOrders = allOrders.filter(o => o.status === "delivered");
  const cancelledOrders = allOrders.filter(o => ["rejected", "cancelled"].includes(o.status));

  const todayRevenue = todayOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  const customerIds = new Set(allOrders.map(o => o.customerId));

  const recentOrderRows = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentOrders = await Promise.all(recentOrderRows.map(async (order) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, order.customerId));
    return buildOrderResponse(order, customer?.fullName, customer?.phone, pump.businessName);
  }));

  res.json({
    todayOrders: todayOrders.length,
    pendingOrders: pendingOrders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    todayRevenue,
    totalRevenue,
    totalCustomers: customerIds.size,
    recentOrders,
  });
});

router.get("/pumps/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid pump ID" });
    return;
  }

  const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.id, id));
  if (!pump) {
    res.status(404).json({ error: "Pump not found" });
    return;
  }

  const fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, id));
  res.json(buildPumpResponse(pump, fuelPrices));
});

export { buildOrderResponse };
export default router;
