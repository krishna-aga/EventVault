import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import clubRoutes from "../modules/clubs/club.routes.js";
import eventRoutes from "../modules/events/event.routes.js";
import mediaRoutes from "../modules/media/media.routes.js";
import likesRoutes from "../modules/likes/likes.routes.js";
import commentsRoutes from "../modules/comments/comments.routes.js";
import favouritesRoutes from "../modules/favourites/favourites.routes.js";
import notificationsRoutes from "../modules/notifications/notifications.routes.js";
import searchRoutes from "../modules/search/search.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/clubs", clubRoutes);
router.use("/events", eventRoutes);

// Mount social, media and search routes
router.use("/media", mediaRoutes);
router.use("/media", likesRoutes);
router.use("/media", commentsRoutes);
router.use("/media", favouritesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/search", searchRoutes);

export default router;
