import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { fetchUserAttendance, markAttendance, unmarkAttendance, trackAnalytic } from "../lib/events";
import { fetchSpacesByHost, fetchAllSpaces } from "../lib/spaces";
import { fetchHostTemplates, upsertTemplate, deleteTemplate } from "../lib/templates";
import { clearCache } from "../lib/cache";
import {
  fetchUserBookmarks,
  fetchUserBookmarkGroups,
  insertBookmark,
  deleteBookmark,
  updateBookmarkGroups,
  insertBookmarkGroup,
  deleteBookmarkGroup,
} from "../lib/bookmarks";
import { fetchUserLikes, insertLike, deleteLike } from "../lib/likes";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Supabase auth bootstrap ───────────────────────────────────────────────────
  useEffect(() => {
    // Restore existing session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchAndSetProfile(session.user);
      } else {
        setAuthLoading(false);
      }
    });

    // Keep user in sync with auth state changes (sign in / sign out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchAndSetProfile(session.user);
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchAndSetProfile(authUser) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authUser.id)
        .single();

      console.log("[auth] profile loaded:", profile);

      const role = profile?.role ?? "user";

      const [attendedIds, dbSpaces, dbTemplates, dbBookmarks, dbBookmarkGroups, likedIds] = await Promise.all([
        fetchUserAttendance(authUser.id).catch(() => []),
        (role === "admin" ? fetchAllSpaces() : fetchSpacesByHost(authUser.id)).catch(() => []),
        (role === "host" || role === "admin") ? fetchHostTemplates(authUser.id).catch(() => []) : Promise.resolve([]),
        fetchUserBookmarks(authUser.id).catch(() => []),
        fetchUserBookmarkGroups(authUser.id).catch(() => []),
        fetchUserLikes(authUser.id).catch(() => []),
      ]);

      setUser({
        id:    authUser.id,
        email: authUser.email,
        name:  profile?.full_name ?? authUser.email.split("@")[0],
        role,
      });
      setAttendingEvents(new Set(attendedIds));
      setCreatedSpaces(dbSpaces);
      setHostTemplates(dbTemplates);

      // Hydrate bookmarks state from DB
      setBookmarkedEvents(new Set(dbBookmarks.map((b) => b.event_id)));
      setEventGroupMap(
        Object.fromEntries(dbBookmarks.map((b) => [b.event_id, b.group_ids || ["default"]])),
      );
      setBookmarkGroups([
        { id: "default", name: "Saved Events" },
        ...dbBookmarkGroups,
      ]);
      setLikedEvents(new Set(likedIds));
    } catch (err) {
      console.error("[auth] fetchAndSetProfile failed:", err);
      setUser({
        id:    authUser.id,
        email: authUser.email,
        name:  authUser.email.split("@")[0],
        role:  "user",
      });
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Auth actions ──────────────────────────────────────────────────────────────
  async function signUp(email, password, fullName, role) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Insert profile row — role is validated to prevent admin self-assignment
    if (data.user) {
      const safeRole = role === "host" ? "host" : "user";
      const { error: profileError } = await supabase.from("profiles").insert({
        id:        data.user.id,
        email,
        full_name: fullName,
        role:      safeRole,
      });
      if (profileError) throw profileError;

      // supabase.auth.signUp triggers onAuthStateChange, which races
      // fetchAndSetProfile against the INSERT above. The SELECT often wins,
      // finds no row, and falls back to role="user" — locking new hosts out
      // of host-only routes until a manual refresh. Re-run the loader now
      // that the profile row definitely exists.
      await fetchAndSetProfile(data.user);
    }

    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarkedEvents(new Set());
    setEventGroupMap({});
    setBookmarkGroups([{ id: "default", name: "Saved Events" }]);
    setAttendingEvents(new Set());
    setLikedEvents(new Set());
    setLikeDeltas({});
    setLikeInFlight(new Set());
    localStorage.removeItem("bookmarkedEvents");
    localStorage.removeItem("deletedEventIds");
    localStorage.removeItem("deletedStaticSpaces");
    // Drop any role-scoped rows the previous user may have surfaced into cache.
    clearCache();
  }

  // ── Local prototype state (unchanged) ────────────────────────────────────────
  const [createdEvents, setCreatedEvents] = useState([]);
  const [deletedEventIds, setDeletedEventIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("deletedEventIds") || "[]")); }
    catch { return new Set(); }
  });
  const [editedEvents, setEditedEvents] = useState({});
  const [hiddenEventIds, setHiddenEventIds] = useState(new Set());
  const [createdSpaces, setCreatedSpaces] = useState([]);
  const [deletedStaticSpaceIds, setDeletedStaticSpaceIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("deletedStaticSpaces") || "[]")); }
    catch { return new Set(); }
  });

  const [hostTemplates, setHostTemplates] = useState([]);

  async function addHostTemplate(tpl) {
    const withOwner = { ...tpl, host_id: tpl.host_id };
    setHostTemplates((prev) => [...prev, withOwner]);
    try {
      const saved = await upsertTemplate(withOwner);
      setHostTemplates((prev) => prev.map((t) => (t.id === withOwner.id ? saved : t)));
    } catch (err) {
      setHostTemplates((prev) => prev.filter((t) => t.id !== withOwner.id));
      console.warn("Failed to save template:", err.message);
      throw err;
    }
  }

  async function updateHostTemplate(id, changes) {
    let existing;
    setHostTemplates((prev) => {
      existing = prev.find((t) => t.id === id);
      return prev.map((t) => (t.id === id ? { ...t, ...changes } : t));
    });
    try {
      const saved = await upsertTemplate({ ...existing, ...changes, id });
      setHostTemplates((prev) => prev.map((t) => (t.id === id ? saved : t)));
    } catch (err) {
      setHostTemplates((prev) => prev.map((t) => (t.id === id ? (existing || t) : t)));
      console.warn("Failed to update template:", err.message);
      throw err;
    }
  }

  async function deleteHostTemplate(id) {
    const prev = hostTemplates.find((t) => t.id === id);
    setHostTemplates((p) => p.filter((t) => t.id !== id));
    try {
      await deleteTemplate(id);
    } catch (err) {
      if (prev) setHostTemplates((p) => [...p, prev]);
      console.warn("Failed to delete template:", err.message);
    }
  }

  const [bookmarkedEvents, setBookmarkedEvents] = useState(() => {
    const saved = localStorage.getItem("bookmarkedEvents");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [bookmarkGroups, setBookmarkGroups] = useState([{ id: "default", name: "Saved Events" }]);
  const [eventGroupMap, setEventGroupMap] = useState({});
  const [attendingEvents, setAttendingEvents] = useState(new Set());
  const [likedEvents, setLikedEvents] = useState(new Set());
  // Per-session delta vs the like count we last fetched from the DB. Lets the
  // visible count update instantly on click and rolls back on sync failure.
  const [likeDeltas, setLikeDeltas] = useState({});
  // In-flight toggle guard so rapid double-clicks can't queue duplicate ops.
  const [likeInFlight, setLikeInFlight] = useState(new Set());

  function getLikeCount(event) {
    if (!event) return 0;
    return Math.max(0, (event.likes ?? 0) + (likeDeltas[event.id] || 0));
  }

  function toggleLike(eventId) {
    if (!user) return;
    if (likeInFlight.has(eventId)) return;
    const wasLiked = likedEvents.has(eventId);
    const delta = wasLiked ? -1 : 1;

    setLikedEvents((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
    setLikeDeltas((prev) => ({ ...prev, [eventId]: (prev[eventId] || 0) + delta }));
    setLikeInFlight((prev) => new Set(prev).add(eventId));

    const op = wasLiked ? deleteLike(eventId) : insertLike(eventId);
    op
      .catch((err) => {
        console.warn("Like sync failed:", err.message);
        setLikedEvents((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(eventId);
          else next.delete(eventId);
          return next;
        });
        setLikeDeltas((prev) => ({ ...prev, [eventId]: (prev[eventId] || 0) - delta }));
      })
      .finally(() => {
        setLikeInFlight((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      });
  }

  function addCreatedSpace(space) {
    setCreatedSpaces((prev) => [space, ...prev]);
  }
  function replaceCreatedSpace(tempId, realSpace) {
    setCreatedSpaces((prev) => prev.map((s) => (s.id === tempId ? realSpace : s)));
  }
  function deleteCreatedSpace(id) {
    setCreatedSpaces((prev) => prev.filter((s) => s.id !== id));
  }
  function updateCreatedSpace(id, updated) {
    setCreatedSpaces((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }

  function addCreatedEvent(event) {
    setCreatedEvents((prev) => [event, ...prev]);
  }
  function replaceCreatedEvent(tempId, realEvent) {
    setCreatedEvents((prev) => prev.map((e) => (e.id === tempId ? realEvent : e)));
    setEditedEvents((prev) => {
      if (!prev[tempId]) return prev;
      const next = { ...prev, [realEvent.id]: prev[tempId] };
      delete next[tempId];
      return next;
    });
  }
  function deleteEvent(id) {
    setCreatedEvents((prev) => prev.filter((e) => e.id !== id));
    setDeletedEventIds((prev) => {
      const next = new Set([...prev, id]);
      localStorage.setItem("deletedEventIds", JSON.stringify([...next]));
      return next;
    });
  }

  function addDeletedStaticSpace(id) {
    setDeletedStaticSpaceIds((prev) => {
      const next = new Set([...prev, id]);
      localStorage.setItem("deletedStaticSpaces", JSON.stringify([...next]));
      return next;
    });
  }
  function hideEvent(id) {
    setHiddenEventIds((prev) => new Set([...prev, id]));
  }
  function showEvent(id) {
    setHiddenEventIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  function updateEvent(id, updatedEvent) {
    setCreatedEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = updatedEvent;
      return next;
    });
    setEditedEvents((prev) => ({ ...prev, [id]: updatedEvent }));
  }

  function toggleBookmark(eventId) {
    const wasBookmarked = bookmarkedEvents.has(eventId);
    const prevGroups = eventGroupMap[eventId];

    // Optimistic update
    setBookmarkedEvents((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(eventId);
      else next.add(eventId);
      localStorage.setItem("bookmarkedEvents", JSON.stringify([...next]));
      return next;
    });
    if (wasBookmarked) {
      setEventGroupMap((g) => { const ng = { ...g }; delete ng[eventId]; return ng; });
    } else {
      setEventGroupMap((g) => ({ ...g, [eventId]: ["default"] }));
      trackAnalytic(eventId, "bookmark", user?.id ?? null);
    }

    if (!user) return;

    const op = wasBookmarked
      ? deleteBookmark(eventId)
      : insertBookmark(eventId, ["default"]);

    op.catch((err) => {
      console.warn("Bookmark sync failed:", err.message);
      // Rollback
      setBookmarkedEvents((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(eventId);
        else next.delete(eventId);
        localStorage.setItem("bookmarkedEvents", JSON.stringify([...next]));
        return next;
      });
      setEventGroupMap((g) => {
        const ng = { ...g };
        if (wasBookmarked && prevGroups) ng[eventId] = prevGroups;
        else delete ng[eventId];
        return ng;
      });
    });
  }

  async function addBookmarkGroup(name) {
    if (!user) {
      const tempId = `group-${Date.now()}`;
      setBookmarkGroups((prev) => [...prev, { id: tempId, name }]);
      return tempId;
    }
    const tempId = `temp-${Date.now()}`;
    setBookmarkGroups((prev) => [...prev, { id: tempId, name }]);
    try {
      const saved = await insertBookmarkGroup(name);
      setBookmarkGroups((prev) => prev.map((g) => (g.id === tempId ? saved : g)));
      return saved.id;
    } catch (err) {
      console.warn("Create bookmark group failed:", err.message);
      setBookmarkGroups((prev) => prev.filter((g) => g.id !== tempId));
      return null;
    }
  }

  function removeBookmarkGroup(groupId) {
    if (groupId === "default") return;
    const prevGroups = bookmarkGroups;
    const prevMap = eventGroupMap;

    setBookmarkGroups((prev) => prev.filter((g) => g.id !== groupId));
    const affectedEventIds = [];
    setEventGroupMap((prev) => {
      const next = {};
      Object.keys(prev).forEach((id) => {
        const groups = (prev[id] || ["default"]).filter((g) => g !== groupId);
        next[id] = groups.length > 0 ? groups : ["default"];
        if ((prev[id] || []).includes(groupId)) affectedEventIds.push(id);
      });
      return next;
    });

    if (!user) return;

    Promise.all([
      deleteBookmarkGroup(groupId),
      // Strip groupId from any bookmarks that referenced it
      ...affectedEventIds.map((eid) => {
        const remaining = (prevMap[eid] || ["default"]).filter((g) => g !== groupId);
        return updateBookmarkGroups(eid, remaining);
      }),
    ]).catch((err) => {
      console.warn("Delete bookmark group failed:", err.message);
      setBookmarkGroups(prevGroups);
      setEventGroupMap(prevMap);
    });
  }

  function addEventToGroup(eventId, groupId) {
    const current = eventGroupMap[eventId] || ["default"];
    if (current.includes(groupId)) return;
    const updated = [...current, groupId];
    setEventGroupMap((prev) => ({ ...prev, [eventId]: updated }));

    if (!user) return;
    updateBookmarkGroups(eventId, updated).catch((err) => {
      console.warn("Add to group failed:", err.message);
      setEventGroupMap((prev) => ({ ...prev, [eventId]: current }));
    });
  }

  function removeEventFromGroup(eventId, groupId) {
    const current = eventGroupMap[eventId] || ["default"];
    const filtered = current.filter((g) => g !== groupId);
    const updated = filtered.length > 0 ? filtered : ["default"];
    setEventGroupMap((prev) => ({ ...prev, [eventId]: updated }));

    if (!user) return;
    updateBookmarkGroups(eventId, updated).catch((err) => {
      console.warn("Remove from group failed:", err.message);
      setEventGroupMap((prev) => ({ ...prev, [eventId]: current }));
    });
  }

  function markAttending(eventId) {
    setAttendingEvents((prev) => new Set([...prev, eventId]));
    markAttendance(eventId).catch((err) => {
      setAttendingEvents((prev) => { const next = new Set(prev); next.delete(eventId); return next; });
      console.warn("Failed to mark attendance:", err.message);
    });
  }
  function unmarkAttending(eventId) {
    setAttendingEvents((prev) => { const next = new Set(prev); next.delete(eventId); return next; });
    unmarkAttendance(eventId).catch((err) => {
      setAttendingEvents((prev) => new Set([...prev, eventId]));
      console.warn("Failed to unmark attendance:", err.message);
    });
  }

  return (
    <UserContext.Provider
      value={{
        user, setUser, authLoading,
        signUp, signIn, signOut,
        createdSpaces, setCreatedSpaces, addCreatedSpace, replaceCreatedSpace, deleteCreatedSpace, updateCreatedSpace,
        deletedStaticSpaceIds, addDeletedStaticSpace,
        hostTemplates, addHostTemplate, updateHostTemplate, deleteHostTemplate,
        createdEvents, addCreatedEvent, replaceCreatedEvent,
        deletedEventIds, deleteEvent,
        editedEvents, updateEvent,
        hiddenEventIds, hideEvent, showEvent,
        bookmarkedEvents, toggleBookmark,
        bookmarkGroups, addBookmarkGroup, removeBookmarkGroup,
        eventGroupMap, addEventToGroup, removeEventFromGroup,
        attendingEvents, markAttending, unmarkAttending,
        likedEvents, toggleLike, getLikeCount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
