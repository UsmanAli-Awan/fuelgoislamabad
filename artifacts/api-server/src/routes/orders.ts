import { Router } from "express";
import { db, ordersTable, petrolPumpsTable, fuelPricesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

function buildOrderResponse(
  order: typeof ordersTable.$inferSelect,
  customerName?: string | null,
  customerPhone?: string | null,
  pumpName?: string | null,
  pumpLat?: string | null,
  pumpLng?: string | null,
) {
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
    pumpLat: pumpLat ? parseFloat(pumpLat) : null,
    pumpLng: pumpLng ? parseFloat(pumpLng) : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing"],
  preparing: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  rejected: [],
  cancelled: [],
};

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const { status } = req.query as { status?: string };

  let allOrders: typeof ordersTable.$inferSelect[] = [];

  if (role === "customer") {
    allOrders = await db.select().from(ordersTable).where(eq(ordersTable.customerId, userId));
  } else if (role === "pump_owner") {
    const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.ownerId, userId));
    if (!pump) {
      res.json([]);
      return;
    }
    allOrders = await db.select().from(ordersTable).where(eq(ordersTable.pumpId, pump.id));
  } else if (role === "admin") {
    allOrders = await db.select().from(ordersTable);
  }

  if (status) {
    allOrders = allOrders.filter(o => o.status === status);
  }

  allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const result = await Promise.all(allOrders.map(async (order) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, order.customerId));
    const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.id, order.pumpId));
    return buildOrderResponse(order, customer?.fullName, customer?.phone, pump?.businessName, pump?.latitude, pump?.longitude);
  }));

  res.json(result);
});

router.post("/orders", requireRole("customer"), async (req, res): Promise<void> => {
  const customerId = req.user!.userId;
  const { pumpId, fuelType, quantityLiters, deliveryAddress, deliveryLat, deliveryLng, notes } = req.body;

  if (!pumpId || !fuelType || !quantityLiters || !deliveryAddress) {
    res.status(400).json({ error: "pumpId, fuelType, quantityLiters, deliveryAddress are required" });
    return;
  }

  const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.id, pumpId));
  if (!pump || pump.status !== "approved") {
    res.status(400).json({ error: "Pump not available" });
    return;
  }

  const [fuelPrice] = await db.select().from(fuelPricesTable).where(
    and(eq(fuelPricesTable.pumpId, pumpId), eq(fuelPricesTable.fuelType, fuelType))
  );

  if (!fuelPrice || !fuelPrice.isAvailable) {
    res.status(400).json({ error: "Fuel type not available at this pump" });
    return;
  }

  const pricePerLiter = parseFloat(fuelPrice.pricePerLiter);
  const deliveryCharges = pump.deliveryCharges ? parseFloat(pump.deliveryCharges) : 0;
  const totalAmount = (pricePerLiter * parseFloat(String(quantityLiters))) + deliveryCharges;

  const [order] = await db.insert(ordersTable).values({
    customerId,
    pumpId,
    fuelType,
    quantityLiters: String(quantityLiters),
    pricePerLiter: String(pricePerLiter),
    deliveryCharges: String(deliveryCharges),
    totalAmount: String(totalAmount.toFixed(2)),
    status: "pending",
    deliveryAddress,
    deliveryLat: deliveryLat ? String(deliveryLat) : null,
    deliveryLng: deliveryLng ? String(deliveryLng) : null,
    notes: notes || null,
  }).returning();

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, customerId));
  res.status(201).json(buildOrderResponse(order, customer?.fullName, customer?.phone, pump.businessName));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const userId = req.user!.userId;
  const role = req.user!.role;

  if (role === "customer" && order.customerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (role === "pump_owner") {
    const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.ownerId, userId));
    if (!pump || order.pumpId !== pump.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, order.customerId));
  const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.id, order.pumpId));
  res.json(buildOrderResponse(order, customer?.fullName, customer?.phone, pump?.businessName, pump?.latitude, pump?.longitude));
});

router.patch("/orders/:id/status", requireRole("pump_owner"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const userId = req.user!.userId;
  const { status, notes: statusNotes } = req.body;

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.ownerId, userId));
  if (!pump || order.pumpId !== pump.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allowed = VALID_STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
    return;
  }

  const [updated] = await db.update(ordersTable)
    .set({ status, statusNotes: statusNotes || null })
    .where(eq(ordersTable.id, id))
    .returning();

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, updated.customerId));
  res.json(buildOrderResponse(updated, customer?.fullName, customer?.phone, pump.businessName, pump.latitude, pump.longitude));
});

router.patch("/orders/:id/cancel", requireRole("customer"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const userId = req.user!.userId;

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.customerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (order.status !== "pending") {
    res.status(400).json({ error: "Can only cancel pending orders" });
    return;
  }

  const [updated] = await db.update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, id))
    .returning();

  const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.id, order.pumpId));
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json(buildOrderResponse(updated, customer?.fullName, customer?.phone, pump?.businessName, pump?.latitude, pump?.longitude));
});

export default router;
