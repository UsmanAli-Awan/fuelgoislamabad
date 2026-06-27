import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, petrolPumpsTable, ordersTable, fuelPricesTable } from "@workspace/db";
import { eq, ne, sql } from "drizzle-orm";
import { signToken, requireRole } from "../middlewares/auth";

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

function buildOrderResponse(
  order: typeof ordersTable.$inferSelect,
  customerName?: string | null,
  customerPhone?: string | null,
  pumpName?: string | null
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
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!admin || admin.role !== "admin") {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  const validPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!validPassword) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  const token = signToken({ userId: admin.id, role: admin.role, phone: admin.phone });

  res.json({
    token,
    user: {
      id: admin.id,
      role: admin.role,
      fullName: admin.fullName,
      phone: admin.phone,
      email: admin.email,
      profilePicture: admin.profilePicture,
      address: admin.address,
      latitude: null,
      longitude: null,
      status: admin.status,
      createdAt: admin.createdAt.toISOString(),
    },
  });
});

router.get("/admin/stats", requireRole("admin"), async (_req, res): Promise<void> => {
  const allUsers = await db.select().from(usersTable).where(ne(usersTable.role, "admin"));
  const allPumps = await db.select().from(petrolPumpsTable);
  const allOrders = await db.select().from(ordersTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalUsers = allUsers.filter(u => u.role === "customer").length;
  const totalPumps = allPumps.length;
  const pendingPumps = allPumps.filter(p => p.status === "pending").length;
  const approvedPumps = allPumps.filter(p => p.status === "approved").length;
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
  const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today).length;
  const activeOrders = allOrders.filter(o => ["pending", "accepted", "preparing", "out_for_delivery"].includes(o.status)).length;

  const recentOrderRows = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentOrders = await Promise.all(recentOrderRows.map(async (order) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, order.customerId));
    const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.id, order.pumpId));
    return buildOrderResponse(order, customer?.fullName, customer?.phone, pump?.businessName);
  }));

  res.json({
    totalUsers,
    totalPumps,
    pendingPumps,
    approvedPumps,
    totalOrders,
    totalRevenue,
    todayOrders,
    activeOrders,
    recentOrders,
  });
});

router.get("/admin/pumps", requireRole("admin"), async (req, res): Promise<void> => {
  const { status } = req.query as { status?: string };
  let pumps = await db.select().from(petrolPumpsTable);

  if (status) {
    pumps = pumps.filter(p => p.status === status);
  }

  const result = await Promise.all(pumps.map(async (pump) => {
    const fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pump.id));
    return buildPumpResponse(pump, fuelPrices);
  }));

  res.json(result);
});

router.patch("/admin/pumps/:id/approve", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid pump ID" });
    return;
  }

  const [pump] = await db.update(petrolPumpsTable)
    .set({ status: "approved", rejectionReason: null })
    .where(eq(petrolPumpsTable.id, id))
    .returning();

  if (!pump) {
    res.status(404).json({ error: "Pump not found" });
    return;
  }

  const fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pump.id));
  res.json(buildPumpResponse(pump, fuelPrices));
});

router.patch("/admin/pumps/:id/reject", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const { reason } = req.body;

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid pump ID" });
    return;
  }

  if (!reason) {
    res.status(400).json({ error: "Rejection reason is required" });
    return;
  }

  const [pump] = await db.update(petrolPumpsTable)
    .set({ status: "rejected", rejectionReason: reason })
    .where(eq(petrolPumpsTable.id, id))
    .returning();

  if (!pump) {
    res.status(404).json({ error: "Pump not found" });
    return;
  }

  const fuelPrices = await db.select().from(fuelPricesTable).where(eq(fuelPricesTable.pumpId, pump.id));
  res.json(buildPumpResponse(pump, fuelPrices));
});

router.get("/admin/users", requireRole("admin"), async (req, res): Promise<void> => {
  const { role, search } = req.query as { role?: string; search?: string };

  let users = await db.select().from(usersTable).where(ne(usersTable.role, "admin"));

  if (role) {
    users = users.filter(u => u.role === role);
  }

  if (search) {
    const s = search.toLowerCase();
    users = users.filter(u =>
      u.fullName.toLowerCase().includes(s) ||
      u.phone.includes(s) ||
      (u.email && u.email.toLowerCase().includes(s))
    );
  }

  res.json(users.map(u => ({
    id: u.id,
    role: u.role,
    fullName: u.fullName,
    phone: u.phone,
    email: u.email,
    profilePicture: u.profilePicture,
    address: u.address,
    latitude: u.latitude ? parseFloat(u.latitude) : null,
    longitude: u.longitude ? parseFloat(u.longitude) : null,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.get("/admin/orders", requireRole("admin"), async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);

  const result = await Promise.all(allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(async (order) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, order.customerId));
    const [pump] = await db.select().from(petrolPumpsTable).where(eq(petrolPumpsTable.id, order.pumpId));
    return buildOrderResponse(order, customer?.fullName, customer?.phone, pump?.businessName);
  }));

  res.json(result);
});

router.patch("/admin/users/:id/suspend", requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newStatus = user.status === "suspended" ? "active" : "suspended";
  const [updated] = await db.update(usersTable)
    .set({ status: newStatus })
    .where(eq(usersTable.id, id))
    .returning();

  res.json({
    id: updated.id,
    role: updated.role,
    fullName: updated.fullName,
    phone: updated.phone,
    email: updated.email,
    profilePicture: updated.profilePicture,
    address: updated.address,
    latitude: updated.latitude ? parseFloat(updated.latitude) : null,
    longitude: updated.longitude ? parseFloat(updated.longitude) : null,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
