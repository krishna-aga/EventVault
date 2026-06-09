import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { validateBody } from "../../common/middleware/validate.middleware.js";
import { login, logout, me, refresh, register, uploadSelfie } from "./auth.controller.js";
import { parseLoginBody, parseRegisterBody, parseTokenBody } from "./auth.schema.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post("/register", validateBody(parseRegisterBody), register);
router.post("/login", validateBody(parseLoginBody), login);
router.post("/refresh", validateBody(parseTokenBody), refresh);
router.post("/logout", validateBody(parseTokenBody), logout);
router.get("/me", authMiddleware, me);
router.post("/selfie", authMiddleware, upload.single("file"), uploadSelfie);

export default router;
