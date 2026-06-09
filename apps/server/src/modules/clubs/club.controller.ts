import type { Request, RequestHandler } from "express";
import { CLUB_MESSAGES, COMMON_MESSAGES } from "../../common/constants/messages.js";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  addClub,
  changeMemberRole,
  editClub,
  fetchClub,
  fetchClubJoinRequests,
  fetchClubMembers,
  fetchClubs,
  fetchMyClubs,
  leaveClubMember,
  removeClub,
  removeMember,
  requestJoinClub,
  reviewClubJoinRequest,
} from "./club.service.js";

const readClubId = (req: Request): string => {
  const clubId = typeof req.params.clubId === "string" ? req.params.clubId.trim() : "";

  if (!clubId) {
    throw new ApiError(400, "Club id is required");
  }

  return clubId;
};

const readRequestId = (req: Request): string => {
  const requestId =
    typeof req.params.requestId === "string" ? req.params.requestId.trim() : "";

  if (!requestId) {
    throw new ApiError(400, "Request id is required");
  }

  return requestId;
};

const readMemberId = (req: Request): string => {
  const memberId =
    typeof req.params.memberId === "string" ? req.params.memberId.trim() : "";

  if (!memberId) {
    throw new ApiError(400, "Member id is required");
  }

  return memberId;
};

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
  }

  return req.user;
};

export const listClubsHandler: RequestHandler = async (_req, res, next) => {
  try {
    const clubs = await fetchClubs();
    sendSuccess(res, CLUB_MESSAGES.LIST_FETCHED, { clubs });
  } catch (error) {
    next(error);
  }
};

export const getClubHandler: RequestHandler = async (req, res, next) => {
  try {
    const club = await fetchClub(readClubId(req));
    sendSuccess(res, CLUB_MESSAGES.FETCHED, { club });
  } catch (error) {
    next(error);
  }
};

export const createClubHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    if (user.role !== "ADMIN") {
      throw new ApiError(403, "Access Denied: Only superadmin can create clubs");
    }
    const club = await addClub(req.body, user.id);
    sendSuccess(res, CLUB_MESSAGES.CREATED, { club }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateClubHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const club = await editClub(readClubId(req), req.body, user);
    sendSuccess(res, CLUB_MESSAGES.UPDATED, { club });
  } catch (error) {
    next(error);
  }
};

export const deleteClubHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    await removeClub(readClubId(req), user);
    sendSuccess(res, CLUB_MESSAGES.DELETED, null);
  } catch (error) {
    next(error);
  }
};

export const createJoinRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    if (user.role === "VIEWER") {
      throw new ApiError(403, "Access Denied: Viewers cannot join clubs");
    }
    const joinRequest = await requestJoinClub(user.id, readClubId(req));
    sendSuccess(res, CLUB_MESSAGES.JOIN_REQUEST_CREATED, { joinRequest }, 201);
  } catch (error) {
    next(error);
  }
};

export const listJoinRequestsHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const joinRequests = await fetchClubJoinRequests(readClubId(req), user);
    sendSuccess(res, CLUB_MESSAGES.JOIN_REQUESTS_FETCHED, { joinRequests });
  } catch (error) {
    next(error);
  }
};

export const reviewJoinRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const joinRequest = await reviewClubJoinRequest(
      readClubId(req),
      readRequestId(req),
      user,
      req.body,
    );

    sendSuccess(res, CLUB_MESSAGES.JOIN_REQUEST_REVIEWED, { joinRequest });
  } catch (error) {
    next(error);
  }
};

export const clubMembersHandler: RequestHandler = async (req, res, next) => {
  try {
    const members = await fetchClubMembers(readClubId(req));
    sendSuccess(res, CLUB_MESSAGES.MEMBERS_FETCHED, { members });
  } catch (error) {
    next(error);
  }
};

export const myClubsHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const clubs = await fetchMyClubs(user.id);
    sendSuccess(res, CLUB_MESSAGES.MY_CLUBS_FETCHED, { clubs });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRoleHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const member = await changeMemberRole(
      readClubId(req),
      readMemberId(req),
      user,
      req.body,
    );

    sendSuccess(res, CLUB_MESSAGES.MEMBER_ROLE_UPDATED, { member });
  } catch (error) {
    next(error);
  }
};

export const removeMemberHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const member = await removeMember(readClubId(req), readMemberId(req), user);
    sendSuccess(res, CLUB_MESSAGES.MEMBER_REMOVED, { member });
  } catch (error) {
    next(error);
  }
};

export const leaveClubHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    await leaveClubMember(user.id, readClubId(req));
    sendSuccess(res, CLUB_MESSAGES.LEFT, null);
  } catch (error) {
    next(error);
  }
};
