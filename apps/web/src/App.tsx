import { useEffect, useState, type FormEvent } from "react";
import type {
  ClubSummary,
  EventFilters,
  EventInput,
  EventSortBy,
  EventSortOrder,
  EventSummary,
  EventVisibility,
  UserSummary,
  MediaSummary,
  CommentSummary,
  NotificationSummary,
  SearchFilters,
} from "@repo/contracts";
import { api, type SessionTokens } from "./lib/api";
import { io, type Socket } from "socket.io-client";
import "./App.css";

const PRESET_MEDIAS = [
  {
    id: "preset-concert",
    name: "Concert Lights",
    url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop",
    type: "photo" as const,
  },
  {
    id: "preset-sports",
    name: "Stadium Crowd",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop",
    type: "photo" as const,
  },
  {
    id: "preset-exhibition",
    name: "Art Gallery",
    url: "https://images.unsplash.com/photo-1531058020387-3be344559be6?w=800&auto=format&fit=crop",
    type: "photo" as const,
  },
  {
    id: "preset-meetup",
    name: "Tech Gathering",
    url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop",
    type: "photo" as const,
  },
];

const CATEGORIES = ["all", "Concert", "Sports", "Exhibition", "Meetup", "Social", "Other"];

type ViewPage = "feed" | "clubs" | "upload" | "profile" | "notifications" | "search";

type EventDraft = {
  title: string;
  description: string;
  category: string;
  visibility: EventVisibility;
  location: string;
  eventDate: string;
  coverImage: string;
  clubId: string;
};

type ClubDraft = {
  name: string;
  description: string;
  logoUrl: string;
};

type SessionForm = {
  email: string;
  password: Exclude<string, "">;
  name?: string;
  role?: string;
};

const STORAGE_KEY = "eventvault.session";

const emptyDraft = (): EventDraft => ({
  title: "",
  description: "",
  category: "Concert",
  visibility: "PUBLIC",
  location: "",
  eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  coverImage: "",
  clubId: "",
});

const emptyClubDraft = (): ClubDraft => ({
  name: "",
  description: "",
  logoUrl: "",
});

const toDraft = (event: EventSummary): EventDraft => ({
  title: event.title,
  description: event.description ?? "",
  category: event.category,
  visibility: event.visibility,
  location: event.location ?? "",
  eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
  coverImage: event.coverImage ?? "",
  clubId: event.clubId ?? "",
});

const toPayload = (draft: EventDraft): EventInput => ({
  title: draft.title.trim(),
  description: draft.description.trim() || undefined,
  category: draft.category.trim(),
  visibility: draft.visibility,
  location: draft.location.trim() || undefined,
  eventDate: new Date(draft.eventDate).toISOString(),
  coverImage: draft.coverImage.trim() || undefined,
  clubId: draft.clubId.trim() || null,
});

const getInitialSession = (): SessionTokens | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionTokens;
  } catch {
    return null;
  }
};

