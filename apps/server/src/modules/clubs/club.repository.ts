import { prisma } from "@repo/db";
import type { Prisma } from "@repo/db";
import type { ClubJoinRequestStatus, ClubMemberRole } from "../../common/constants/roles.js";

export const listClubs = () => {
  return prisma.club.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findClubById = (clubId: string) => {
  return prisma.club.findUnique({
    where: {
      id: clubId,
    },
  });
};

export const createClub = (data: {
  name: string;
  description?: string;
  logoUrl?: string;
  createdById: string;
}) => {
  return prisma.club.create({
    data,
  });
};

export const updateClub = (
  clubId: string,
  data: {
    name?: string;
    description?: string;
    logoUrl?: string;
  },
) => {
  return prisma.club.update({
    where: {
      id: clubId,
    },
    data,
  });
};

export const deleteClub = async (clubId: string) => {
  return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await transaction.event.updateMany({
      where: {
        clubId,
      },
      data: {
        clubId: null,
      },
    });

    await transaction.clubJoinRequest.deleteMany({
      where: {
        clubId,
      },
    });

    await transaction.clubMember.deleteMany({
      where: {
        clubId,
      },
    });

    return transaction.club.delete({
      where: {
        id: clubId,
      },
    });
  });
};

export const findClubMembership = (userId: string, clubId: string) => {
  return prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
    },
  });
};

export const findClubMembershipById = (memberId: string, clubId: string) => {
  return prisma.clubMember.findFirst({
    where: {
      id: memberId,
      clubId,
    },
    include: {
      user: true,
    },
  });
};

export const createClubMember = (data: {
  userId: string;
  clubId: string;
  role: ClubMemberRole;
}) => {
  return prisma.clubMember.create({
    data,
  });
};

export const updateClubMemberRole = (
  memberId: string,
  role: ClubMemberRole,
) => {
  return prisma.clubMember.update({
    where: {
      id: memberId,
    },
    data: {
      role,
    },
    include: {
      user: true,
    },
  });
};

export const removeClubMemberById = (memberId: string, clubId: string) => {
  return prisma.clubMember.deleteMany({
    where: {
      id: memberId,
      clubId,
    },
  });
};

export const leaveClub = (userId: string, clubId: string) => {
  return prisma.clubMember.deleteMany({
    where: {
      userId,
      clubId,
    },
  });
};

export const listClubMembers = (clubId: string) => {
  return prisma.clubMember.findMany({
    where: {
      clubId,
    },
    include: {
      user: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });
};

export const listUserClubs = (userId: string) => {
  return prisma.clubMember.findMany({
    where: {
      userId,
    },
    include: {
      club: true,
    },
    orderBy: {
      joinedAt: "desc",
    },
  });
};

export const createJoinRequest = (data: {
  userId: string;
  clubId: string;
}) => {
  return prisma.clubJoinRequest.create({
    data,
  });
};

export const findJoinRequestById = (requestId: string, clubId: string) => {
  return prisma.clubJoinRequest.findFirst({
    where: {
      id: requestId,
      clubId,
    },
  });
};

export const findJoinRequestByUserAndClub = (userId: string, clubId: string) => {
  return prisma.clubJoinRequest.findFirst({
    where: {
      userId,
      clubId,
    },
  });
};

export const listJoinRequests = (clubId: string) => {
  return prisma.clubJoinRequest.findMany({
    where: {
      clubId,
    },
    include: {
      user: true,
      reviewedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const reviewJoinRequest = (
  requestId: string,
  data: {
    status: ClubJoinRequestStatus;
    reviewedById: string;
  },
) => {
  return prisma.clubJoinRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: data.status,
      reviewedById: data.reviewedById,
      reviewedAt: new Date(),
    },
    include: {
      user: true,
      reviewedBy: true,
    },
  });
};

export const getJoinRequestForUser = (userId: string, clubId: string) => {
  return prisma.clubJoinRequest.findFirst({
    where: {
      userId,
      clubId,
    },
  });
};
