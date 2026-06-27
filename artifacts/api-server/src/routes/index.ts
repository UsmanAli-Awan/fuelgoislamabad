import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import pumpsRouter from "./pumps";
import fuelRouter from "./fuel";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(customersRouter);
router.use(pumpsRouter);
router.use(fuelRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(adminRouter);

export default router;
