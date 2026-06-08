import type {
  ApiResponse,
  ClubSummary,
  EventFilters,
  EventInput,
  EventSummary,
  UserSummary,
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
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (accessToken: string) => request<{ user: UserSummary }>("/auth/me", {}, accessToken),
  listClubs: () => request<{ clubs: ClubSummary[] }>("/clubs"),
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
};
