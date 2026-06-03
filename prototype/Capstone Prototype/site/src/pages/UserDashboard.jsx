import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Bookmark, ChevronRight, Camera, Mail, Lock, Eye, EyeOff, CalendarCheck } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useEvents } from "../hooks/useEvents";
import BookmarkedEventsSection from "../components/BookmarkedEventsSection";
import AttendingEventsSection from "../components/AttendingEventsSection";

const NAV_SECTIONS = [
  { id: "profile",   label: "Profile",           description: "Account information",  icon: User },
  { id: "bookmarks", label: "Bookmarked Events", description: "Your saved events",    icon: Bookmark },
  { id: "attending", label: "Attending Events",  description: "Events you're going to", icon: CalendarCheck },
];

// ─── User Profile Section ─────────────────────────────────────────────────────

function UserProfileSection({ user, setUser }) {
  const [form, setForm] = useState({
    displayName: user?.name || "",
    email: user?.email || "",
    currentPw: "",
    newPw: "",
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const inputCls =
    "w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
  const saveBtnCls = (saved) =>
    `mt-4 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
      saved ? "bg-green-100 text-green-700" : "bg-[#9FB366] hover:bg-[#8a9c57] text-white"
    }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Profile Photo */}
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#9FB366] flex items-center justify-center text-white text-2xl font-bold select-none flex-shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || "U"}
          </div>
          <div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Camera size={14} />
              Upload Photo
            </button>
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or GIF · Max 2 MB</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Account Information */}
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Display Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setUser((p) => ({ ...p, name: form.displayName, email: form.email }));
            setAccountSaved(true);
            setTimeout(() => setAccountSaved(false), 2000);
          }}
          className={saveBtnCls(accountSaved)}
        >
          {accountSaved ? "Saved!" : "Save Account"}
        </button>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Change Password */}
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Current Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrentPw ? "text" : "password"}
                value={form.currentPw}
                onChange={(e) => setForm((f) => ({ ...f, currentPw: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">New Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPw ? "text" : "password"}
                value={form.newPw}
                onChange={(e) => setForm((f) => ({ ...f, newPw: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setPwSaved(true); setTimeout(() => setPwSaved(false), 2000); }}
          className={saveBtnCls(pwSaved)}
        >
          {pwSaved ? "Updated!" : "Update Password"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const {
    user, setUser, authLoading,
    bookmarkedEvents, toggleBookmark,
    bookmarkGroups, addBookmarkGroup, removeBookmarkGroup,
    eventGroupMap, addEventToGroup, removeEventFromGroup,
    attendingEvents, unmarkAttending,
  } = useUser();
  const { events: allCatalogEvents } = useEvents();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState(() => {
    const s = location.state?.section;
    return s === "bookmarks" ? "bookmarks" : "profile";
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/signin");
  }, [user, authLoading, navigate]);

  if (authLoading) return null;
  if (!user) return null;

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="md:w-72 flex-shrink-0">
            {/* Mobile: horizontal pills */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-1 mb-4">
              {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === id
                      ? "bg-[#9FB366] text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-[#9FB366]/50"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop: sidebar card */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Profile summary */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-[#9FB366]/10 to-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#9FB366] text-white font-bold text-xl flex items-center justify-center flex-shrink-0 select-none">
                    {user.name?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base leading-tight">{user.name}</p>
                    <p className="text-sm text-[#9FB366] font-medium mt-0.5">Member</p>
                    <p className="text-xs text-gray-400 mt-0.5">Seattle, WA</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-[#9FB366]/20">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{bookmarkedEvents.size}</p>
                    <p className="text-xs text-gray-400">Saved</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{bookmarkGroups.length}</p>
                    <p className="text-xs text-gray-400">Groups</p>
                  </div>
                </div>
              </div>

              {/* Nav items */}
              {NAV_SECTIONS.map(({ id, label, description, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors border-b border-gray-100 last:border-0 ${
                      active ? "bg-[#9FB366]/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-[#9FB366]" : "bg-gray-100"}`}>
                      <Icon size={18} className={active ? "text-white" : "text-gray-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${active ? "text-[#9FB366]" : "text-gray-800"}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                    </div>
                    {active && <ChevronRight size={16} className="text-[#9FB366] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {activeSection === "profile" && (
              <UserProfileSection user={user} setUser={setUser} />
            )}
            {activeSection === "bookmarks" && (
              <BookmarkedEventsSection
                allEvents={allCatalogEvents}
                bookmarkedEvents={bookmarkedEvents}
                bookmarkGroups={bookmarkGroups}
                eventGroupMap={eventGroupMap}
                toggleBookmark={toggleBookmark}
                addBookmarkGroup={addBookmarkGroup}
                removeBookmarkGroup={removeBookmarkGroup}
                addEventToGroup={addEventToGroup}
                removeEventFromGroup={removeEventFromGroup}
              />
            )}
            {activeSection === "attending" && (
              <AttendingEventsSection
                allEvents={allCatalogEvents}
                attendingEvents={attendingEvents}
                unmarkAttending={unmarkAttending}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
