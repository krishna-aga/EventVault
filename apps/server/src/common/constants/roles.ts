export const ROLES = [
  "ADMIN",
  "PHOTOGRAPHER",
  "CLUB_MEMBER",
  "VIEWER",
] as const;

export type RoleName = (typeof ROLES)[number];

export const REGISTERABLE_ROLES: RoleName[] = [
  "PHOTOGRAPHER",
  "CLUB_MEMBER",
  "VIEWER",
];

export const CLUB_MEMBER_ROLES = [
  "OWNER",
  "ADMIN",
  "MEMBER",
] as const;

export type ClubMemberRole = (typeof CLUB_MEMBER_ROLES)[number];

export type ClubJoinRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
