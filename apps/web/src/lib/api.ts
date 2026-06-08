import type {
  ApiResponse,
  ClubSummary,
  EventFilters,
  EventInput,
  EventSummary,
  UserSummary,
  MediaSummary,
  CommentSummary,
  LikeSummary,
  FavouriteSummary,
  NotificationSummary,
  SearchFilters,
} from "@repo/contracts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: UserSummary;
  tokens: SessionTokens;
}

const request = async <T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json()) as ApiResponse<T> | { success: false; message: string };

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message);
  }

  return payload.data;
};

export const api = {
  register: (name: string, email: string, password: Exclude<string, "">, role: string) =>
    request<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    }),
  login: (email: string, password: Exclude<string, "">) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (accessToken: string) => request<{ user: UserSummary }>("/auth/me", {}, accessToken),
  
  // Clubs
  listClubs: () => request<{ clubs: ClubSummary[] }>("/clubs"),
  createClub: (payload: { name: string; description?: string; logoUrl?: string }, accessToken: string) =>
    request<{ club: ClubSummary }>(
      "/clubs",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      accessToken,
    ),
  joinClub: (clubId: string, accessToken: string) =>
    request<any>(
      `/clubs/${clubId}/join`,
      {
        method: "POST",
      },
      accessToken,
    ),
  leaveClub: (clubId: string, accessToken: string) =>
    request<any>(
      `/clubs/${clubId}/leave`,
      {
        method: "POST",
      },
      accessToken,
    ),
  listJoinRequests: (clubId: string, accessToken: string) =>
    request<{ requests: any[] }>(`/clubs/${clubId}/join-requests`, {}, accessToken),
  reviewJoinRequest: (
    clubId: string,
    requestId: string,
    status: "APPROVED" | "REJECTED",
    accessToken: string,
  ) =>
    request<any>(
      `/clubs/${clubId}/join-requests/${requestId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      accessToken,
    ),
  listClubMembers: (clubId: string) =>
    request<{ members: any[] }>(`/clubs/${clubId}/members`),

  // Events
  listEvents: (filters: EventFilters) => {
    const params = new URLSearchParams();

    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters.category) params.set("category", filters.category);
    if (filters.clubId) params.set("clubId", filters.clubId);
    if (filters.visibility) params.set("visibility", filters.visibility);

    return request<{ events: EventSummary[] }>(`/events?${params.toString()}`);
  },
  createEvent: (payload: EventInput, accessToken: string) =>
    request<{ event: EventSummary }>(
      "/events",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      accessToken,
    ),
  updateEvent: (
    eventId: string,
    payload: Partial<EventInput>,
    accessToken: string,
  ) =>
    request<{ event: EventSummary }>(
      `/events/${eventId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      accessToken,
    ),
  deleteEvent: (eventId: string, accessToken: string) =>
    request<null>(
      `/events/${eventId}`,
      {
        method: "DELETE",
      },
      accessToken,
    ),

  // Media Management (Phases 5-6)
  uploadMedia: async (
    eventId: string,
    files: File[],
    title: string | undefined,
    accessToken: string,
  ): Promise<MediaSummary[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (title) {
      formData.append("title", title);
    }

    const response = await fetch(`${API_BASE_URL}/media/events/${eventId}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const payload = (await response.json()) as ApiResponse<MediaSummary[]> | { success: false; message: string };

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message);
    }

    return payload.data;
  },

  listMedia: (eventId: string, accessToken: string) =>
    request<{ media: MediaSummary[] }>(`/media/events/${eventId}/media`, {}, accessToken),

  deleteMedia: (mediaId: string, accessToken: string) =>
    request<null>(`/media/${mediaId}`, { method: "DELETE" }, accessToken),

  // Social (Phase 7)
  toggleLike: (mediaId: string, accessToken: string) =>
    request<{ liked: boolean; like?: LikeSummary }>(
      `/media/${mediaId}/like`,
      { method: "POST" },
      accessToken,
    ),

  listLikes: (mediaId: string) =>
    request<{ count: number; users: UserSummary[] }>(`/media/${mediaId}/likes`),

  addComment: (mediaId: string, content: string, accessToken: string) =>
    request<CommentSummary>(
      `/media/${mediaId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      accessToken,
    ),

  listComments: (mediaId: string) =>
    request<{ comments: CommentSummary[] }>(`/media/${mediaId}/comments`),

  deleteComment: (commentId: string, accessToken: string) =>
    request<null>(`/media/comments/${commentId}`, { method: "DELETE" }, accessToken),

  toggleFavourite: (mediaId: string, accessToken: string) =>
    request<{ favourited: boolean; favourite?: FavouriteSummary }>(
      `/media/${mediaId}/favourite`,
      { method: "POST" },
      accessToken,
    ),

  listFavourites: (accessToken: string) =>
    request<{ favourites: FavouriteSummary[] }>(`/media/me`, {}, accessToken),

  // Notifications (Phase 8)
  listNotifications: (accessToken: string) =>
    request<{ notifications: NotificationSummary[] }>("/notifications", {}, accessToken),

  readNotification: (notificationId: string, accessToken: string) =>
    request<NotificationSummary>(
      `/notifications/${notificationId}/read`,
      { method: "PATCH" },
      accessToken,
    ),

  readAllNotifications: (accessToken: string) =>
    request<null>("/notifications/read-all", { method: "POST" }, accessToken),

  // Search & Discovery (Phase 9)
  search: (filters: SearchFilters) => {
    const params = new URLSearchParams();

    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.clubId) params.set("clubId", filters.clubId);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.uploaderId) params.set("uploaderId", filters.uploaderId);
    if (filters.tag) params.set("tag", filters.tag);

    return request<{ events: EventSummary[] }>(`/search?${params.toString()}`);
  },
};
