export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "User logged in successfully",
  REFRESH_SUCCESS: "Session refreshed successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  PROFILE_FETCHED: "Current user fetched successfully",
} as const;

export const CLUB_MESSAGES = {
  LIST_FETCHED: "Clubs fetched successfully",
  FETCHED: "Club fetched successfully",
  CREATED: "Club created successfully",
  UPDATED: "Club updated successfully",
  DELETED: "Club deleted successfully",
  JOINED: "Join request created successfully",
  LEFT: "Club left successfully",
  MEMBERS_FETCHED: "Club members fetched successfully",
  MY_CLUBS_FETCHED: "My clubs fetched successfully",
  JOIN_REQUESTS_FETCHED: "Join requests fetched successfully",
  JOIN_REQUEST_CREATED: "Join request created successfully",
  JOIN_REQUEST_REVIEWED: "Join request reviewed successfully",
  MEMBER_ROLE_UPDATED: "Club member role updated successfully",
  MEMBER_REMOVED: "Club member removed successfully",
} as const;

export const COMMON_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Request validation failed",
} as const;
