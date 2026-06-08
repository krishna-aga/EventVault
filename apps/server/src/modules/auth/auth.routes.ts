import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { validateBody } from "../../common/middleware/validate.middleware.js";
import { login, logout, me, refresh, register } from "./auth.controller.js";
import { parseLoginBody, parseRegisterBody, parseTokenBody } from "./auth.schema.js";

const router = Router();

router.post("/register", validateBody(parseRegisterBody), register);
router.post("/login", validateBody(parseLoginBody), login);
router.post("/refresh", validateBody(parseTokenBody), refresh);
router.post("/logout", validateBody(parseTokenBody), logout);
router.get("/me", authMiddleware, me);

export default router;
