import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { validateBody } from "../../common/middleware/validate.middleware.js";
import {
  createEventHandler,
  deleteEventHandler,
  getEventHandler,
  listEventsHandler,
  updateEventHandler,
} from "./event.controller.js";
import { parseEventBody, parseEventUpdateBody } from "./event.schema.js";

const router = Router();

router.get("/", listEventsHandler);
router.get("/:eventId", getEventHandler);

router.use(authMiddleware);

router.post("/", validateBody(parseEventBody), createEventHandler);
router.patch("/:eventId", validateBody(parseEventUpdateBody), updateEventHandler);
router.delete("/:eventId", deleteEventHandler);

export default router;
