import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import clubRoutes from "../modules/clubs/club.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/clubs", clubRoutes);

export default router;
