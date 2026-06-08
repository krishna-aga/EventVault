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

export interface MediaSummary {
  id: string;
  title: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  fileType: string;
  fileSize: number | null;
  uploadedAt: string;
  uploadedById: string;
  eventId: string;
  batchId: string | null;
  uploader?: UserSummary;
}

export interface CommentSummary {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  mediaId: string;
  user?: UserSummary;
}

export interface LikeSummary {
  id: string;
  userId: string;
  mediaId: string;
  createdAt: string;
  user?: UserSummary;
}

export interface FavouriteSummary {
  id: string;
  userId: string;
  mediaId: string;
  createdAt: string;
  media?: MediaSummary;
}

export interface NotificationSummary {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  clubId?: string;
  startDate?: string;
  endDate?: string;
  uploaderId?: string;
  tag?: string;
}

