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

type SessionForm = {
  email: string;
  password: string;
};

const STORAGE_KEY = "eventvault.session";

const emptyDraft = (): EventDraft => ({
  title: "",
  description: "",
  category: "",
  visibility: "PUBLIC",
  location: "",
  eventDate: "",
  coverImage: "",
  clubId: "",
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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const getInitialSession = (): SessionTokens | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionTokens;
  } catch {
    return null;
  }
};

function App() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [session, setSession] = useState<SessionTokens | null>(getInitialSession);
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    email: "",
    password: "",
  });
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<EventSortBy>("eventDate");
  const [sortOrder, setSortOrder] = useState<EventSortOrder>("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | EventVisibility>("all");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("Waiting for a session");
  const [error, setError] = useState("");

  const refreshData = async () => {
    setLoading(true);
    setError("");

    try {
      const filters: EventFilters = {
        sortBy,
        sortOrder,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        clubId: clubFilter === "all" ? undefined : clubFilter,
        visibility:
          visibilityFilter === "all" ? undefined : visibilityFilter,
      };

      const [eventPayload, clubPayload] = await Promise.all([
        api.listEvents(filters),
        api.listClubs(),
      ]);

      setEvents(eventPayload.events);
      setClubs(clubPayload.clubs);
      setStatus(
        `Loaded ${eventPayload.events.length} events across ${clubPayload.clubs.length} clubs.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard data");
      setStatus("Showing the dashboard shell while the API reconnects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, [sortBy, sortOrder, categoryFilter, clubFilter, visibilityFilter]);

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
      } catch {
        setCurrentUser(null);
        setStatus("Your session expired. Sign in again to edit events.");
      }
    };

    void syncSession();
  }, [session]);

  useEffect(() => {
    if (!selectedEventId) {
      setDraft(emptyDraft());
      return;
    }

    const selectedEvent = events.find((event) => event.id === selectedEventId);

    if (!selectedEvent) {
      setSelectedEventId(null);
      setDraft(emptyDraft());
      return;
    }

    setDraft(toDraft(selectedEvent));
  }, [selectedEventId, events]);

  const selectedEvent =
    selectedEventId === null
      ? null
      : events.find((event) => event.id === selectedEventId) ?? null;

  const categories = ["all", ...new Set(events.map((event) => event.category))];

  const visibleEvents = events;
  const featuredEvent = events[0] ?? null;
  const totalEvents = events.length;
  const privateEvents = events.filter((event) => event.visibility === "PRIVATE").length;
  const clubLinkedEvents = events.filter((event) => event.clubId !== null).length;

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorking(true);
    setError("");

    try {
      const payload = await api.login(sessionForm.email, sessionForm.password);
      setSession(payload.tokens);
      setCurrentUser(payload.user);
      setStatus(`Welcome back, ${payload.user.name}.`);
      setSessionForm({ email: "", password: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setWorking(false);
    }
  };

  const logout = () => {
    setSession(null);
    setCurrentUser(null);
    setStatus("Session cleared.");
  };

  const saveEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session) {
      setError("Sign in before creating or editing events.");
      return;
    }

    setWorking(true);
    setError("");

    try {
      const payload = toPayload(draft);

      if (!payload.title || !payload.category || !payload.eventDate) {
        throw new Error("Title, category, and event date are required.");
      }

      if (selectedEventId) {
        await api.updateEvent(selectedEventId, payload, session.accessToken);
        setStatus("Event updated with stage-ready polish.");
      } else {
        await api.createEvent(payload, session.accessToken);
        setStatus("Event created and added to the vault.");
      }

      setSelectedEventId(null);
      setDraft(emptyDraft());
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the event");
    } finally {
      setWorking(false);
    }
  };

  const deleteSelectedEvent = async () => {
    if (!session || !selectedEventId) {
      return;
    }

    if (!window.confirm("Delete this event from the vault?")) {
      return;
    }

    setWorking(true);
    setError("");

    try {
      await api.deleteEvent(selectedEventId, session.accessToken);
      setSelectedEventId(null);
      setDraft(emptyDraft());
      setStatus("Event removed from the vault.");
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the event");
    } finally {
      setWorking(false);
    }
  };

  const openEvent = (event: EventSummary) => {
    setSelectedEventId(event.id);
  };

  return (
    <div className="app-shell">
      <div className="orb orb--one" />
      <div className="orb orb--two" />
      <div className="orb orb--three" />

      <header className="topbar">
        <div>
          <p className="eyebrow">Phase 4</p>
          <h1>EventVault</h1>
        </div>

        <div className="topbar__status">
          <span className={`status-dot ${error ? "status-dot--warn" : "status-dot--ok"}`} />
          <span>{error || status}</span>
        </div>
      </header>

      <main className="layout">
        <section className="hero panel">
          <div className="hero__copy">
            <p className="hero__label">Event Management</p>
            <h2>Shape the calendar like a magazine spread, not a dashboard template.</h2>
            <p className="hero__text">
              Plan events, tune visibility, assign clubs, and keep the whole vault in one
              high-contrast, editorial workspace.
            </p>

            <div className="hero__stats">
              <article>
                <strong>{totalEvents.toString().padStart(2, "0")}</strong>
                <span>events live</span>
              </article>
              <article>
                <strong>{clubLinkedEvents.toString().padStart(2, "0")}</strong>
                <span>club-linked</span>
              </article>
              <article>
                <strong>{privateEvents.toString().padStart(2, "0")}</strong>
                <span>private</span>
              </article>
            </div>
          </div>

          <div className="hero__feature">
            <p className="hero__feature-tag">Featured</p>
            {featuredEvent ? (
              <>
                <h3>{featuredEvent.title}</h3>
                <p>{featuredEvent.description || "No description supplied yet."}</p>
                <div className="hero__feature-meta">
                  <span>{featuredEvent.category}</span>
                  <span>{formatDate(featuredEvent.eventDate)}</span>
                  <span>{featuredEvent.visibility}</span>
                </div>
              </>
            ) : (
              <p className="hero__feature-empty">
                No events yet. Create the first one with the form on the right.
              </p>
            )}
          </div>
        </section>

        <aside className="sidebar">
          <section className="panel session-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Session vault</p>
                <h3>{currentUser ? currentUser.name : "Sign in"}</h3>
              </div>
              <span className={currentUser ? "badge badge--green" : "badge badge--muted"}>
                {currentUser ? currentUser.role : "guest"}
              </span>
            </div>

            {currentUser ? (
              <div className="session-panel__profile">
                <div className="avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{currentUser.name}</strong>
                  <p>{currentUser.email}</p>
                </div>
              </div>
            ) : (
              <form className="stack" onSubmit={login}>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={sessionForm.email}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="aarav@example.com"
                  />
                </label>

                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    value={sessionForm.password}
                    onChange={(event) =>
                      setSessionForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Your password"
                  />
                </label>

                <button type="submit" className="primary-button" disabled={working}>
                  {working ? "Signing in..." : "Connect session"}
                </button>
              </form>
            )}

            {currentUser ? (
              <button type="button" className="secondary-button" onClick={logout}>
                Disconnect
              </button>
            ) : null}
          </section>

          <section className="panel editor-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Editor</p>
                <h3>{selectedEvent ? "Update event" : "Create event"}</h3>
              </div>

              <button type="button" className="ghost-button" onClick={() => setSelectedEventId(null)}>
                New
              </button>
            </div>

            <form className="editor-form" onSubmit={saveEvent}>
              <label>
                <span>Title</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Moonlight Convocation"
                />
              </label>

              <label>
                <span>Category</span>
                <input
                  list="event-categories"
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="Workshop"
                />
              </label>

              <datalist id="event-categories">
                {categories
                  .filter((category) => category !== "all")
                  .map((category) => (
                    <option key={category} value={category} />
                  ))}
              </datalist>

              <label>
                <span>Description</span>
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Write a short atmospheric description..."
                />
              </label>

              <div className="editor-grid">
                <label>
                  <span>Date and time</span>
                  <input
                    type="datetime-local"
                    value={draft.eventDate}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        eventDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Visibility</span>
                  <select
                    value={draft.visibility}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        visibility: event.target.value as EventVisibility,
                      }))
                    }
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Location</span>
                <input
                  value={draft.location}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, location: event.target.value }))
                  }
                  placeholder="Main stage, east courtyard"
                />
              </label>

              <label>
                <span>Cover image URL</span>
                <input
                  value={draft.coverImage}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, coverImage: event.target.value }))
                  }
                  placeholder="https://images.example.com/event.jpg"
                />
              </label>

              <label>
                <span>Club</span>
                <select
                  value={draft.clubId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, clubId: event.target.value }))
                  }
                >
                  <option value="">No club attached</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="editor-actions">
                <button type="submit" className="primary-button" disabled={working}>
                  {working ? "Saving..." : selectedEvent ? "Update event" : "Create event"}
                </button>

                {selectedEvent ? (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={deleteSelectedEvent}
                    disabled={working}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </aside>
      </main>

      <section className="panel library-panel">
        <div className="panel-heading panel-heading--wide">
          <div>
            <p className="panel-kicker">Library</p>
            <h3>Browse the vault</h3>
          </div>

          <div className="toolbar">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as EventSortBy)}>
              <option value="eventDate">Sort by date</option>
              <option value="title">Sort by title</option>
              <option value="category">Sort by category</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as EventSortOrder)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>

            <select
              value={clubFilter}
              onChange={(event) => setClubFilter(event.target.value)}
            >
              <option value="all">All clubs</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>

            <select
              value={visibilityFilter}
              onChange={(event) =>
                setVisibilityFilter(event.target.value as "all" | EventVisibility)
              }
            >
              <option value="all">All visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>

        <div className="chip-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip ${categoryFilter === category ? "chip--active" : ""}`}
              onClick={() => setCategoryFilter(category)}
            >
              {category === "all" ? "All categories" : category}
            </button>
          ))}
        </div>

        <div className="library-grid">
          {loading && events.length === 0 ? (
            <article className="empty-state">
              <p className="panel-kicker">Loading</p>
              <h4>Pulling in the vault</h4>
              <p>Fetching the latest events and club roster from the API.</p>
            </article>
          ) : null}

          {visibleEvents.map((event) => (
            <article
              key={event.id}
              className={`event-card ${selectedEventId === event.id ? "event-card--active" : ""}`}
              onClick={() => openEvent(event)}
              role="button"
              tabIndex={0}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                  openEvent(event);
                }
              }}
            >
              <div className="event-card__top">
                <span className="event-date">{formatDate(event.eventDate)}</span>
                <span className={`event-visibility event-visibility--${event.visibility.toLowerCase()}`}>
                  {event.visibility}
                </span>
              </div>

              <h4>{event.title}</h4>
              <p>{event.description || "No description provided."}</p>

              <div className="event-card__meta">
                <span>{event.category}</span>
                <span>{event.club?.name || "Standalone"}</span>
                <span>{formatTime(event.eventDate)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
