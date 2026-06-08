import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import clubRoutes from "../modules/clubs/club.routes.js";
import eventRoutes from "../modules/events/event.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/clubs", clubRoutes);
router.use("/events", eventRoutes);

export default router;