function App() {
  // Navigation
  const [view, setView] = useState<ViewPage>("feed");
  const [activeAuthTab, setActiveAuthTab] = useState<"signin" | "signup">("signin");
  const [selectedFeedEventId, setSelectedFeedEventId] = useState<string | null>(null);

  // Core Authentication States
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [session, setSession] = useState<SessionTokens | null>(getInitialSession);
  
  // Real DB Data Lists
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  
  // Media & Social State per ID
  const [eventMedia, setEventMedia] = useState<Record<string, MediaSummary[]>>({});
  const [activeMediaCarouselIndex, setActiveMediaCarouselIndex] = useState<Record<string, number>>({});
  const [mediaLikes, setMediaLikes] = useState<Record<string, { count: number; users: UserSummary[] }>>({});
  const [mediaComments, setMediaComments] = useState<Record<string, CommentSummary[]>>({});
  const [mediaFavourites, setMediaFavourites] = useState<string[]>([]); // list of favourited media IDs

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);

  // Forms
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    email: "",
    password: "",
    name: "",
    role: "VIEWER",
  });
  const [eventDraft, setEventDraft] = useState<EventDraft>(emptyDraft);
  const [clubDraft, setClubDraft] = useState<ClubDraft>(emptyClubDraft);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Modals Toggles
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);

  // Event Filters
  const [sortBy, setSortBy] = useState<EventSortBy>("eventDate");
  const [sortOrder, setSortOrder] = useState<EventSortOrder>("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | EventVisibility>("all");

  // Search View State
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    q: "",
    category: "",
    clubId: "",
    startDate: "",
    endDate: "",
  });
  const [searchResults, setSearchResults] = useState<EventSummary[]>([]);

  const userEvents = currentUser ? events.filter((evt) => evt.createdById === currentUser.id) : [];

  // Explore Club Drawer States
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [clubTab, setClubTab] = useState<"members" | "requests" | "events">("members");
  const [clubMembersMap, setClubMembersMap] = useState<Record<string, any[]>>({});
  const [clubRequestsMap, setClubRequestsMap] = useState<Record<string, any[]>>({});

  // Real Upload States
  type UploadPreview = {
    file: File;
    previewUrl: string;
    caption: string;
    tags: string;
    category: string;
    people: UserSummary[];
    status: "idle" | "analyzing" | "done" | "error";
  };
  const [uploadSelectedEventId, setUploadSelectedEventId] = useState("");
  const [uploadMediaSource, setUploadMediaSource] = useState<"local" | "preset">("local");
  const [uploadPresetId, setUploadPresetId] = useState(PRESET_MEDIAS[0].id);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<UploadPreview[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Phase 10 AI Features States
  const [profileActiveTab, setProfileActiveTab] = useState<"events" | "albums" | "tagged">("events");
  const [taggedMedia, setTaggedMedia] = useState<MediaSummary[]>([]);
  const [userUploadedMedia, setUserUploadedMedia] = useState<MediaSummary[]>([]);
  const [selectedViewMedia, setSelectedViewMedia] = useState<MediaSummary | null>(null);

  // Toast Notifier
  const [toast, setToast] = useState<{ message: string; type: "ok" | "warn" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const triggerToast = (message: string, type: "ok" | "warn" = "ok") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync token pair and fetch user profile
  useEffect(() => {
    if (!session) {
      setCurrentUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    const syncSession = async () => {
      try {
        const payload = await api.me(session.accessToken);
        setCurrentUser(payload.user);
      } catch (err) {
        setCurrentUser(null);
        setSession(null);
        triggerToast("Session expired, please sign in again.", "warn");
      }
    };
    void syncSession();
  }, [session]);

  // WebSockets Real-Time Notifications Connection
  useEffect(() => {
    if (!currentUser || !session) return;

    const socketUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api")
      .replace("/api", "");

    const socket: Socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("register", currentUser.id);
    });

    socket.on("notification", (notif: NotificationSummary) => {
      triggerToast(`Real-Time Notification: ${notif.message}`, "ok");
      // Prepend to notifications list
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, session]);

  // Load Main Feed & Dashboard Data
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const filters: EventFilters = {
        sortBy,
        sortOrder,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        clubId: clubFilter === "all" ? undefined : clubFilter,
        visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
      };

      const [eventPayload, clubPayload] = await Promise.all([
        api.listEvents(filters),
        api.listClubs(),
      ]);

      setEvents(eventPayload.events);
      setClubs(clubPayload.clubs);

      if (session) {
        // Load S3 media and metadata for events
        const mediaMap: Record<string, MediaSummary[]> = {};
        await Promise.all(
          eventPayload.events.map(async (evt) => {
            try {
              const res = await api.listMedia(evt.id, session.accessToken);
              mediaMap[evt.id] = res.media;
            } catch {
              mediaMap[evt.id] = [];
            }
          })
        );
        setEventMedia(mediaMap);

        // Fetch notifications & favourites list
        const [notifRes, favsRes] = await Promise.all([
          api.listNotifications(session.accessToken),
          api.listFavourites(session.accessToken),
        ]);
        setNotifications(notifRes.notifications);
        setMediaFavourites(favsRes.favourites.map((f) => f.mediaId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database files");
      triggerToast("Error connecting to server database", "warn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [sortBy, sortOrder, categoryFilter, clubFilter, visibilityFilter, session]);

  // Fetch comments and likes details for a specific media item
  const fetchMediaDetails = async (mediaId: string) => {
    if (mediaLikes[mediaId] && mediaComments[mediaId]) return;
    try {
      const [likesPayload, commentsPayload] = await Promise.all([
        api.listLikes(mediaId),
        api.listComments(mediaId),
      ]);
      setMediaLikes((prev) => ({ ...prev, [mediaId]: likesPayload }));
      setMediaComments((prev) => ({ ...prev, [mediaId]: commentsPayload.comments }));
    } catch (err) {
      console.error("Failed to load details for media:", mediaId, err);
    }
  };

  // Load expanded club members/requests
  const loadClubDetails = async (clubId: string) => {
    try {
      const membersPayload = await api.listClubMembers(clubId);
      setClubMembersMap((prev) => ({ ...prev, [clubId]: membersPayload.members }));

      if (session) {
        const requestsPayload = await api.listJoinRequests(clubId, session.accessToken);
        setClubRequestsMap((prev) => ({ ...prev, [clubId]: requestsPayload.requests }));
      }
    } catch (err) {
      console.warn("Failed to load club details:", err);
    }
  };

  useEffect(() => {
    if (expandedClubId) {
      void loadClubDetails(expandedClubId);
    }
  }, [expandedClubId]);

  useEffect(() => {
    if (view === "profile" && session) {
      void loadTaggedMedia();
      void loadUserUploadedMedia();
    }
  }, [view, session]);

  useEffect(() => {
    if (selectedViewMedia) {
      void fetchMediaDetails(selectedViewMedia.id);
    }
  }, [selectedViewMedia]);

  // Trigger search query
  const triggerSearch = async (e?: FormEvent, filterOverrides?: SearchFilters) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = await api.search(filterOverrides || searchFilters);
      setSearchResults(payload.events);
      if (session) {
        const mediaMap = { ...eventMedia };
        await Promise.all(
          payload.events.map(async (evt) => {
            if (!mediaMap[evt.id]) {
              try {
                const res = await api.listMedia(evt.id, session.accessToken);
                mediaMap[evt.id] = res.media;
              } catch {
                mediaMap[evt.id] = [];
              }
            }
          })
        );
        setEventMedia(mediaMap);
      }
      setView("search");
    } catch (err) {
      triggerToast("Search failed", "warn");
    } finally {
      setLoading(false);
    }
  };

  // Authentication logic
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setWorking(true);
    try {
      const payload = await api.login(sessionForm.email, sessionForm.password);
      setSession(payload.tokens);
      setCurrentUser(payload.user);
      setSessionForm({ email: "", password: "", name: "", role: "VIEWER" });
      setView("feed");
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Authentication error", "warn");
    } finally {
      setWorking(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setWorking(true);
    try {
      const payload = await api.register(
        sessionForm.name || "User",
        sessionForm.email,
        sessionForm.password,
        sessionForm.role || "VIEWER",
      );
      setSession(payload.tokens);
      setCurrentUser(payload.user);
      setSessionForm({ email: "", password: "", name: "", role: "VIEWER" });
      setView("feed");
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Signup failed", "warn");
    } finally {
      setWorking(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentUser(null);
    setView("feed");
    triggerToast("Logged out successfully");
  };

  // Event Save CRUD
  const handleSaveEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setWorking(true);
    try {
      const payload = toPayload(eventDraft);
      if (selectedEventId) {
        await api.updateEvent(selectedEventId, payload, session.accessToken);
        triggerToast("Event successfully updated!");
      } else {
        await api.createEvent(payload, session.accessToken);
        triggerToast("Event successfully scheduled!");
      }
      setIsEventModalOpen(false);
      setSelectedEventId(null);
      setEventDraft(emptyDraft());
      await loadData();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Failed to save event", "warn");
    } finally {
      setWorking(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!session || !window.confirm("Are you sure you want to delete this event?")) return;
    setWorking(true);
    try {
      await api.deleteEvent(eventId, session.accessToken);
      triggerToast("Event successfully deleted.");
      setIsEventModalOpen(false);
      setSelectedEventId(null);
      await loadData();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Delete failed", "warn");
    } finally {
      setWorking(false);
    }
  };

  // Club save/management
  const handleCreateClub = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setWorking(true);
    try {
      await api.createClub(clubDraft, session.accessToken);
      triggerToast("Club successfully formed!");
      setIsClubModalOpen(false);
      setClubDraft(emptyClubDraft());
      await loadData();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Forming club failed", "warn");
    } finally {
      setWorking(false);
    }
  };

  const handleToggleJoinClub = async (clubId: string, isMember: boolean) => {
    if (!session) return;
    try {
      if (isMember) {
        await api.leaveClub(clubId, session.accessToken);
        triggerToast("Left club");
      } else {
        await api.joinClub(clubId, session.accessToken);
        triggerToast("Requested to join club");
      }
      await loadClubDetails(clubId);
      await loadData();
    } catch (err) {
      triggerToast("Membership request failed", "warn");
    }
  };

  const handleReviewJoinRequest = async (clubId: string, reqId: string, approve: boolean) => {
    if (!session) return;
    try {
      await api.reviewJoinRequest(clubId, reqId, approve ? "APPROVED" : "REJECTED", session.accessToken);
      triggerToast(approve ? "Request approved" : "Request rejected");
      await loadClubDetails(clubId);
    } catch (err) {
      triggerToast("Action failed", "warn");
    }
  };

  const handleUpdateMemberRole = async (clubId: string, memberId: string, role: string) => {
    if (!session) return;
    try {
      await api.updateMemberRole(clubId, memberId, role, session.accessToken);
      triggerToast("Member role updated successfully");
      await loadClubDetails(clubId);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Failed to update role", "warn");
    }
  };

  const handleRemoveMember = async (clubId: string, memberId: string) => {
    if (!session || !window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.removeMember(clubId, memberId, session.accessToken);
      triggerToast("Member removed from club");
      await loadClubDetails(clubId);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Failed to remove member", "warn");
    }
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    if (!session) return;
    const newPreviews = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      const previewItem: UploadPreview = {
        file,
        previewUrl,
        caption: "",
        tags: "",
        category: "Other",
        people: [],
        status: "analyzing"
      };

      api.analyzeMedia(file, session.accessToken)
        .then((res) => {
          setUploadPreviews((prev) =>
            prev.map((item) =>
              item.previewUrl === previewUrl
                ? {
                    ...item,
                    caption: res.caption || "",
                    tags: res.tags ? res.tags.join(", ") : "",
                    people: res.people || [],
                    status: "done"
                  }
                : item
            )
          );
        })
        .catch((err) => {
          console.error("AI analysis failed for file:", file.name, err);
          setUploadPreviews((prev) =>
            prev.map((item) =>
              item.previewUrl === previewUrl ? { ...item, status: "error" as const } : item
            )
          );
        });

      return previewItem;
    });

    setUploadPreviews((prev) => [...prev, ...newPreviews]);
  };

  // S3 / Backend File Upload handler
  const handleUploadMedia = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!uploadSelectedEventId) {
      triggerToast("Please select an event target", "warn");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      let filesToUpload: File[] = [];
      let metaArray: any[] = [];

      if (uploadMediaSource === "local") {
        if (uploadPreviews.length === 0) {
          throw new Error("Select files to upload");
        }
        filesToUpload = uploadPreviews.map((p) => p.file);
        metaArray = uploadPreviews.map((p) => ({
          caption: p.caption,
          tags: p.tags.split(",").map((t) => t.trim()).filter(Boolean),
          category: p.category,
          peopleIds: p.people.map((u) => u.id)
        }));
      } else {
        // Convert Preset URL to File Blob
        const preset = PRESET_MEDIAS.find((p) => p.id === uploadPresetId);
        if (!preset) throw new Error("Preset invalid");
        setUploadProgress(40);
        const response = await fetch(preset.url);
        const blob = await response.blob();
        const file = new File([blob], `${preset.id}.jpg`, { type: "image/jpeg" });
        filesToUpload = [file];
        metaArray = [{
          caption: uploadTitle || "Preset Image",
          tags: ["preset"],
          category: "Other",
          peopleIds: []
        }];
      }

      setUploadProgress(70);
      const results = await api.uploadMedia(
        uploadSelectedEventId,
        filesToUpload,
        undefined,
        session.accessToken,
        JSON.stringify(metaArray)
      );

      setUploadProgress(100);
      triggerToast(`Successfully uploaded ${results.length} media file(s)!`);
      
      // Update state local mapping
      setEventMedia((prev) => ({
        ...prev,
        [uploadSelectedEventId]: [...results, ...(prev[uploadSelectedEventId] || [])],
      }));

      // Cleanup uploader state
      setUploadPreviews([]);
      setUploadTitle("");
      setView("feed");
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "File upload failed", "warn");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const loadTaggedMedia = async () => {
    if (!session) return;
    try {
      const res = await api.listTaggedMedia(session.accessToken);
      setTaggedMedia(res.media);
    } catch (err) {
      console.error("Failed to load tagged media:", err);
    }
  };

  const loadUserUploadedMedia = async () => {
    if (!session) return;
    try {
      const res = await api.listUserMedia(session.accessToken);
      setUserUploadedMedia(res.media);
    } catch (err) {
      console.error("Failed to load user uploaded media:", err);
    }
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!session) return;
    setWorking(true);
    try {
      await api.uploadSelfie(files[0], session.accessToken);
      triggerToast("Reference selfie uploaded and face print indexed!");
      const payload = await api.me(session.accessToken);
      setCurrentUser(payload.user);
    } catch (err: any) {
      triggerToast(err.message || "Failed to upload selfie", "warn");
    } finally {
      setWorking(false);
    }
  };

  // Social Toggle Handlers
  const handleLikeMedia = async (mediaId: string) => {
    if (!session) return;
    try {
      const res = await api.toggleLike(mediaId, session.accessToken);
      const likesPayload = await api.listLikes(mediaId);
      setMediaLikes((prev) => ({ ...prev, [mediaId]: likesPayload }));
      triggerToast(res.liked ? "Liked photo" : "Unliked photo");
    } catch (err) {
      triggerToast("Toggle like failed", "warn");
    }
  };

  const handleFavouriteMedia = async (mediaId: string) => {
    if (!session) return;
    try {
      const res = await api.toggleFavourite(mediaId, session.accessToken);
      if (res.favourited) {
        setMediaFavourites((prev) => [...prev, mediaId]);
        triggerToast("Saved to Favourites");
      } else {
        setMediaFavourites((prev) => prev.filter((id) => id !== mediaId));
        triggerToast("Removed from Favourites");
      }
    } catch (err) {
      triggerToast("Favourite action failed", "warn");
    }
  };

  const handleCommentMedia = async (mediaId: string, text: string) => {
    if (!session) return;
    try {
      const comm = await api.addComment(mediaId, text, session.accessToken);
      setMediaComments((prev) => ({
        ...prev,
        [mediaId]: [...(prev[mediaId] || []), comm],
      }));
      triggerToast("Comment posted!");
    } catch (err) {
      triggerToast("Posting comment failed", "warn");
    }
  };

  const handleDeleteMedia = async (mediaId: string, eventId: string) => {
    if (!session || !window.confirm("Are you sure you want to delete this media item?")) return;
    try {
      await api.deleteMedia(mediaId, session.accessToken);
      setEventMedia((prev) => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter((m) => m.id !== mediaId),
      }));
      triggerToast("Media deleted.");
    } catch (err) {
      triggerToast("Delete failed", "warn");
    }
  };

  // Notification reads
  const handleReadNotification = async (notifId: string) => {
    if (!session) return;
    try {
      await api.readNotification(notifId, session.accessToken);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAllNotifications = async () => {
    if (!session) return;
    try {
      await api.readAllNotifications(session.accessToken);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      triggerToast("All notifications marked as read");
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (val: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(new Date(val));
    } catch {
      return val;
    }
  };

  const Icon = {
    Briefcase: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    Home: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    Clubs: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    Upload: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Profile: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    Heart: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    Comment: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    Bell: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    Search: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    Calendar: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    MapPin: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Close: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    Plus: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    Edit: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    Trash: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    Lock: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    Logout: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    ChevronLeft: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    ),
    ChevronRight: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
    Bookmark: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    Compass: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  const getMediaSourceUrl = (pathUrl: string) => {
    if (pathUrl.startsWith("http://") || pathUrl.startsWith("https://")) {
      return pathUrl;
    }
    const apiHost = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api")
      .replace("/api", "");
    return `${apiHost}${pathUrl}`;
  };

  // Auth Guard
  if (!currentUser) {
    return (
      <div className="auth-gate">
        <div className="auth-mesh" />
        <main className="auth-container">
          <header className="auth-header">
            <h1>EventVault</h1>
            <p>Connect and share your club events & media</p>
          </header>

          <nav className="auth-tabs" aria-label="Auth forms toggle">
            <button
              id="signin-tab-btn"
              type="button"
              className={`auth-tab-btn ${activeAuthTab === "signin" ? "active" : ""}`}
              onClick={() => setActiveAuthTab("signin")}
            >
              Sign In
            </button>
            <button
              id="signup-tab-btn"
              type="button"
              className={`auth-tab-btn ${activeAuthTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveAuthTab("signup")}
            >
              Sign Up
            </button>
          </nav>

          {activeAuthTab === "signin" ? (
            <form id="signin-form" className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="signin-email">Email Address</label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={sessionForm.email}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signin-password">Password</label>
                <input
                  id="signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="••••••••"
                  value={sessionForm.password}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, password: e.target.value as Exclude<string, ""> }))}
                  required
                />
              </div>
              <button id="signin-submit-btn" type="submit" className="form-submit-btn" disabled={working}>
                {working ? "Connecting..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form id="signup-form" className="auth-form" onSubmit={handleSignup}>
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="form-input"
                  placeholder="Aarav Sharma"
                  value={sessionForm.name || ""}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={sessionForm.email}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={sessionForm.password}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, password: e.target.value as Exclude<string, ""> }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-role">Join As</label>
                <select
                  id="signup-role"
                  className="form-select"
                  value={sessionForm.role || "VIEWER"}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="CLUB_MEMBER">Club Member</option>
                  <option value="PHOTOGRAPHER">Photographer</option>
                </select>
              </div>
              <button id="signup-submit-btn" type="submit" className="form-submit-btn" disabled={working}>
                {working ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
        </main>

        {toast && (
          <div className="global-status-toast" role="status">
            <span className={`global-status-dot ${toast.type}`} />
            <span className="toast-msg">{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const handleDownloadMedia = async (mediaId: string, filename: string) => {
    if (!session) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api"}/media/${mediaId}/download`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      triggerToast("Download successful!");
    } catch (err) {
      triggerToast("Failed to download watermarked file", "warn");
    }
  };

  const renderHomeEventCards = (eventsToRender: EventSummary[]) => {
    return (
      <div className="events-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px", padding: "12px 0" }}>
        {eventsToRender.map((evt) => {
          return (
            <article
              key={evt.id}
              className="event-card"
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onClick={() => setSelectedFeedEventId(evt.id)}
            >
              <div style={{ width: "100%", height: "200px", overflow: "hidden", position: "relative" }}>
                {evt.coverImage ? (
                  <img src={getMediaSourceUrl(evt.coverImage)} alt={evt.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #6366f1, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "2rem", fontWeight: "700" }}>
                    {evt.title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600", color: "#fff" }}>
                  {evt.category}
                </div>
              </div>
              <div style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>{evt.title}</h3>
                {evt.description && <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" }}>{evt.description}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon.Calendar /> {formatDate(evt.eventDate)}
                  </span>
                  <span>{evt.club?.name || "Standalone"}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderEventAlbumFeed = (eventId: string) => {
    const list = eventMedia[eventId] || [];
    
    // Group media by batchId (album carousel)
    const batchMap: Record<string, MediaSummary[]> = {};
    const singletons: MediaSummary[] = [];

    list.forEach((item) => {
      if (item.batchId) {
        if (!batchMap[item.batchId]) {
          batchMap[item.batchId] = [];
        }
        batchMap[item.batchId].push(item);
      } else {
        singletons.push(item);
      }
    });

    const groupedPosts: { id: string; media: MediaSummary[]; uploader?: UserSummary; date: string }[] = [];

    Object.entries(batchMap).forEach(([batchId, items]) => {
      groupedPosts.push({
        id: batchId,
        media: items,
        uploader: items[0]?.uploader,
        date: items[0]?.uploadedAt || new Date().toISOString(),
      });
    });

    singletons.forEach((item) => {
      groupedPosts.push({
        id: item.id,
        media: [item],
        uploader: item.uploader,
        date: item.uploadedAt,
      });
    });

    groupedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (groupedPosts.length === 0) {
      return (
        <div className="empty-placeholder">
          <Icon.Compass />
          <h4>No Photos or Videos Uploaded Yet</h4>
          <p>Be the first to upload media under this event album!</p>
        </div>
      );
    }

    return (
      <div className="feed-stream" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {groupedPosts.map((post) => {
          const activeIndex = activeMediaCarouselIndex[post.id] || 0;
          const activeMedia = post.media[activeIndex];
          const primaryMedia = post.media[0]; // combined post likes/comments target

          if (primaryMedia) {
            void fetchMediaDetails(primaryMedia.id);
          }

          const currentLike = primaryMedia ? mediaLikes[primaryMedia.id] : null;
          const currentComments = primaryMedia ? mediaComments[primaryMedia.id] : [];
          const isLiked = primaryMedia ? (currentLike?.users.some((u) => u.id === currentUser?.id) || false) : false;
          const likeCount = primaryMedia ? (currentLike?.count || 0) : 0;
          const isFav = primaryMedia ? mediaFavourites.includes(primaryMedia.id) : false;

          return (
            <article key={post.id} className="post-card" style={{ marginBottom: "28px", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", background: "var(--bg-secondary)" }}>
              {/* Header */}
              <header className="post-header" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="post-author" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="post-author-avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#4f46e5", display: "grid", placeItems: "center", fontWeight: "600" }}>
                    {post.uploader?.name ? post.uploader.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="post-author-info">
                    <span className="post-author-name" style={{ fontWeight: "600", fontSize: "0.9rem" }}>{post.uploader?.name || "Photographer"}</span>
                    <span className="post-meta-details" style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{formatDate(post.date)}</span>
                  </div>
                </div>
              </header>

              {/* Media Carousel */}
              <div className="post-media-container" style={{ position: "relative", background: "#050505", minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {activeMedia ? (
                  activeMedia.fileType === "video" ? (
                    <video
                      src={getMediaSourceUrl(activeMedia.fileUrl)}
                      className="post-media"
                      controls
                      style={{ width: "100%", maxHeight: "500px", objectFit: "contain" }}
                    />
                  ) : (
                    <img
                      src={getMediaSourceUrl(activeMedia.fileUrl)}
                      alt={activeMedia.title || "Album item"}
                      className="post-media"
                      style={{ width: "100%", maxHeight: "500px", objectFit: "contain" }}
                    />
                  )
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Loading media...</span>
                )}

                {/* Slides arrows */}
                {post.media.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="carousel-btn prev"
                      style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
                      onClick={() => {
                        setActiveMediaCarouselIndex((prev) => ({
                          ...prev,
                          [post.id]: (activeIndex - 1 + post.media.length) % post.media.length,
                        }));
                      }}
                    >
                      <Icon.ChevronLeft />
                    </button>
                    <button
                      type="button"
                      className="carousel-btn next"
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}
                      onClick={() => {
                        setActiveMediaCarouselIndex((prev) => ({
                          ...prev,
                          [post.id]: (activeIndex + 1) % post.media.length,
                        }));
                      }}
                    >
                      <Icon.ChevronRight />
                    </button>
                    <div className="carousel-dots" style={{ position: "absolute", bottom: "12px", width: "100%", display: "flex", justifyContent: "center", gap: "6px" }}>
                      {post.media.map((_, idx) => (
                        <div
                          key={idx}
                          className={`carousel-dot ${activeIndex === idx ? "active" : ""}`}
                          style={{ width: "6px", height: "6px", borderRadius: "50%", background: activeIndex === idx ? "#fff" : "rgba(255,255,255,0.4)" }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Delete Media Button */}
                {currentUser && activeMedia && (activeMedia.uploadedById === currentUser.id || post.uploader?.id === currentUser.id) && (
                  <button
                    type="button"
                    className="upload-preview-remove"
                    onClick={() => void handleDeleteMedia(activeMedia.id, eventId)}
                    style={{ position: "absolute", top: 12, right: 12 }}
                    title="Delete this media"
                  >
                    <Icon.Trash />
                  </button>
                )}
              </div>

              {/* Actions row */}
              <section className="post-content" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {primaryMedia ? (
                      <>
                        <button
                          type="button"
                          className={`post-action-btn ${isLiked ? "liked" : ""}`}
                          onClick={() => void handleLikeMedia(primaryMedia.id)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: isLiked ? "#ef4444" : "var(--text-primary)", cursor: "pointer" }}
                        >
                          <Icon.Heart />
                          <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>{likeCount}</span>
                        </button>
                        <button
                          type="button"
                          className={`post-action-btn ${isFav ? "liked" : ""}`}
                          onClick={() => void handleFavouriteMedia(primaryMedia.id)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: isFav ? "#eab308" : "var(--text-primary)", cursor: "pointer" }}
                        >
                          <Icon.Bookmark />
                          <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>{isFav ? "Saved" : "Save"}</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                  {activeMedia && (
                    <button
                      type="button"
                      className="post-action-btn"
                      onClick={() => void handleDownloadMedia(activeMedia.id, activeMedia.title || "eventvault_download.jpg")}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", cursor: "pointer", padding: "6px 12px", borderRadius: "20px", fontSize: "0.78rem" }}
                    >
                      <Icon.Upload /> {/* Acts as download icon */}
                      <span>Download</span>
                    </button>
                  )}
                </div>

                {/* Caption / Title */}
                {primaryMedia && (
                  <div style={{ marginBottom: "10px" }}>
                    <p style={{ fontSize: "0.88rem", lineHeight: "1.4" }}>
                      <strong style={{ marginRight: "8px" }}>{post.uploader?.name || "Photographer"}</strong>
                      {primaryMedia.title || "Event Album Capture"}
                    </p>
                  </div>
                )}

                {/* AI generated caption */}
                {activeMedia && activeMedia.aiCaption && (
                  <p className="post-ai-caption" style={{ fontStyle: "italic", color: "rgba(167, 139, 250, 1)", marginBottom: "10px", fontSize: "0.85rem" }}>
                    ✨ {activeMedia.aiCaption}
                  </p>
                )}

                {/* Tagged people list */}
                {activeMedia && activeMedia.tags && activeMedia.tags.length > 0 && (
                  <div className="post-tagged-users" style={{ margin: "10px 0 6px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--accent-primary)", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                      Tagged:
                    </span>
                    {activeMedia.tags.map((tagObj: any) => (
                      <span key={tagObj.id} className="tagged-user-badge" style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", color: "var(--accent-primary)", padding: "1px 8px", borderRadius: "12px", fontSize: "0.72rem" }}>
                        @{tagObj.user?.name || "User"}
                      </span>
                    ))}
                  </div>
                )}

                {/* Category tag */}
                {activeMedia && activeMedia.category && (
                  <div style={{ marginTop: "4px" }}>
                    <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "4px", color: "var(--text-muted)" }}>
                      Category: {activeMedia.category}
                    </span>
                  </div>
                )}
              </section>

              {/* Comments */}
              {primaryMedia && (
                <section className="post-comments-section" aria-label="Media comments" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", padding: "12px 16px" }}>
                  <div className="comments-list" style={{ maxHeight: "150px", overflowY: "auto", marginBottom: "10px" }}>
                    {(currentComments || []).map((c) => (
                      <div key={c.id} className="comment-item" style={{ display: "flex", gap: "8px", margin: "6px 0", fontSize: "0.85rem" }}>
                        <strong style={{ color: "var(--text-primary)" }}>{c.user?.name || "Member"}:</strong>
                        <span style={{ color: "var(--text-secondary)" }}>{c.content}</span>
                      </div>
                    ))}
                    {(currentComments || []).length === 0 && (
                      <p style={{ fontStyle: "italic", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        No comments yet.
                      </p>
                    )}
                  </div>
                  <form
                    className="comment-input-form"
                    style={{ display: "flex", gap: "10px" }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem("commentText") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        void handleCommentMedia(primaryMedia.id, input.value.trim());
                        input.value = "";
                      }
                    }}
                  >
                    <input
                      name="commentText"
                      type="text"
                      placeholder="Add a comment..."
                      className="comment-input"
                      style={{ flex: 1, padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "var(--bg-primary)", color: "#fff", fontSize: "0.85rem" }}
                      autoComplete="off"
                    />
                    <button type="submit" className="comment-submit-btn" style={{ padding: "6px 14px", borderRadius: "6px", background: "var(--accent-primary)", border: "none", color: "#fff", fontSize: "0.85rem", cursor: "pointer" }}>Post</button>
                  </form>
                </section>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Sidebar navigation">
        <div className="logo-container">
          <div className="logo-icon">
            <Icon.Briefcase />
          </div>
          <span className="logo-text">EventVault</span>
        </div>

        <nav className="nav-links">
          <button
            type="button"
            className={`nav-item ${view === "feed" ? "active" : ""}`}
            onClick={() => setView("feed")}
          >
            <Icon.Home />
            <span>Home Feed</span>
          </button>
          
          <button
            type="button"
            className={`nav-item ${view === "search" ? "active" : ""}`}
            onClick={() => {
              setSearchResults([]);
              setView("search");
            }}
          >
            <Icon.Search />
            <span>Search</span>
          </button>

          {currentUser && currentUser.role !== "VIEWER" && (
            <>
              <button
                type="button"
                className={`nav-item ${view === "clubs" ? "active" : ""}`}
                onClick={() => setView("clubs")}
              >
                <Icon.Clubs />
                <span>Explore Clubs</span>
              </button>
              
              <button
                type="button"
                className={`nav-item ${view === "upload" ? "active" : ""}`}
                onClick={() => setView("upload")}
              >
                <Icon.Upload />
                <span>Upload Media</span>
              </button>
            </>
          )}
          
          <button
            type="button"
            className={`nav-item ${view === "notifications" ? "active" : ""}`}
            onClick={() => setView("notifications")}
            style={{ position: "relative" }}
          >
            <Icon.Bell />
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <span className="badge badge--green" style={{
                position: "absolute",
                top: 8,
                right: 12,
                padding: "2px 6px",
                fontSize: "0.65rem"
              }}>
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${view === "profile" ? "active" : ""}`}
            onClick={() => setView("profile")}
          >
            <Icon.Profile />
            <span>My Profile</span>
          </button>
        </nav>

        <footer className="sidebar-profile">
          <div className="sidebar-avatar">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{currentUser.name}</span>
            <span className="sidebar-user-role">{currentUser.role}</span>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
          >
            <Icon.Logout />
          </button>
        </footer>
      </aside>

      <main className="app-workspace">
        {error && (
          <div className="form-error" style={{ marginBottom: "20px" }}>
            <strong>Database Offline / Server Down:</strong> {error}. Ensure you run `pnpm run dev` in the backend.
          </div>
        )}

        {/* PAGE: FEED */}
        {view === "feed" && (
          selectedFeedEventId ? (
            <section id="page-event-album" style={{ padding: "20px 0" }}>
              <header className="page-header" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  type="button"
                  className="sec-btn"
                  style={{ padding: "8px 16px", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={() => setSelectedFeedEventId(null)}
                >
                  <Icon.ChevronLeft />
                  <span>Back to Feed</span>
                </button>
                {(() => {
                  const activeEvent = events.find((e) => e.id === selectedFeedEventId);
                  return activeEvent ? (
                    <div>
                      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>{activeEvent.title}</h2>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Category: {activeEvent.category} | Date: {formatDate(activeEvent.eventDate)}
                      </span>
                    </div>
                  ) : null;
                })()}
              </header>
              {renderEventAlbumFeed(selectedFeedEventId)}
            </section>
          ) : (
            <section id="page-feed">
              <header className="page-header">
                <h2>Home Feed</h2>
                {currentUser && currentUser.role !== "VIEWER" && (
                  <button
                    type="button"
                    className="form-submit-btn"
                    style={{ margin: 0, padding: "10px 18px" }}
                    onClick={() => {
                      setEventDraft(emptyDraft());
                      setSelectedEventId(null);
                      setIsEventModalOpen(true);
                    }}
                  >
                    + New Event
                  </button>
                )}
              </header>

              <section className="feed-filters" aria-label="Filters">
                <div className="filter-controls">
                  <select
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as EventSortBy)}
                  >
                    <option value="eventDate">Sort by date</option>
                    <option value="title">Sort by title</option>
                    <option value="category">Sort by category</option>
                  </select>

                  <select
                    className="filter-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as EventSortOrder)}
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>

                  <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat}
                      </option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={clubFilter}
                    onChange={(e) => setClubFilter(e.target.value)}
                  >
                    <option value="all">All clubs</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={visibilityFilter}
                    onChange={(e) => setVisibilityFilter(e.target.value as "all" | EventVisibility)}
                  >
                    <option value="all">All visibility</option>
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
              </section>

              {loading && events.length === 0 ? (
                <div className="empty-placeholder">
                  <Icon.Calendar />
                  <h4>Loading items...</h4>
                </div>
              ) : events.length === 0 ? (
                <div className="empty-placeholder">
                  <Icon.Calendar />
                  <h4>No Event Albums Found</h4>
                  <p>Attach visual files to events to populate your feed.</p>
                </div>
              ) : (
                renderHomeEventCards(events)
              )}
            </section>
          )
        )}

        {/* PAGE: SEARCH & DISCOVERY (Phase 9) */}
        {view === "search" && (
          <section id="page-search">
            <header className="page-header">
              <h2>Search & Discover</h2>
            </header>

            <form className="feed-filters" onSubmit={triggerSearch} style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "stretch" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search titles, descriptions, locations..."
                  value={searchFilters.q || ""}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, q: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="form-submit-btn" style={{ margin: 0, padding: "10px 24px" }}>
                  Search
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Workshop"
                    value={searchFilters.category || ""}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>AI Tag</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. stage, group"
                    value={searchFilters.tag || ""}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, tag: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>Attached Club</label>
                  <select
                    className="form-select"
                    value={searchFilters.clubId || ""}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, clubId: e.target.value }))}
                  >
                    <option value="">Any Club</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>Starting Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={searchFilters.startDate || ""}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>Ending Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={searchFilters.endDate || ""}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </form>

            {loading ? (
              <div className="empty-placeholder">
                <Icon.Compass />
                <h4>Searching database...</h4>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="empty-placeholder">
                <Icon.Compass />
                <h4>No Matching Results</h4>
                <p>Refine your filters to discover standalone or club events.</p>
              </div>
            ) : selectedFeedEventId ? (
              <section id="page-event-album" style={{ padding: "20px 0" }}>
                <header className="page-header" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                  <button
                    type="button"
                    className="sec-btn"
                    style={{ padding: "8px 16px", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => setSelectedFeedEventId(null)}
                  >
                    <Icon.ChevronLeft />
                    <span>Back to Search</span>
                  </button>
                  {(() => {
                    const activeEvent = searchResults.find((e) => e.id === selectedFeedEventId) || events.find((e) => e.id === selectedFeedEventId);
                    return activeEvent ? (
                      <div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>{activeEvent.title}</h2>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          Category: {activeEvent.category} | Date: {formatDate(activeEvent.eventDate)}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </header>
                {renderEventAlbumFeed(selectedFeedEventId)}
              </section>
            ) : (
              <div>
                <h4 style={{ margin: "20px 0 14px", fontSize: "1.1rem" }}>Matching Event Albums ({searchResults.length})</h4>
                {renderHomeEventCards(searchResults)}
              </div>
            )}
          </section>
        )}

        {/* PAGE: NOTIFICATIONS (Phase 8) */}
        {view === "notifications" && (
          <section id="page-notifications">
            <header className="page-header">
              <h2>My Notifications</h2>
              {unreadNotifications > 0 && (
                <button
                  type="button"
                  className="sec-btn"
                  onClick={handleReadAllNotifications}
                >
                  Mark all as read
                </button>
              )}
            </header>

            <div className="feed-stream" style={{ gap: "12px", maxWidth: "600px", margin: "0 auto" }}>
              {notifications.map((n) => (
                <article
                  key={n.id}
                  className={`comment-item comment-bubble`}
                  style={{
                    padding: "16px",
                    background: n.isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(139, 92, 246, 0.06)",
                    border: "1px solid",
                    borderColor: n.isRead ? "var(--border-glass)" : "var(--border-glass-focus)",
                    borderRadius: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: n.isRead ? "default" : "pointer"
                  }}
                  onClick={() => !n.isRead && void handleReadNotification(n.id)}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div className="sidebar-avatar" style={{ background: n.isRead ? "var(--text-muted)" : "var(--accent-primary)" }}>
                      <Icon.Bell />
                    </div>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{n.message}</p>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="badge badge--green" style={{ textTransform: "none", fontSize: "0.7rem" }}>New</span>
                  )}
                </article>
              ))}

              {notifications.length === 0 && (
                <div className="empty-placeholder">
                  <Icon.Bell />
                  <h4>Clear Sky</h4>
                  <p>You have no notifications yet.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PAGE: EXPLORE CLUBS */}
        {view === "clubs" && (
          <section id="page-clubs">
            <header className="page-header">
              <h2>Explore Clubs</h2>
              {currentUser.role !== "VIEWER" && (
                <button
                  type="button"
                  className="form-submit-btn"
                  style={{ margin: 0, padding: "10px 18px" }}
                  onClick={() => {
                    setClubDraft(emptyClubDraft());
                    setIsClubModalOpen(true);
                  }}
                >
                  Create Club
                </button>
              )}
            </header>

            <div className="clubs-grid">
              {clubs.map((c) => {
                const isOwner = c.createdById === currentUser.id;
                const membersList = clubMembersMap[c.id] || [];
                const isMember = membersList.some((m) => m.userId === currentUser.id);
                const requestsList = clubRequestsMap[c.id] || [];
                const isPending = requestsList.some((r) => r.userId === currentUser.id && r.status === "PENDING");

                return (
                  <article
                    key={c.id}
                    className={`club-card ${expandedClubId === c.id ? "active" : ""}`}
                    onClick={() => {
                      setExpandedClubId(expandedClubId === c.id ? null : c.id);
                      setClubTab("members");
                    }}
                  >
                    <div className="club-logo">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name} />
                      ) : (
                        c.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <h3 className="club-name">{c.name}</h3>
                    <p className="club-desc">{c.description || "No description provided."}</p>

                    <div className="club-footer">
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {membersList.length} members
                      </span>
                      
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {isOwner && <span className="club-membership-badge owner">Owner</span>}
                        {isMember && !isOwner && <span className="club-membership-badge member">Member</span>}
                        {isPending && <span className="club-membership-badge pending">Pending</span>}
                        
                        <button
                          type="button"
                          className={`club-join-btn ${isMember ? "joined" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleJoinClub(c.id, isMember);
                          }}
                        >
                          {isMember ? "Leave" : isPending ? "Pending" : "Join"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {expandedClubId && (
              (() => {
                const activeClub = clubs.find((c) => c.id === expandedClubId);
                if (!activeClub) return null;
                const isOwner = activeClub.createdById === currentUser.id;
                const members = clubMembersMap[expandedClubId] || [];
                const requests = clubRequestsMap[expandedClubId] || [];
                const clubEvents = events.filter((e) => e.clubId === expandedClubId);

                const currentMembership = members.find((m) => m.userId === currentUser?.id);
                const isClubOwner = currentMembership?.role === "OWNER";
                const isClubAdmin = currentMembership?.role === "ADMIN";
                const isSuperAdmin = currentUser?.role === "ADMIN";
                const canManage = isSuperAdmin || isClubOwner || isClubAdmin;

                return (
                  <section className="club-drawer" aria-label="Club settings">
                    <header className="club-drawer-header">
                      <div>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>Club Console</span>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>{activeClub.name}</h3>
                      </div>
                      <button
                        type="button"
                        className="modal-close-btn"
                        onClick={() => setExpandedClubId(null)}
                      >
                        <Icon.Close />
                      </button>
                    </header>

                    <nav className="club-drawer-tabs">
                      <button
                        type="button"
                        className={`club-drawer-tab-btn ${clubTab === "members" ? "active" : ""}`}
                        onClick={() => setClubTab("members")}
                      >
                        Members ({members.length})
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          className={`club-drawer-tab-btn ${clubTab === "requests" ? "active" : ""}`}
                          onClick={() => setClubTab("requests")}
                        >
                          Join Requests ({requests.length})
                        </button>
                      )}
                      <button
                        type="button"
                        className={`club-drawer-tab-btn ${clubTab === "events" ? "active" : ""}`}
                        onClick={() => setClubTab("events")}
                      >
                        Events ({clubEvents.length})
                      </button>
                    </nav>

                    <div className="club-drawer-content">
                      {clubTab === "members" && (
                        <table className="club-table">
                          <thead>
                            <tr>
                              <th>Member</th>
                              <th>Role</th>
                              <th>Joined At</th>
                              {canManage && <th>Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((m) => (
                              <tr key={m.id}>
                                <td>{m.user?.name || "User"}</td>
                                <td>
                                  {m.role === "OWNER" ? (
                                    <span>OWNER</span>
                                  ) : (isSuperAdmin || isClubOwner) ? (
                                    <select
                                      className="form-select"
                                      value={m.role}
                                      onChange={(e) => void handleUpdateMemberRole(activeClub.id, m.id, e.target.value)}
                                      style={{ padding: "4px 8px", fontSize: "0.85rem", width: "auto" }}
                                    >
                                      <option value="MEMBER">MEMBER</option>
                                      <option value="ADMIN">ADMIN</option>
                                    </select>
                                  ) : (
                                    <span>{m.role}</span>
                                  )}
                                </td>
                                <td>{formatDate(m.joinedAt)}</td>
                                {canManage && (
                                  <td>
                                    {m.role !== "OWNER" && m.userId !== currentUser?.id && (
                                      <button
                                        type="button"
                                        className="table-btn reject"
                                        onClick={() => void handleRemoveMember(activeClub.id, m.id)}
                                        style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {clubTab === "requests" && canManage && (
                        <table className="club-table">
                          <thead>
                            <tr>
                              <th>Applicant</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {requests.map((r) => (
                              <tr key={r.id}>
                                <td>{r.user?.name || "User"}</td>
                                <td>{r.status}</td>
                                <td>
                                  {r.status === "PENDING" && (
                                    <div className="action-row">
                                      <button
                                        type="button"
                                        className="table-btn approve"
                                        onClick={() => void handleReviewJoinRequest(activeClub.id, r.id, true)}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        className="table-btn reject"
                                        onClick={() => void handleReviewJoinRequest(activeClub.id, r.id, false)}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {clubTab === "events" && (
                        <table className="club-table">
                          <thead>
                            <tr>
                              <th>Event Title</th>
                              <th>Category</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clubEvents.map((evt) => (
                              <tr key={evt.id}>
                                <td style={{ fontWeight: "600" }}>{evt.title}</td>
                                <td>{evt.category}</td>
                                <td>{formatDate(evt.eventDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </section>
                );
              })()
            )}
          </section>
        )}

        {/* PAGE: UPLOAD MEDIA */}
        {view === "upload" && (
          <section id="page-upload">
            <header className="page-header">
              <h2>Bulk Media Upload</h2>
            </header>

            <form className="upload-card" onSubmit={handleUploadMedia}>
              <div className="form-group">
                <label htmlFor="upload-event-id">Target Event Album</label>
                <select
                  id="upload-event-id"
                  className="form-select"
                  value={uploadSelectedEventId}
                  onChange={(e) => setUploadSelectedEventId(e.target.value)}
                  required
                >
                  <option value="">Select an Event Album...</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "16px", margin: "16px 0 16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem" }}>
                  <input
                    type="radio"
                    checked={uploadMediaSource === "local"}
                    onChange={() => setUploadMediaSource("local")}
                  />
                  Upload Local Files
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem" }}>
                  <input
                    type="radio"
                    checked={uploadMediaSource === "preset"}
                    onChange={() => setUploadMediaSource("preset")}
                  />
                  Choose Unsplash Preset
                </label>
              </div>

              {uploadMediaSource === "local" ? (
                <div>
                  <div
                    className="drag-drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files) {
                        handleFilesSelected(Array.from(e.dataTransfer.files));
                      }
                    }}
                    onClick={() => document.getElementById("upload-local-input")?.click()}
                    style={{
                      border: "2px dashed rgba(255, 255, 255, 0.15)",
                      borderRadius: "16px",
                      padding: "40px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "rgba(0, 0, 0, 0.1)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      id="upload-local-input"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFilesSelected(Array.from(e.target.files));
                        }
                      }}
                    />
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📂</div>
                    <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>Drag & Drop Files Here</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>or click to browse your folders (supports multiple photos & videos)</p>
                  </div>

                  {uploadPreviews.length > 0 && (
                    <div className="upload-previews-grid" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
                      <h4 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: "600", margin: "10px 0 0 0" }}>Files to Upload ({uploadPreviews.length})</h4>
                      {uploadPreviews.map((preview, previewIndex) => (
                        <div key={preview.previewUrl} className="upload-preview-card" style={{ display: "flex", gap: "16px", background: "var(--bg-secondary)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px" }}>
                          <div style={{ width: "120px", height: "120px", position: "relative", borderRadius: "8px", overflow: "hidden", background: "#050505", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            {preview.file.type.startsWith("video/") ? (
                              <video src={preview.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                            ) : (
                              <img src={preview.previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                URL.revokeObjectURL(preview.previewUrl);
                                setUploadPreviews((prev) => prev.filter((_, idx) => idx !== previewIndex));
                              }}
                              style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}
                            >
                              ×
                            </button>
                          </div>
                          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", alignItems: "start" }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>Caption / Description</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Describe this capture..."
                                value={preview.caption}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setUploadPreviews((prev) => prev.map((item, idx) => idx === previewIndex ? { ...item, caption: val } : item));
                                }}
                                style={{ padding: "8px 12px" }}
                              />
                              {preview.status === "analyzing" && (
                                <span style={{ fontSize: "0.72rem", color: "var(--accent-primary)", fontStyle: "italic", marginTop: "4px", display: "block" }}>
                                  ✨ Generating AI Caption suggestions...
                                </span>
                              )}
                            </div>
                            


                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>Tags (comma-separated)</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. concert, lights"
                                value={preview.tags}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setUploadPreviews((prev) => prev.map((item, idx) => idx === previewIndex ? { ...item, tags: val } : item));
                                }}
                                style={{ padding: "8px 12px" }}
                              />
                            </div>

                            {preview.people && preview.people.length > 0 && (
                              <div className="form-group" style={{ margin: 0, gridColumn: "span 2" }}>
                                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "4px" }}>Tagged People (AI Detected)</label>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  {preview.people.map(p => (
                                    <span key={p.id} className="tagged-user-badge" style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "var(--accent-primary)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem" }}>@{p.name}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="preset-selector">
                    <p>Choose Preset</p>
                    <div className="presets-grid">
                      {PRESET_MEDIAS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`preset-item ${uploadPresetId === p.id ? "active" : ""}`}
                          onClick={() => setUploadPresetId(p.id)}
                        >
                          <img src={p.url} alt={p.name} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "24px", marginTop: "16px" }}>
                    <label htmlFor="upload-file-title">Title / Caption</label>
                    <input
                      id="upload-file-title"
                      type="text"
                      className="form-input"
                      placeholder="Caption this file..."
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {isUploading && (
                <div style={{ marginTop: "20px" }}>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "14px" }}>
                    Uploading files to storage... {uploadProgress}%
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="form-submit-btn"
                disabled={isUploading || !uploadSelectedEventId || (uploadMediaSource === "local" && uploadPreviews.length === 0)}
                style={{ width: "100%", margin: "24px 0 0 0" }}
              >
                {isUploading ? "Uploading..." : "Start Upload"}
              </button>
            </form>
          </section>
        )}

        {/* PAGE: PROFILE */}
        {view === "profile" && (
          <section id="page-profile">
            <header className="page-header">
              <h2>My Profile</h2>
            </header>

            <article className="profile-card" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <div
                className="profile-avatar-container"
                style={{
                  position: "relative",
                  cursor: "pointer",
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid var(--accent-primary)",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255,255,255,0.05)"
                }}
              >
                {currentUser.referenceSelfie ? (
                  <img
                    src={getMediaSourceUrl(currentUser.referenceSelfie)}
                    alt="Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "2rem", fontWeight: "bold" }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <label
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    cursor: "pointer"
                  }}
                  className="profile-avatar-overlay-hover"
                >
                  <Icon.Edit />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleSelfieUpload}
                  />
                </label>
              </div>
              
              <div className="profile-details" style={{ flex: 1 }}>
                <div className="profile-header-row">
                  <h3 className="profile-name">{currentUser.name}</h3>
                  <span className="profile-role-tag">{currentUser.role}</span>
                </div>
                <p className="profile-email">{currentUser.email}</p>

                <div className="profile-stats-row">
                  <div className="profile-stat-item">
                    <span className="profile-stat-num">{userEvents.length}</span>
                    <span className="profile-stat-label">Events Managed</span>
                  </div>
                  <div className="profile-stat-item">
                    <span className="profile-stat-num">
                      {clubs.filter(c => (clubMembersMap[c.id] || []).some(m => m.userId === currentUser.id)).length}
                    </span>
                    <span className="profile-stat-label">Clubs Joined</span>
                  </div>
                </div>
              </div>
            </article>

            <div className="profile-tabs">
              <button
                type="button"
                className={`profile-tab-btn ${profileActiveTab === "events" ? "active" : ""}`}
                onClick={() => setProfileActiveTab("events")}
              >
                My Events ({userEvents.length})
              </button>
              <button
                type="button"
                className={`profile-tab-btn ${profileActiveTab === "albums" ? "active" : ""}`}
                onClick={() => setProfileActiveTab("albums")}
              >
                My Albums ({userUploadedMedia.length})
              </button>
              <button
                type="button"
                className={`profile-tab-btn ${profileActiveTab === "tagged" ? "active" : ""}`}
                onClick={() => setProfileActiveTab("tagged")}
              >
                Photos of Me ({taggedMedia.length})
              </button>
            </div>

            {profileActiveTab === "events" ? (
              userEvents.length === 0 ? (
                <div className="empty-placeholder">
                  <Icon.Calendar />
                  <h4>No Events Scheduled</h4>
                  <p>Tap "New Event" in the Feed to schedule an event album.</p>
                </div>
              ) : (
                <div className="profile-grid">
                  {userEvents.map((evt) => (
                    <article
                      key={evt.id}
                      className="profile-grid-item"
                      onClick={() => {
                        setEventDraft(toDraft(evt));
                        setSelectedEventId(evt.id);
                        setIsEventModalOpen(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setEventDraft(toDraft(evt));
                          setSelectedEventId(evt.id);
                          setIsEventModalOpen(true);
                        }
                      }}
                    >
                      {evt.coverImage ? (
                        <img src={getMediaSourceUrl(evt.coverImage)} alt={evt.title} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#1f2937", display: "grid", placeItems: "center" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No cover image</span>
                        </div>
                      )}
                      <div className="profile-grid-overlay">
                        <h4>{evt.title}</h4>
                        <span>{evt.category}</span>
                        <p>{formatDate(evt.eventDate)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : profileActiveTab === "albums" ? (
              userUploadedMedia.length === 0 ? (
                <div className="empty-placeholder">
                  <Icon.Upload />
                  <h4>No Albums Uploaded</h4>
                  <p>Go to upload media to schedule visual content under events.</p>
                </div>
              ) : (
                <div className="profile-grid">
                  {userUploadedMedia.map((m) => (
                    <article
                      key={m.id}
                      className="profile-grid-item"
                      onClick={() => setSelectedViewMedia(m)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedViewMedia(m);
                        }
                      }}
                    >
                      {m.fileType === "video" ? (
                        <video src={getMediaSourceUrl(m.fileUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                      ) : (
                        <img src={getMediaSourceUrl(m.fileUrl)} alt={m.title || "Album photo"} />
                      )}
                      <div className="profile-grid-overlay">
                        <h4>{m.title || "Untitled Capture"}</h4>
                        <span>{formatDate(m.uploadedAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : (
              taggedMedia.length === 0 ? (
                <div className="empty-placeholder">
                  <Icon.Compass />
                  <h4>No Tagged Photos</h4>
                  <p>Click your profile photo to calibrate your face so photographers can auto-tag you.</p>
                </div>
              ) : (
                <div className="profile-grid">
                  {taggedMedia.map((m) => {
                    const matchedEvent = events.find((e) => e.id === m.eventId);
                    return (
                      <article
                        key={m.id}
                        className="profile-grid-item"
                        onClick={() => setSelectedViewMedia(m)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedViewMedia(m);
                          }
                        }}
                      >
                        <img src={getMediaSourceUrl(m.fileUrl)} alt={m.title || "Tagged photo"} />
                        <div className="profile-grid-overlay">
                          <h4>{m.title || "Untitled Capture"}</h4>
                          <span>{matchedEvent?.title || "Event Gallery"}</span>
                          {m.aiCaption && <p style={{ fontSize: "0.75rem", fontStyle: "italic", marginTop: "4px" }}>✨ {m.aiCaption}</p>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            )}
          </section>
        )}
      </main>

      {/* Global Status Toast Notification Overlay */}
      {toast && (
        <div className="global-status-toast" role="status">
          <span className={`global-status-dot ${toast.type}`} />
          <span className="toast-msg">{toast.message}</span>
        </div>
      )}

      {/* EVENT MODAL */}
      {isEventModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <header className="modal-header">
              <h3>{selectedEventId ? "Edit Event Album" : "Create Event Album"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsEventModalOpen(false);
                  setSelectedEventId(null);
                  setEventDraft(emptyDraft());
                }}
              >
                <Icon.Close />
              </button>
            </header>

            <form onSubmit={handleSaveEvent} className="modal-body auth-form">
              <div className="form-group">
                <label htmlFor="evt-title">Event Title</label>
                <input
                  id="evt-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Moonlight Concert"
                  value={eventDraft.title}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="evt-category">Category</label>
                <select
                  id="evt-category"
                  className="form-select"
                  value={eventDraft.category}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  {CATEGORIES.filter(c => c !== "all").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="evt-desc">Description</label>
                <textarea
                  id="evt-desc"
                  rows={3}
                  className="form-input"
                  placeholder="Short event details..."
                  value={eventDraft.description}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, description: e.target.value }))}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label htmlFor="evt-date">Date & Time</label>
                  <input
                    id="evt-date"
                    type="datetime-local"
                    className="form-input"
                    value={eventDraft.eventDate}
                    onChange={(e) => setEventDraft(prev => ({ ...prev, eventDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="evt-visibility">Visibility</label>
                  <select
                    id="evt-visibility"
                    className="form-select"
                    value={eventDraft.visibility}
                    onChange={(e) => setEventDraft(prev => ({ ...prev, visibility: e.target.value as EventVisibility }))}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="evt-location">Location</label>
                <input
                  id="evt-location"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Courtyard"
                  value={eventDraft.location}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="evt-cover">Cover Image URL</label>
                <input
                  id="evt-cover"
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={eventDraft.coverImage}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, coverImage: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="evt-club">Linked Club</label>
                <select
                  id="evt-club"
                  className="form-select"
                  value={eventDraft.clubId}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, clubId: e.target.value }))}
                >
                  <option value="">None (Standalone)</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="sec-btn"
                  onClick={() => {
                    setIsEventModalOpen(false);
                    setSelectedEventId(null);
                    setEventDraft(emptyDraft());
                  }}
                >
                  Cancel
                </button>
                {selectedEventId && (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => void handleDeleteEvent(selectedEventId)}
                  >
                    Delete Event
                  </button>
                )}
                <button type="submit" className="form-submit-btn" style={{ margin: 0 }} disabled={working}>
                  {working ? "Saving..." : selectedEventId ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLUB FORM MODAL */}
      {isClubModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <header className="modal-header">
              <h3>Create New Club</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsClubModalOpen(false)}
              >
                <Icon.Close />
              </button>
            </header>

            <form onSubmit={handleCreateClub} className="modal-body auth-form">
              <div className="form-group">
                <label htmlFor="club-name">Club Name</label>
                <input
                  id="club-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Photo Society"
                  value={clubDraft.name}
                  onChange={(e) => setClubDraft(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="club-desc">Description</label>
                <textarea
                  id="club-desc"
                  rows={3}
                  className="form-input"
                  placeholder="Describe your club..."
                  value={clubDraft.description}
                  onChange={(e) => setClubDraft(prev => ({ ...prev, description: e.target.value }))}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="club-logo">Logo URL</label>
                <input
                  id="club-logo"
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={clubDraft.logoUrl}
                  onChange={(e) => setClubDraft(prev => ({ ...prev, logoUrl: e.target.value }))}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="sec-btn"
                  onClick={() => setIsClubModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="form-submit-btn" style={{ margin: 0 }} disabled={working}>
                  {working ? "Creating..." : "Create Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* VIEW MEDIA MODAL */}
      {selectedViewMedia && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedViewMedia(null)}>
          <div className="modal-content" style={{ maxWidth: "900px", width: "90%", padding: 0, overflow: "hidden", background: "var(--bg-secondary)", borderRadius: "16px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1.2fr) minmax(280px, 1fr)", height: "80vh", maxHeight: "600px" }}>
              
              {/* Media Player Column */}
              <div style={{ background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "100%", overflow: "hidden" }}>
                {selectedViewMedia.fileType === "video" ? (
                  <video
                    src={getMediaSourceUrl(selectedViewMedia.fileUrl)}
                    controls
                    autoPlay
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <img
                    src={getMediaSourceUrl(selectedViewMedia.fileUrl)}
                    alt={selectedViewMedia.title || "Detail view"}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                )}
              </div>

              {/* Information / Interactivity Column */}
              <div style={{ display: "flex", flexDirection: "column", height: "100%", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Header */}
                <header style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#8b5cf6", display: "grid", placeItems: "center", fontWeight: "600", color: "#fff", fontSize: "0.85rem" }}>
                      {selectedViewMedia.uploader?.name ? selectedViewMedia.uploader.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <span style={{ fontWeight: "600", fontSize: "0.85rem", display: "block" }}>{selectedViewMedia.uploader?.name || "Photographer"}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{formatDate(selectedViewMedia.uploadedAt)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedViewMedia(null)}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                  >
                    <Icon.Close />
                  </button>
                </header>

                {/* Details Scroll Area */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Title/Caption */}
                  <div>
                    <p style={{ fontSize: "0.88rem", margin: 0, lineHeight: "1.4" }}>
                      <strong style={{ marginRight: "6px" }}>{selectedViewMedia.uploader?.name || "Photographer"}</strong>
                      {selectedViewMedia.title || "Capture from Event Album"}
                    </p>
                  </div>

                  {/* AI caption */}
                  {selectedViewMedia.aiCaption && (
                    <div style={{ background: "rgba(139, 92, 246, 0.05)", borderLeft: "3px solid var(--accent-primary)", padding: "10px 14px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--accent-primary)", fontWeight: "700", display: "block", textTransform: "uppercase" }}>AI Description</span>
                      <p style={{ margin: "2px 0 0 0", fontStyle: "italic", fontSize: "0.85rem", color: "#c084fc" }}>
                        ✨ {selectedViewMedia.aiCaption}
                      </p>
                    </div>
                  )}

                  {/* AI Tags */}
                  {selectedViewMedia.aiTags && selectedViewMedia.aiTags.length > 0 && (
                    <div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {selectedViewMedia.aiTags.map((tag) => (
                          <span key={tag} style={{ fontSize: "0.7rem", padding: "2px 8px", background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.25)", color: "rgba(167, 139, 250, 1)", borderRadius: "10px" }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tagged People */}
                  {selectedViewMedia.tags && selectedViewMedia.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: "600" }}>Tagged:</span>
                      {selectedViewMedia.tags.map((tagObj: any) => (
                        <span key={tagObj.id} style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", color: "var(--accent-primary)", padding: "1px 6px", borderRadius: "10px", fontSize: "0.7rem" }}>
                          @{tagObj.user?.name || "User"}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Comments List */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Comments</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(mediaComments[selectedViewMedia.id] || []).map((c) => (
                        <div key={c.id} style={{ display: "flex", gap: "6px", fontSize: "0.82rem", lineHeight: "1.3" }}>
                          <strong>{c.user?.name || "Member"}:</strong>
                          <span style={{ color: "var(--text-secondary)" }}>{c.content}</span>
                        </div>
                      ))}
                      {(mediaComments[selectedViewMedia.id] || []).length === 0 && (
                        <span style={{ fontStyle: "italic", fontSize: "0.75rem", color: "var(--text-muted)" }}>No comments yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions & Comment Input Footer */}
                <footer style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "14px" }}>
                      <button
                        type="button"
                        onClick={() => void handleLikeMedia(selectedViewMedia.id)}
                        style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: mediaLikes[selectedViewMedia.id]?.users.some((u) => u.id === currentUser?.id) ? "#ef4444" : "#fff", cursor: "pointer", padding: 0 }}
                      >
                        <Icon.Heart />
                        <span style={{ fontWeight: "600", fontSize: "0.82rem" }}>{mediaLikes[selectedViewMedia.id]?.count || 0}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleFavouriteMedia(selectedViewMedia.id)}
                        style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: mediaFavourites.includes(selectedViewMedia.id) ? "#eab308" : "#fff", cursor: "pointer", padding: 0 }}
                      >
                        <Icon.Bookmark />
                        <span style={{ fontWeight: "600", fontSize: "0.82rem" }}>{mediaFavourites.includes(selectedViewMedia.id) ? "Saved" : "Save"}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDownloadMedia(selectedViewMedia.id, selectedViewMedia.title || "download.jpg")}
                      style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", cursor: "pointer", padding: "4px 10px", borderRadius: "16px", fontSize: "0.75rem" }}
                    >
                      <Icon.Upload />
                      <span>Download</span>
                    </button>
                  </div>
                  
                  <form
                    style={{ display: "flex", gap: "8px" }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem("modalCommentText") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        void handleCommentMedia(selectedViewMedia.id, input.value.trim());
                        input.value = "";
                      }
                    }}
                  >
                    <input
                      name="modalCommentText"
                      type="text"
                      placeholder="Add a comment..."
                      className="comment-input"
                      style={{ flex: 1, padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "var(--bg-primary)", color: "#fff", fontSize: "0.8rem" }}
                      autoComplete="off"
                    />
                    <button type="submit" className="comment-submit-btn" style={{ padding: "6px 12px", borderRadius: "6px", background: "var(--accent-primary)", border: "none", color: "#fff", fontSize: "0.8rem", cursor: "pointer" }}>Post</button>
                  </form>
                </footer>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
