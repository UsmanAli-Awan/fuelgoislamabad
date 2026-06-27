import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, petrolPumpsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";

const router = Router();

function buildUserProfile(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    profilePicture: user.profilePicture,
    address: user.address,
    latitude: user.latitude ? parseFloat(user.latitude) : null,
    longitude: user.longitude ? parseFloat(user.longitude) : null,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register/customer", async (req, res): Promise<void> => {
  const { fullName, phone, email, password, confirmPassword, address, latitude, longitude } = req.body;

  if (!fullName || !phone || !password || !confirmPassword) {
    res.status(400).json({ error: "fullName, phone, password, confirmPassword are required" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db.insert(usersTable).values({
    role: "customer",
    fullName,
    phone,
    email: email || null,
    passwordHash,
    address: address || null,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    status: "active",
  }).returning();

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone });

  res.status(201).json({ token, user: buildUserProfile(user) });
});

router.post("/auth/register/pump", async (req, res): Promise<void> => {
  const {
    businessName, ownerName, phone, email, password, confirmPassword,
    cnic, licenseNumber, businessRegNumber, address, latitude, longitude,
    operatingHoursStart, operatingHoursEnd, deliveryRadius, deliveryCharges, description,
  } = req.body;

  if (!businessName || !ownerName || !phone || !email || !password || !confirmPassword || !cnic || !licenseNumber || !businessRegNumber || !address) {
    res.status(400).json({ error: "All required fields must be provided" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing) {
    res.status(409).json({ error: "Phone number already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db.insert(usersTable).values({
    role: "pump_owner",
    fullName: ownerName,
    phone,
    email: email || null,
    passwordHash,
    status: "active",
  }).returning();

  await db.insert(petrolPumpsTable).values({
    ownerId: user.id,
    businessName,
    ownerName,
    phone,
    email: email || null,
    cnic: cnic || null,
    licenseNumber: licenseNumber || null,
    businessRegNumber: businessRegNumber || null,
    address,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    operatingHoursStart: operatingHoursStart || null,
    operatingHoursEnd: operatingHoursEnd || null,
    deliveryRadius: deliveryRadius ? String(deliveryRadius) : null,
    deliveryCharges: deliveryCharges ? String(deliveryCharges) : null,
    description: description || null,
    status: "pending",
    isOpen: true,
    totalReviews: 0,
  });

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone });

  res.status(201).json({ token, user: buildUserProfile(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { phone, password, role } = req.body;

  if (!phone || !password || !role) {
    res.status(400).json({ error: "phone, password, and role are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));

  if (!user || user.role !== role) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status === "suspended") {
    res.status(401).json({ error: "Account has been suspended" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone });

  res.json({ token, user: buildUserProfile(user) });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(buildUserProfile(user));
});

router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
