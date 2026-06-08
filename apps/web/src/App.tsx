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
} from "@repo/contracts";
import { api, type SessionTokens } from "./lib/api";
import "./App.css";

// Preset media choices for mock upload
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

type ViewPage = "feed" | "clubs" | "upload" | "profile";

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
  name?: string; // For Signup
  role?: string;  // For Signup
};

// Mock Interface
interface MockMediaItem {
  id: string;
  title: string;
  fileUrl: string;
  fileType: "photo" | "video";
  uploadedAt: string;
  uploadedById: string;
  caption?: string;
}

interface MockCommentItem {
  id: string;
  userName: string;
  text: string;
  date: string;
}

const STORAGE_KEY = "eventvault.session";
const LIKES_KEY = "eventvault.likes";
const COMMENTS_KEY = "eventvault.comments";
const MEDIA_KEY = "eventvault.media";

const emptyDraft = (): EventDraft => ({
  title: "",
  description: "",
  category: "",
  visibility: "PUBLIC",
  location: "",
  eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow
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
  // Navigation & View States
  const [view, setView] = useState<ViewPage>("feed");
  const [activeAuthTab, setActiveAuthTab] = useState<"signin" | "signup">("signin");
  
  // Real DB Data States
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [session, setSession] = useState<SessionTokens | null>(getInitialSession);
  
  // Forms & Modals
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
  
  // Event Filtering/Sorting States
  const [sortBy, setSortBy] = useState<EventSortBy>("eventDate");
  const [sortOrder, setSortOrder] = useState<EventSortOrder>("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | EventVisibility>("all");
  
  // Toast & Global Status
  const [toast, setToast] = useState<{ message: string; type: "ok" | "warn" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  // Explore Club Detail States
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [clubTab, setClubTab] = useState<"members" | "requests" | "events">("members");
  const [clubMembersMap, setClubMembersMap] = useState<Record<string, any[]>>({});
  const [clubRequestsMap, setClubRequestsMap] = useState<Record<string, any[]>>({});

  // Mock Feed/Social System States
  const [likes, setLikes] = useState<Record<string, string[]>>({}); // eventId -> userIds
  const [comments, setComments] = useState<Record<string, MockCommentItem[]>>({}); // eventId -> comment objects
  const [media, setMedia] = useState<Record<string, MockMediaItem[]>>({}); // eventId -> media items
  const [activeMediaCarouselIndex, setActiveMediaCarouselIndex] = useState<Record<string, number>>({});
  
  // Upload Media States
  const [uploadSelectedEventId, setUploadSelectedEventId] = useState("");
  const [uploadMediaSource, setUploadMediaSource] = useState<"preset" | "url">("preset");
  const [uploadPresetId, setUploadPresetId] = useState(PRESET_MEDIAS[0].id);
  const [uploadMediaUrl, setUploadMediaUrl] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load mocks from localStorage on mount
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem(LIKES_KEY);
      if (storedLikes) setLikes(JSON.parse(storedLikes));
      
      const storedComments = localStorage.getItem(COMMENTS_KEY);
      if (storedComments) setComments(JSON.parse(storedComments));
      
      const storedMedia = localStorage.getItem(MEDIA_KEY);
      if (storedMedia) setMedia(JSON.parse(storedMedia));
    } catch (err) {
      console.error("Failed to parse social mocks", err);
    }
  }, []);

  // Helper to show a Toast message
  const triggerToast = (message: string, type: "ok" | "warn" = "ok") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync token pair with localStorage and fetch current user profile
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
        triggerToast(`Signed in as ${payload.user.name}`, "ok");
      } catch (err) {
        setCurrentUser(null);
        setSession(null);
        triggerToast("Session expired, please sign in again.", "warn");
      }
    };

    void syncSession();
  }, [session]);

  // API loading for events/clubs
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reconnect with backend API");
      triggerToast("Failed to fetch fresh data from backend.", "warn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [sortBy, sortOrder, categoryFilter, clubFilter, visibilityFilter]);

  // Load details for expanded club
  const loadClubDetails = async (clubId: string) => {
    try {
      const [membersPayload] = await Promise.all([
        api.listClubMembers(clubId),
      ]);
      setClubMembersMap(prev => ({ ...prev, [clubId]: membersPayload.members }));

      if (session) {
        const requestsPayload = await api.listJoinRequests(clubId, session.accessToken);
        setClubRequestsMap(prev => ({ ...prev, [clubId]: requestsPayload.requests }));
      }
    } catch (err) {
      console.warn("Failed to load full club lists (might not have access rights)", err);
    }
  };

  useEffect(() => {
    if (expandedClubId) {
      void loadClubDetails(expandedClubId);
    }
  }, [expandedClubId, session]);

  // Auth Handler: Login
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionForm.email || !sessionForm.password) {
      triggerToast("Email and password are required.", "warn");
      return;
    }
    setWorking(true);
    try {
      const payload = await api.login(sessionForm.email, sessionForm.password);
      setSession(payload.tokens);
      setCurrentUser(payload.user);
      setSessionForm({ email: "", password: "", name: "", role: "VIEWER" });
      setView("feed");
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Login failed", "warn");
    } finally {
      setWorking(false);
    }
  };

  // Auth Handler: Signup
  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionForm.name || !sessionForm.email || !sessionForm.password) {
      triggerToast("Name, email and password are required.", "warn");
      return;
    }
    setWorking(true);
    try {
      const payload = await api.register(
        sessionForm.name,
        sessionForm.email,
        sessionForm.password,
        sessionForm.role || "VIEWER"
      );
      setSession(payload.tokens);
      setCurrentUser(payload.user);
      setSessionForm({ email: "", password: "", name: "", role: "VIEWER" });
      setView("feed");
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Registration failed", "warn");
    } finally {
      setWorking(false);
    }
  };

  // Auth Handler: Logout
  const handleLogout = () => {
    setSession(null);
    setCurrentUser(null);
    triggerToast("Signed out successfully", "ok");
  };

  // Event Handler: Create/Update
  const handleSaveEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      triggerToast("You must be signed in to manage events.", "warn");
      return;
    }
    if (!eventDraft.title || !eventDraft.category || !eventDraft.eventDate) {
      triggerToast("Title, category, and date are required.", "warn");
      return;
    }
    setWorking(true);
    try {
      const payload = toPayload(eventDraft);
      if (selectedEventId) {
        await api.updateEvent(selectedEventId, payload, session.accessToken);
        triggerToast("Event updated successfully!");
      } else {
        await api.createEvent(payload, session.accessToken);
        triggerToast("Event created successfully!");
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

  // Event Handler: Delete
  const handleDeleteEvent = async (eventId: string) => {
    if (!session) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setWorking(true);
    try {
      await api.deleteEvent(eventId, session.accessToken);
      triggerToast("Event removed successfully.");
      setIsEventModalOpen(false);
      setSelectedEventId(null);
      setEventDraft(emptyDraft());
      await loadData();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Could not delete event", "warn");
    } finally {
      setWorking(false);
    }
  };

  // Club Handler: Create
  const handleCreateClub = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) return;
    if (!clubDraft.name) {
      triggerToast("Club name is required.", "warn");
      return;
    }
    setWorking(true);
    try {
      await api.createClub(
        {
          name: clubDraft.name.trim(),
          description: clubDraft.description.trim() || undefined,
          logoUrl: clubDraft.logoUrl.trim() || undefined,
        },
        session.accessToken
      );
      triggerToast("Club created successfully!");
      setIsClubModalOpen(false);
      setClubDraft(emptyClubDraft());
      await loadData();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Failed to create club", "warn");
    } finally {
      setWorking(false);
    }
  };

  // Club Handler: Join/Leave
  const handleToggleJoinClub = async (clubId: string, isJoined: boolean) => {
    if (!session) {
      triggerToast("Please log in to join clubs.", "warn");
      return;
    }
    try {
      if (isJoined) {
        await api.leaveClub(clubId, session.accessToken);
        triggerToast("Left the club.");
      } else {
        await api.joinClub(clubId, session.accessToken);
        triggerToast("Join request sent!");
      }
      await loadClubDetails(clubId);
      await loadData();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Failed operation", "warn");
    }
  };

  // Club Handler: Review Request
  const handleReviewJoinRequest = async (clubId: string, requestId: string, approve: boolean) => {
    if (!session) return;
    try {
      await api.reviewJoinRequest(
        clubId,
        requestId,
        approve ? "APPROVED" : "REJECTED",
        session.accessToken
      );
      triggerToast(approve ? "Request approved" : "Request rejected");
      await loadClubDetails(clubId);
      await loadData();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Review request failed", "warn");
    }
  };

  // Mock Upload Handler
  const handleUploadMedia = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session || !currentUser) return;
    if (!uploadSelectedEventId) {
      triggerToast("Select an event to upload to", "warn");
      return;
    }

    let fileUrl = "";
    if (uploadMediaSource === "preset") {
      const preset = PRESET_MEDIAS.find(p => p.id === uploadPresetId);
      fileUrl = preset ? preset.url : PRESET_MEDIAS[0].url;
    } else {
      if (!uploadMediaUrl) {
        triggerToast("Please enter an image URL", "warn");
        return;
      }
      fileUrl = uploadMediaUrl;
    }

    setIsUploading(true);
    setUploadProgress(10);

    // Simulate progress upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Complete upload logic
          const newMedia: MockMediaItem = {
            id: `media-${Date.now()}`,
            title: uploadCaption ? uploadCaption.substring(0, 30) : "Media Post",
            fileUrl,
            fileType: "photo",
            uploadedAt: new Date().toISOString(),
            uploadedById: currentUser.id,
            caption: uploadCaption,
          };

          const existingMedia = { ...media };
          if (!existingMedia[uploadSelectedEventId]) {
            existingMedia[uploadSelectedEventId] = [];
          }
          existingMedia[uploadSelectedEventId] = [newMedia, ...existingMedia[uploadSelectedEventId]];

          setMedia(existingMedia);
          localStorage.setItem(MEDIA_KEY, JSON.stringify(existingMedia));
          
          setIsUploading(false);
          setUploadProgress(0);
          setUploadCaption("");
          setUploadMediaUrl("");
          triggerToast("Media uploaded successfully under event!", "ok");
          setView("feed");
          return 0;
        }
        return prev + 15;
      });
    }, 150);
  };

  // Social: Toggle Like
  const handleLikeEvent = (eventId: string) => {
    if (!currentUser) {
      triggerToast("Sign in to like posts", "warn");
      return;
    }
    const currentLikes = { ...likes };
    const list = currentLikes[eventId] || [];
    const index = list.indexOf(currentUser.id);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(currentUser.id);
    }
    currentLikes[eventId] = list;
    setLikes(currentLikes);
    localStorage.setItem(LIKES_KEY, JSON.stringify(currentLikes));
  };

  // Social: Submit Comment
  const handleAddComment = (eventId: string, text: string) => {
    if (!currentUser) return;
    if (!text.trim()) return;

    const currentComments = { ...comments };
    const newComment: MockCommentItem = {
      id: `comment-${Date.now()}`,
      userName: currentUser.name,
      text: text.trim(),
      date: new Date().toISOString(),
    };

    currentComments[eventId] = [...(currentComments[eventId] || []), newComment];
    setComments(currentComments);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(currentComments));
  };

  // Render variables
  const categories = ["all", ...new Set(events.map((event) => event.category))];
  const userEvents = events.filter((e) => currentUser && e.createdById === currentUser.id);

  // SVG Helper components
  const Icon = {
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
    Unlock: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
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
    Briefcase: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    Compass: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  // Helper date formatter
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

  // 1. AUTH GATE: If no user is authenticated, render ONLY the login / signup interface
  if (!currentUser) {
    return (
      <div className="auth-gate">
        <div className="auth-mesh" />
        <main className="auth-container">
          <header className="auth-header">
            <h1>EventVault</h1>
            <p>Connect and share your club events & media</p>
          </header>

          <nav className="auth-tabs" aria-label="Authentication tabs">
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
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={sessionForm.email}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signin-password">Password</label>
                <input
                  id="signin-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={sessionForm.password}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, password: e.target.value as Exclude<string, ""> }))}
                  required
                />
              </div>
              <button
                id="signin-submit-btn"
                type="submit"
                className="form-submit-btn"
                disabled={working}
              >
                {working ? "Connecting..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form id="signup-form" className="auth-form" onSubmit={handleSignup}>
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  className="form-input"
                  placeholder="Aarav Sharma"
                  value={sessionForm.name || ""}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={sessionForm.email}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={sessionForm.password}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, password: e.target.value as Exclude<string, ""> }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-role">Join As</label>
                <select
                  id="signup-role"
                  className="form-select"
                  value={sessionForm.role || "VIEWER"}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="CLUB_MEMBER">Club Member</option>
                  <option value="PHOTOGRAPHER">Photographer</option>
                </select>
              </div>
              <button
                id="signup-submit-btn"
                type="submit"
                className="form-submit-btn"
                disabled={working}
              >
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

  // 2. MAIN APPLICATION SHELL
  return (
    <div className="app-shell">
      {/* Sidebar navigation */}
      <aside className="app-sidebar" aria-label="Main Navigation">
        <div className="logo-container">
          <div className="logo-icon">
            <Icon.Briefcase />
          </div>
          <span className="logo-text">EventVault</span>
        </div>

        <nav className="nav-links" aria-label="Sidebar navigation links">
          <button
            id="nav-feed"
            type="button"
            className={`nav-item ${view === "feed" ? "active" : ""}`}
            onClick={() => setView("feed")}
          >
            <Icon.Home />
            <span>Home Feed</span>
          </button>
          <button
            id="nav-clubs"
            type="button"
            className={`nav-item ${view === "clubs" ? "active" : ""}`}
            onClick={() => setView("clubs")}
          >
            <Icon.Clubs />
            <span>Explore Clubs</span>
          </button>
          <button
            id="nav-upload"
            type="button"
            className={`nav-item ${view === "upload" ? "active" : ""}`}
            onClick={() => setView("upload")}
          >
            <Icon.Upload />
            <span>Upload Media</span>
          </button>
          <button
            id="nav-profile"
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
            id="btn-logout"
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Logout button"
          >
            <Icon.Logout />
          </button>
        </footer>
      </aside>

      {/* Main content workspace */}
      <main className="app-workspace">
        
        {/* VIEW: HOME FEED */}
        {view === "feed" && (
          <section id="page-feed">
            <header className="page-header">
              <h2>Home Feed</h2>
              <div className="page-actions">
                <button
                  id="btn-create-event-feed"
                  type="button"
                  className="form-submit-btn"
                  style={{ margin: 0, padding: "10px 18px" }}
                  onClick={() => {
                    setEventDraft(emptyDraft());
                    setSelectedEventId(null);
                    setIsEventModalOpen(true);
                  }}
                >
                  <span style={{ marginRight: 6 }}>+</span> New Event
                </button>
              </div>
            </header>

            {error && (
              <div className="form-error" style={{ marginBottom: "20px" }}>
                <strong>API Connection Error:</strong> {error}. Make sure the backend server is running.
              </div>
            )}

            <section className="feed-filters" aria-label="Feed filters">
              <div className="filter-controls">
                <label htmlFor="feed-sort-by" style={{ display: "none" }}>Sort By</label>
                <select
                  id="feed-sort-by"
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as EventSortBy)}
                >
                  <option value="eventDate">Sort by event date</option>
                  <option value="title">Sort by title</option>
                  <option value="category">Sort by category</option>
                </select>

                <label htmlFor="feed-sort-order" style={{ display: "none" }}>Sort Order</label>
                <select
                  id="feed-sort-order"
                  className="filter-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as EventSortOrder)}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>

                <label htmlFor="feed-club-filter" style={{ display: "none" }}>Filter by Club</label>
                <select
                  id="feed-club-filter"
                  className="filter-select"
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                >
                  <option value="all">All clubs</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <label htmlFor="feed-visibility-filter" style={{ display: "none" }}>Filter by Visibility</label>
                <select
                  id="feed-visibility-filter"
                  className="filter-select"
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value as "all" | EventVisibility)}
                >
                  <option value="all">All visibility</option>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              <div className="category-chips" aria-label="Category filter chips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-chip ${categoryFilter === cat ? "active" : ""}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>
            </section>

            {loading && events.length === 0 ? (
              <div className="empty-placeholder">
                <Icon.Calendar />
                <h4>Loading feed...</h4>
                <p>Establishing secure connection with EventVault backend API.</p>
              </div>
            ) : events.length === 0 ? (
              <div className="empty-placeholder">
                <Icon.Calendar />
                <h4>No Events Found</h4>
                <p>Be the first to shape the calendar. Create an event to post on the feed.</p>
              </div>
            ) : (
              <div className="feed-stream">
                {events.map((evt) => {
                  const eventMediaList = media[evt.id] || [];
                  const activeCarouselIdx = activeMediaCarouselIndex[evt.id] || 0;
                  
                  // Collect all visual slides
                  const slides: Array<{ url: string; caption?: string }> = [];
                  eventMediaList.forEach(m => {
                    slides.push({ url: m.fileUrl, caption: m.caption });
                  });
                  if (evt.coverImage) {
                    slides.push({ url: evt.coverImage, caption: "Cover Image" });
                  }

                  const likedList = likes[evt.id] || [];
                  const userLiked = likedList.includes(currentUser.id);

                  return (
                    <article key={evt.id} className="post-card">
                      {/* Post Header */}
                      <header className="post-header">
                        <div className="post-author">
                          <div className="post-author-avatar">
                            {evt.creator?.name ? evt.creator.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div className="post-author-info">
                            <span className="post-author-name">{evt.creator?.name || "Organizer"}</span>
                            <div className="post-meta-details">
                              <span>{formatDate(evt.eventDate)}</span>
                              <span>•</span>
                              <span>{evt.club?.name || "Independent"}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span className="post-category-tag">{evt.category}</span>
                          <span className={`post-visibility-badge ${evt.visibility.toLowerCase()}`}>
                            {evt.visibility}
                          </span>
                        </div>
                      </header>

                      {/* Post Visual Media Area */}
                      {slides.length > 0 ? (
                        <div className="post-media-container">
                          <img
                            src={slides[activeCarouselIdx].url}
                            alt={`${evt.title} image`}
                            className="post-media"
                          />
                          {slides.length > 1 && (
                            <>
                              <button
                                type="button"
                                className="carousel-btn prev"
                                onClick={() => {
                                  setActiveMediaCarouselIndex(prev => ({
                                    ...prev,
                                    [evt.id]: (activeCarouselIdx - 1 + slides.length) % slides.length,
                                  }));
                                }}
                                aria-label="Previous slide"
                              >
                                <Icon.ChevronLeft />
                              </button>
                              <button
                                type="button"
                                className="carousel-btn next"
                                onClick={() => {
                                  setActiveMediaCarouselIndex(prev => ({
                                    ...prev,
                                    [evt.id]: (activeCarouselIdx + 1) % slides.length,
                                  }));
                                }}
                                aria-label="Next slide"
                              >
                                <Icon.ChevronRight />
                              </button>

                              <div className="carousel-dots">
                                {slides.map((_, i) => (
                                  <div
                                    key={i}
                                    className={`carousel-dot ${activeCarouselIdx === i ? "active" : ""}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="post-media-container" style={{ display: "grid", placeItems: "center", background: "#111827" }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No media uploaded yet</span>
                        </div>
                      )}

                      {/* Post Content */}
                      <section className="post-content">
                        <h3 className="post-title">{evt.title}</h3>
                        {evt.description && (
                          <p className="post-description">{evt.description}</p>
                        )}

                        <div className="post-info-row">
                          {evt.location && (
                            <div className="post-info-item">
                              <Icon.MapPin />
                              <span>{evt.location}</span>
                            </div>
                          )}
                          <div className="post-info-item">
                            <Icon.Calendar />
                            <span>{formatDate(evt.eventDate)}</span>
                          </div>
                        </div>

                        {/* Interactive bar */}
                        <div className="post-actions">
                          <button
                            type="button"
                            className={`post-action-btn ${userLiked ? "liked" : ""}`}
                            onClick={() => handleLikeEvent(evt.id)}
                            aria-label={`Like event, current likes ${likedList.length}`}
                          >
                            <Icon.Heart />
                            <span>{likedList.length}</span>
                          </button>
                          <button
                            type="button"
                            className="post-action-btn"
                            onClick={() => {
                              // Toggles comment focus or display
                              const commForm = document.getElementById(`comments-form-${evt.id}`);
                              if (commForm) commForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }}
                          >
                            <Icon.Comment />
                            <span>{(comments[evt.id] || []).length} Comments</span>
                          </button>
                        </div>
                      </section>

                      {/* Comments Drawer */}
                      <section className="post-comments-section" aria-label="Comments">
                        <div className="comments-list">
                          {(comments[evt.id] || []).map((comm) => (
                            <div key={comm.id} className="comment-item">
                              <div className="comment-avatar">
                                {comm.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="comment-bubble">
                                <span className="comment-author-name">{comm.userName}</span>
                                <span className="comment-text">{comm.text}</span>
                              </div>
                            </div>
                          ))}
                          {(comments[evt.id] || []).length === 0 && (
                            <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              No comments yet. Start the conversation.
                            </p>
                          )}
                        </div>

                        <form
                          id={`comments-form-${evt.id}`}
                          className="comment-input-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.currentTarget.elements.namedItem(`comm-input-${evt.id}`) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleAddComment(evt.id, input.value);
                              input.value = "";
                            }
                          }}
                        >
                          <input
                            name={`comm-input-${evt.id}`}
                            type="text"
                            placeholder="Add a comment..."
                            className="comment-input"
                            autoComplete="off"
                          />
                          <button type="submit" className="comment-submit-btn">Post</button>
                        </form>
                      </section>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW: EXPLORE CLUBS */}
        {view === "clubs" && (
          <section id="page-clubs">
            <header className="page-header">
              <h2>Explore Clubs</h2>
              <div className="page-actions">
                {currentUser.role !== "VIEWER" && (
                  <button
                    id="btn-create-club"
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
              </div>
            </header>

            {loading && clubs.length === 0 ? (
              <div className="empty-placeholder">
                <Icon.Compass />
                <h4>Loading clubs...</h4>
              </div>
            ) : clubs.length === 0 ? (
              <div className="empty-placeholder">
                <Icon.Compass />
                <h4>No Clubs Registered</h4>
                <p>Register a club to begin gathering members and attaching events.</p>
              </div>
            ) : (
              <div>
                <div className="clubs-grid">
                  {clubs.map((c) => {
                    const isOwner = c.createdById === currentUser.id;
                    const membersList = clubMembersMap[c.id] || [];
                    const isMember = membersList.some(m => m.userId === currentUser.id);
                    const requestsList = clubRequestsMap[c.id] || [];
                    const isPending = requestsList.some(r => r.userId === currentUser.id && r.status === "PENDING");
                    
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
                            <img src={c.logoUrl} alt={`${c.name} logo`} />
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
                                e.stopPropagation(); // Avoid expanding card
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

                {/* Expanded Club Admin/Detail Drawer */}
                {expandedClubId && (
                  (() => {
                    const activeClub = clubs.find(c => c.id === expandedClubId);
                    if (!activeClub) return null;
                    const isOwner = activeClub.createdById === currentUser.id;
                    const members = clubMembersMap[expandedClubId] || [];
                    const requests = clubRequestsMap[expandedClubId] || [];
                    const clubEvents = events.filter(e => e.clubId === expandedClubId);

                    return (
                      <section className="club-drawer" aria-label="Club Details">
                        <header className="club-drawer-header">
                          <div>
                            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>Club Management</span>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>{activeClub.name}</h3>
                          </div>
                          <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setExpandedClubId(null)}
                            aria-label="Close details drawer"
                          >
                            <Icon.Close />
                          </button>
                        </header>

                        <nav className="club-drawer-tabs" aria-label="Club section tabs">
                          <button
                            type="button"
                            className={`club-drawer-tab-btn ${clubTab === "members" ? "active" : ""}`}
                            onClick={() => setClubTab("members")}
                          >
                            Members ({members.length})
                          </button>
                          {isOwner && (
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
                            <div className="club-drawer-table-wrapper">
                              <table className="club-table">
                                <thead>
                                  <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Joined At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {members.map((m) => (
                                    <tr key={m.id}>
                                      <td>{m.user?.name || "Member"}</td>
                                      <td>{m.role}</td>
                                      <td>{formatDate(m.joinedAt)}</td>
                                    </tr>
                                  ))}
                                  {members.length === 0 && (
                                    <tr>
                                      <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                        No members in this club.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {clubTab === "requests" && isOwner && (
                            <div className="club-drawer-table-wrapper">
                              <table className="club-table">
                                <thead>
                                  <tr>
                                    <th>User</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {requests.map((r) => (
                                    <tr key={r.id}>
                                      <td>{r.user?.name || "User"}</td>
                                      <td>{r.status}</td>
                                      <td>
                                        {r.status === "PENDING" ? (
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
                                        ) : (
                                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Reviewed</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                  {requests.length === 0 && (
                                    <tr>
                                      <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                        No active join requests.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {clubTab === "events" && (
                            <div className="club-drawer-table-wrapper">
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
                                  {clubEvents.length === 0 && (
                                    <tr>
                                      <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                        No events linked to this club yet.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })()
                )}
              </div>
            )}
          </section>
        )}

        {/* VIEW: UPLOAD MEDIA */}
        {view === "upload" && (
          <section id="page-upload">
            <header className="page-header">
              <h2>Upload Media</h2>
            </header>

            <form className="upload-card" onSubmit={handleUploadMedia}>
              <div className="form-group">
                <label htmlFor="upload-event">Select Event</label>
                <select
                  id="upload-event"
                  className="form-select"
                  value={uploadSelectedEventId}
                  onChange={(e) => setUploadSelectedEventId(e.target.value)}
                  required
                >
                  <option value="">Choose an event...</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.category})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "16px", margin: "16px 0 8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem" }}>
                  <input
                    type="radio"
                    checked={uploadMediaSource === "preset"}
                    onChange={() => setUploadMediaSource("preset")}
                  />
                  Choose Preset Image
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem" }}>
                  <input
                    type="radio"
                    checked={uploadMediaSource === "url"}
                    onChange={() => setUploadMediaSource("url")}
                  />
                  Custom Image URL
                </label>
              </div>

              {uploadMediaSource === "preset" ? (
                <div className="preset-selector">
                  <p>Preset Photos</p>
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
              ) : (
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label htmlFor="upload-media-url">Image URL</label>
                  <input
                    id="upload-media-url"
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={uploadMediaUrl}
                    onChange={(e) => setUploadMediaUrl(e.target.value)}
                  />
                </div>
              )}

              {/* Upload Preview */}
              <div className="upload-preview-container">
                <img
                  src={
                    uploadMediaSource === "preset"
                      ? PRESET_MEDIAS.find(p => p.id === uploadPresetId)?.url
                      : uploadMediaUrl || "https://images.unsplash.com/photo-1557683316-973673baf926?w=800"
                  }
                  alt="Upload preview"
                  className="upload-preview-image"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="upload-caption">Caption</label>
                <input
                  id="upload-caption"
                  type="text"
                  className="form-input"
                  placeholder="Describe this photo..."
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                />
              </div>

              {isUploading && (
                <div>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "14px" }}>
                    Compressing and uploading file... {uploadProgress}%
                  </p>
                </div>
              )}

              <button
                id="btn-upload-submit"
                type="submit"
                className="form-submit-btn"
                disabled={isUploading || uploadSelectedEventId === ""}
                style={{ width: "100%", margin: 0 }}
              >
                {isUploading ? "Uploading..." : "Upload Media under Event"}
              </button>
            </form>
          </section>
        )}

        {/* VIEW: MY PROFILE */}
        {view === "profile" && (
          <section id="page-profile">
            <header className="page-header">
              <h2>My Profile</h2>
            </header>

            <article className="profile-card">
              <div className="profile-avatar-container">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-details">
                <div className="profile-header-row">
                  <h3 className="profile-name">{currentUser.name}</h3>
                  <span className="profile-role-tag">{currentUser.role}</span>
                </div>
                <p className="profile-email">{currentUser.email}</p>

                <div className="profile-stats-row">
                  <div className="profile-stat-item">
                    <span className="profile-stat-num">{userEvents.length}</span>
                    <span className="profile-stat-label">Events Created</span>
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

            <div className="profile-tabs" aria-label="Profile navigation tabs">
              <button type="button" className="profile-tab-btn active">
                My Managed Events ({userEvents.length})
              </button>
            </div>

            {userEvents.length === 0 ? (
              <div className="empty-placeholder">
                <Icon.Calendar />
                <h4>No Events Created</h4>
                <p>You haven't scheduled any events yet.</p>
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
                      <img src={evt.coverImage} alt={evt.title} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#1f2937", display: "grid", placeItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No cover</span>
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

      {/* MODAL: CREATE OR UPDATE EVENT */}
      {isEventModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <header className="modal-header">
              <h3>{selectedEventId ? "Edit Event" : "Create Event"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsEventModalOpen(false);
                  setSelectedEventId(null);
                  setEventDraft(emptyDraft());
                }}
                aria-label="Close event modal"
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
                  placeholder="e.g. Moonlight Convocation"
                  value={eventDraft.title}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="evt-category">Category</label>
                <input
                  id="evt-category"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Workshop, Music, Sports"
                  value={eventDraft.category}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="evt-desc">Description</label>
                <textarea
                  id="evt-desc"
                  rows={3}
                  className="form-input"
                  placeholder="A brief atmospheric description..."
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
                  placeholder="e.g. Courtyard East"
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
                  placeholder="https://images.example.com/event.jpg"
                  value={eventDraft.coverImage}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, coverImage: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="evt-club">Link to Club</label>
                <select
                  id="evt-club"
                  className="form-select"
                  value={eventDraft.clubId}
                  onChange={(e) => setEventDraft(prev => ({ ...prev, clubId: e.target.value }))}
                >
                  <option value="">No club attached (Standalone)</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
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

      {/* MODAL: CREATE CLUB */}
      {isClubModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <header className="modal-header">
              <h3>Create Club</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsClubModalOpen(false)}
                aria-label="Close club modal"
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
                  placeholder="e.g. Photography Society"
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
                  placeholder="What is this club about..."
                  value={clubDraft.description}
                  onChange={(e) => setClubDraft(prev => ({ ...prev, description: e.target.value }))}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="club-logo">Logo URL (Optional)</label>
                <input
                  id="club-logo"
                  type="url"
                  className="form-input"
                  placeholder="https://images.example.com/logo.png"
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
    </div>
  );
}

export default App;
