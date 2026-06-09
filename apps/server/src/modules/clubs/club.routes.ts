import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { validateBody } from "../../common/middleware/validate.middleware.js";
import {
  clubMembersHandler,
  createClubHandler,
  createJoinRequestHandler,
  deleteClubHandler,
  getClubHandler,
  leaveClubHandler,
  listClubsHandler,
  listJoinRequestsHandler,
  myClubsHandler,
  removeMemberHandler,
  updateClubHandler,
  updateMemberRoleHandler,
  reviewJoinRequestHandler,
} from "./club.controller.js";
import {
  parseClubCreateBody,
  parseClubUpdateBody,
  parseJoinRequestReviewBody,
  parseMemberRoleBody,
} from "./club.schema.js";

const router = Router();

router.get("/", listClubsHandler);
router.get("/me", authMiddleware, myClubsHandler);
router.get("/:clubId", getClubHandler);

router.use(authMiddleware);
router.post("/", validateBody(parseClubCreateBody), createClubHandler);
router.patch("/:clubId", validateBody(parseClubUpdateBody), updateClubHandler);
router.delete("/:clubId", deleteClubHandler);
router.post("/:clubId/join", createJoinRequestHandler);
router.post("/:clubId/join-requests", createJoinRequestHandler);
router.get("/:clubId/join-requests", listJoinRequestsHandler);
router.patch(
  "/:clubId/join-requests/:requestId",
  validateBody(parseJoinRequestReviewBody),
  reviewJoinRequestHandler,
);
router.get("/:clubId/members", clubMembersHandler);
router.patch(
  "/:clubId/members/:memberId/role",
  validateBody(parseMemberRoleBody),
  updateMemberRoleHandler,
);
router.delete("/:clubId/members/:memberId", removeMemberHandler);
router.post("/:clubId/leave", leaveClubHandler);

export default router;
