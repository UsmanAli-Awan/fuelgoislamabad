import { Router } from "express";
import { db, reviewsTable, petrolPumpsTable, usersTable, ordersTable } from "@workspace/db";
import { eq, and, avg, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.get("/pumps/:pumpId/reviews", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.pumpId) ? req.params.pumpId[0] : req.params.pumpId;
  const pumpId = parseInt(rawId, 10);

  if (isNaN(pumpId)) {
    res.status(400).json({ error: "Invalid pump ID" });
    return;
  }

  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.pumpId, pumpId));

  const result = await Promise.all(reviews.map(async (review) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, review.customerId));
    return {
      id: review.id,
      pumpId: review.pumpId,
      customerId: review.customerId,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      customerName: customer?.fullName || null,
      createdAt: review.createdAt.toISOString(),
    };
  }));

  res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.post("/pumps/:pumpId/reviews", requireRole("customer"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.pumpId) ? req.params.pumpId[0] : req.params.pumpId;
  const pumpId = parseInt(rawId, 10);
  const customerId = req.user!.userId;

  if (isNaN(pumpId)) {
    res.status(400).json({ error: "Invalid pump ID" });
    return;
  }

  const { orderId, rating, comment } = req.body;

  if (!orderId || !rating) {
    res.status(400).json({ error: "orderId and rating are required" });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const [existing] = await db.select().from(reviewsTable).where(
    and(eq(reviewsTable.pumpId, pumpId), eq(reviewsTable.customerId, customerId), eq(reviewsTable.orderId, orderId))
  );

  if (existing) {
    res.status(400).json({ error: "You have already reviewed this order" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order || order.customerId !== customerId || order.pumpId !== pumpId || order.status !== "delivered") {
    res.status(400).json({ error: "Can only review delivered orders" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    pumpId,
    customerId,
    orderId,
    rating,
    comment: comment || null,
  }).returning();

  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.pumpId, pumpId));
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await db.update(petrolPumpsTable)
    .set({ averageRating: avgRating.toFixed(2), totalReviews: allReviews.length })
    .where(eq(petrolPumpsTable.id, pumpId));

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, customerId));

  res.status(201).json({
    id: review.id,
    pumpId: review.pumpId,
    customerId: review.customerId,
    orderId: review.orderId,
    rating: review.rating,
    comment: review.comment,
    customerName: customer?.fullName || null,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
