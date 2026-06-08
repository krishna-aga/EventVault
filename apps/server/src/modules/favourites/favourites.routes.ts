import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { handleToggleFavourite, handleListFavourites } from "./favourites.controller.js";

const router = Router();

router.post("/:mediaId/favourite", authMiddleware, handleToggleFavourite);
router.get("/me", authMiddleware, handleListFavourites);

export default router;
