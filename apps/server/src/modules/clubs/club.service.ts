import { prisma } from "@repo/db";
import type { Prisma } from "@repo/db";
import { COMMON_MESSAGES } from "../../common/constants/messages.js";
import { ApiError } from "../../common/errors/ApiError.js";
import type {
  ClubCreateInput,
  ClubJoinRequestReviewInput,
  ClubMemberRoleInput,
  ClubUpdateInput,
} from "./club.schema.js";
import {
  createClubMember,
  createJoinRequest,
  deleteClub,
  findClubById,
  findClubMembership,
  findClubMembershipById,
  findJoinRequestById,
  findJoinRequestByUserAndClub,
  leaveClub,
  listClubMembers,
  listClubs,
  listJoinRequests,
  listUserClubs,
  removeClubMemberById,
  reviewJoinRequest,
  updateClub,
  updateClubMemberRole,
} from "./club.repository.js";

const assertClubExists = async (clubId: string) => {
  const club = await findClubById(clubId);

  if (!club) {
    throw new ApiError(404, COMMON_MESSAGES.NOT_FOUND);
  }

  return club;
};

const assertCanManageClub = async (clubId: string, userId: string, role: string) => {
  if (role === "ADMIN") {
    return assertClubExists(clubId);
  }

  const club = await assertClubExists(clubId);

  if (club.createdById === userId) {
    return club;
  }

  const membership = await findClubMembership(userId, clubId);

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new ApiError(403, COMMON_MESSAGES.FORBIDDEN);
  }

  return club;
};

const assertCanReviewJoinRequests = async (clubId: string, userId: string, role: string) => {
  if (role === "ADMIN") {
    return assertClubExists(clubId);
  }

  const membership = await findClubMembership(userId, clubId);

  if (!membership || membership.role !== "ADMIN") {
    throw new ApiError(403, COMMON_MESSAGES.FORBIDDEN);
  }

  return assertClubExists(clubId);
};

export const fetchClubs = () => listClubs();

export const fetchClub = async (clubId: string) => {
  return assertClubExists(clubId);
};

export const addClub = async (
  input: ClubCreateInput,
  createdById: string,
) => {
  return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    const club = await transaction.club.create({
      data: {
        ...input,
        createdById,
      },
    });

    await transaction.clubMember.create({
      data: {
        userId: createdById,
        clubId: club.id,
        role: "OWNER",
      },
    });

    return club;
  });
};

export const editClub = async (
  clubId: string,
  input: ClubUpdateInput,
  actor: {
    id: string;
    role: string;
  },
) => {
  await assertCanManageClub(clubId, actor.id, actor.role);
  return updateClub(clubId, input);
};

export const removeClub = async (
  clubId: string,
  actor: {
    id: string;
    role: string;
  },
) => {
  await assertCanManageClub(clubId, actor.id, actor.role);
  return deleteClub(clubId);
};

export const requestJoinClub = async (userId: string, clubId: string) => {
  await assertClubExists(clubId);

  const membership = await findClubMembership(userId, clubId);

  if (membership) {
    throw new ApiError(409, "You are already a member of this club");
  }

  // Superadmin is considered an implicit member of every club.
  // They do not need to create or approve a join request.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "ADMIN") {
    throw new ApiError(409, "You are already a member of this club");
  }

  const existingRequest = await findJoinRequestByUserAndClub(userId, clubId);

  if (existingRequest && existingRequest.status === "PENDING") {
    throw new ApiError(409, "A join request is already pending");
  }

  if (existingRequest && existingRequest.status === "APPROVED") {
    throw new ApiError(409, "You are already approved for this club");
  }

  if (existingRequest) {
    return prisma.clubJoinRequest.update({
      where: {
        id: existingRequest.id,
      },
      data: {
        status: "PENDING",
        reviewedAt: null,
        reviewedById: null,
      },
    });
  }

  return createJoinRequest({
    userId,
    clubId,
  });
};

export const fetchClubJoinRequests = async (
  clubId: string,
  actor: {
    id: string;
    role: string;
  },
) => {
  await assertCanReviewJoinRequests(clubId, actor.id, actor.role);
  return listJoinRequests(clubId);
};

export const reviewClubJoinRequest = async (
  clubId: string,
  requestId: string,
  actor: {
    id: string;
    role: string;
  },
  input: ClubJoinRequestReviewInput,
) => {
  await assertCanReviewJoinRequests(clubId, actor.id, actor.role);

  const joinRequest = await findJoinRequestById(requestId, clubId);

  if (!joinRequest) {
    throw new ApiError(404, COMMON_MESSAGES.NOT_FOUND);
  }

  if (joinRequest.status !== "PENDING") {
    throw new ApiError(409, "This join request has already been processed");
  }

  if (input.status === "APPROVED") {
    const existingMembership = await findClubMembership(joinRequest.userId, clubId);

    if (!existingMembership) {
      await createClubMember({
        userId: joinRequest.userId,
        clubId,
        role: "MEMBER",
      });
    }
  }

  return reviewJoinRequest(requestId, {
    status: input.status,
    reviewedById: actor.id,
  });
};

export const fetchClubMembers = async (
  clubId: string,
  actor?: {
    id: string;
    role: string;
  },
) => {
  if (actor) {
    await assertCanManageClub(clubId, actor.id, actor.role);
  } else {
    await assertClubExists(clubId);
  }

  return listClubMembers(clubId);
};

export const fetchMyClubs = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "ADMIN") {
    const clubs = await listClubs();
    return clubs.map((club) => ({
      id: club.id,
      club,
    }));
  }

  return listUserClubs(userId);
};

export const changeMemberRole = async (
  clubId: string,
  memberId: string,
  actor: {
    id: string;
    role: string;
  },
  input: ClubMemberRoleInput,
) => {
  if (actor.role !== "ADMIN") {
    throw new ApiError(403, "Access Denied: Only superadmin can change member roles");
  }

  await assertClubExists(clubId);
  const member = await findClubMembershipById(memberId, clubId);

  if (!member) {
    throw new ApiError(404, COMMON_MESSAGES.NOT_FOUND);
  }

  if (member.role === "OWNER" && input.role !== "OWNER") {
    throw new ApiError(400, "The club owner role cannot be changed");
  }

  return updateClubMemberRole(memberId, input.role);
};

export const removeMember = async (
  clubId: string,
  memberId: string,
  actor: {
    id: string;
    role: string;
  },
) => {
  await assertCanManageClub(clubId, actor.id, actor.role);

  const member = await findClubMembershipById(memberId, clubId);

  if (!member) {
    throw new ApiError(404, COMMON_MESSAGES.NOT_FOUND);
  }

  if (member.role === "OWNER") {
    throw new ApiError(400, "The club owner cannot be removed");
  }

  await removeClubMemberById(memberId, clubId);

  return member;
};

export const leaveClubMember = async (userId: string, clubId: string) => {
  const membership = await findClubMembership(userId, clubId);

  if (!membership) {
    throw new ApiError(404, "You are not a member of this club");
  }

  if (membership.role === "OWNER") {
    throw new ApiError(400, "The club owner cannot leave the club");
  }

  return leaveClub(userId, clubId);
};
