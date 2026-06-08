export type EventVisibility = "PUBLIC" | "PRIVATE";

export type EventSortBy = "title" | "eventDate" | "category";

export type EventSortOrder = "asc" | "desc";

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClubSummary {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  createdById: string;
  createdAt: string;
}

export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: EventVisibility;
  location: string | null;
  eventDate: string;
  coverImage: string | null;
  createdAt: string;
  createdById: string;
  clubId: string | null;
  creator: UserSummary;
  club: ClubSummary | null;
}

export interface EventInput {
  title: string;
  description?: string;
  category: string;
  visibility: EventVisibility;
  location?: string;
  eventDate: string;
  coverImage?: string;
  clubId?: string | null;
}

export interface EventFilters {
  sortBy?: EventSortBy;
  sortOrder?: EventSortOrder;
  category?: string;
  clubId?: string;
  visibility?: EventVisibility;
}
