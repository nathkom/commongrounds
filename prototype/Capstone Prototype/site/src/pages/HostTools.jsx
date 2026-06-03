import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User, FileText, Calendar, Camera, Building2, Mail, Lock,
  Globe, Plus, Edit2, Eye, EyeOff, ChevronRight,
  Upload, MapPin, X, Check, Trash2, Bookmark, CalendarCheck, Users, BarChart3,
  ArrowLeft, Clock, Search,
} from "lucide-react";
import EventGallery from "../components/EventGallery";
import AccessibilityTags from "../components/AccessibilityTags";
import { useUser } from "../context/UserContext";
import { NEIGHBORHOODS } from "../utils/filters";
import {
  fetchEventById,
  createEvent as createEventInDB,
  updateEvent as updateEventInDB,
  deleteEvent as deleteEventInDB,
  setEventHidden as setEventHiddenInDB,
  uploadEventImage,
} from "../lib/events";
import {
  createSpace as createSpaceInDB,
  updateSpace as updateSpaceInDB,
  deleteSpace as deleteSpaceInDB,
  setSpaceHidden as setSpaceHiddenInDB,
  uploadSpaceImage,
} from "../lib/spaces";
import { useEvents } from "../hooks/useEvents";
import { spaces as staticSpaces } from "../data/spaces";
import BookmarkedEventsSection from "../components/BookmarkedEventsSection";
import AttendingEventsSection from "../components/AttendingEventsSection";
import thumbtackImg from "../../wireframes/thumbtack.png";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOST_EVENT_IDS = [];

const INITIAL_TEMPLATES = [
  {
    id: "tpl-001",
    name: "Weekly Social Night",
    category: "social",
    description: "Recurring community meetup — drop-in format, flexible timing, no RSVP required.",
    lastEdited: "Feb 28, 2026",
    prefill: {
      category: "social",
      noise_level: "Friendly and open",
      accessibility_info: "Low",
      space_format: "Open mingling",
      crowd_level: 50,
      crowd_level_label: "Moderately busy",
      cost: "free",
      accessibility: [],
      tagsInput: "drop_in, community, indoor",
    },
  },
  {
    id: "tpl-002",
    name: "Arts Workshop",
    category: "arts",
    description: "Workshop template with supply list, capacity cap, and accessibility info pre-filled.",
    lastEdited: "Mar 1, 2026",
    prefill: {
      category: "arts",
      noise_level: "Creative and focused",
      accessibility_info: "Low",
      space_format: "Workshop, seated",
      crowd_level: 30,
      crowd_level_label: "Small group",
      cost: "paid",
      cost_amount: 15,
      accessibility: ["wheelchair_accessible"],
      tagsInput: "workshop, arts, beginner_friendly",
    },
  },
];

const TEMPLATE_CATEGORIES = [
  {
    id: "health-wellness",
    name: "Health & Wellness Events",
    description: "ex community garden, farmers market",
    image: `${import.meta.env.BASE_URL}images/antenna-ZDN-G1xBWHY-unsplash.jpg`,
    prefill: {
      category: "outdoors",
      noise_level: "Active and supportive",
      accessibility_info: "Low",
      space_format: "Open participation",
      crowd_level: 40,
      crowd_level_label: "Moderately busy",
    },
  },
  {
    id: "social-networking",
    name: "Social & Networking Events",
    description: "Community meetups, mixers, coffee chats",
    image: `${import.meta.env.BASE_URL}images/rizky-subagja-1k7TnX5GAww-unsplash.jpg`,
    prefill: {
      category: "social",
      noise_level: "Friendly and open",
      accessibility_info: "Low",
      space_format: "Open mingling",
      crowd_level: 55,
      crowd_level_label: "Moderately busy",
    },
  },
  {
    id: "cultural-identity",
    name: "Cultural & Identity-Based Events",
    description: "Couple word description",
    image: `${import.meta.env.BASE_URL}images/xh_s-_yekOnsm1rE-unsplash.jpg`,
    prefill: {
      category: "arts",
      noise_level: "Lively and celebratory",
      accessibility_info: "Low",
      space_format: "Mixed format",
      crowd_level: 65,
      crowd_level_label: "Moderately busy",
    },
  },
  {
    id: "markets-popups",
    name: "Markets & Pop-Ups",
    description: "Couple word description",
    image: `${import.meta.env.BASE_URL}images/nastuh-abootalebi-eHD8Y1Znfpk-unsplash.jpg`,
    prefill: {
      category: "food",
      noise_level: "Casual and browsable",
      accessibility_info: "Low",
      space_format: "Walk-through market",
      crowd_level: 60,
      crowd_level_label: "Moderately busy",
    },
  },
];

const CATEGORY_COLORS = {
  social: "bg-blue-100 text-blue-700",
  arts: "bg-purple-100 text-purple-700",
  outdoors: "bg-green-100 text-green-700",
  food: "bg-orange-100 text-orange-700",
  sports: "bg-red-100 text-red-700",
  educational: "bg-yellow-100 text-yellow-700",
};

const COST_BADGE = {
  free: "bg-green-100 text-green-700",
  suggested_donation: "bg-yellow-100 text-yellow-700",
  paid: "bg-gray-100 text-gray-600",
};

const COST_LABEL = {
  free: "Free",
  suggested_donation: "Fundraiser",
  paid: "Paid",
};

const SPACE_CATEGORY_BADGE = {
  "Café":             "bg-amber-100 text-amber-700",
  "Park":             "bg-green-100 text-green-700",
  "Gallery":          "bg-purple-100 text-purple-700",
  "Community Center": "bg-blue-100 text-blue-700",
  "Library":          "bg-indigo-100 text-indigo-700",
  "Brewery":          "bg-orange-100 text-orange-700",
  "Other":            "bg-gray-100 text-gray-600",
};

const CARD_AMENITY_LABELS = {
  wheelchair_accessible:   "Accessible",
  gender_neutral_restroom: "Gender-neutral restrooms",
  sensory_friendly:        "Sensory-friendly",
  dog_friendly:            "Dog-friendly",
  wifi:                    "WiFi",
};

function formatCardDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CATEGORY_TO_IMAGE = {
  social: `${import.meta.env.BASE_URL}images/rizky-subagja-1k7TnX5GAww-unsplash.jpg`,
  arts: `${import.meta.env.BASE_URL}images/xh_s-_yekOnsm1rE-unsplash.jpg`,
  outdoors: `${import.meta.env.BASE_URL}images/antenna-ZDN-G1xBWHY-unsplash.jpg`,
  food: `${import.meta.env.BASE_URL}images/nastuh-abootalebi-eHD8Y1Znfpk-unsplash.jpg`,
  sports: `${import.meta.env.BASE_URL}images/headway-F2KRf_QfCqw-unsplash.jpg`,
  educational: `${import.meta.env.BASE_URL}images/headway-F2KRf_QfCqw-unsplash.jpg`,
};

const BLANK_FORM = {
  title: "",
  space_name: "",
  selectedSpaceId: "",
  neighborhood: "",
  category: "social",
  description: "",
  noise_level: "",
  accessibility_info: "",
  space_format: "",
  crowd_level: 50,
  crowd_level_label: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  cost: "free",
  cost_amount: null,
  accessibility: [],
  tagsInput: "",
  attending_limit: null,
  show_attendance: true,
  hide_when_full: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function parseTo24h(str) {
  if (!str) return "";
  const match = str.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "";
  let h = parseInt(match[1]);
  const min = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function parseTimeStr(timeStr) {
  if (!timeStr || timeStr === "TBD") return { timeStart: "", timeEnd: "" };
  const parts = timeStr.split(/\s*[–-]\s*/);
  return {
    timeStart: parseTo24h(parts[0]?.trim() || ""),
    timeEnd: parseTo24h(parts[1]?.trim() || ""),
  };
}

function crowdLevelToLabel(level) {
  if (level == null) return "";
  if (level <= 40) return "Small group";
  if (level <= 65) return "Moderately busy";
  return "Large crowd";
}

function eventToForm(event) {
  const times = parseTimeStr(event.time);
  return {
    title: event.title || "",
    space_name: event.space_name || "",
    neighborhood: event.neighborhood || "",
    category: event.category || "social",
    description: event.description || "",
    noise_level: event.noise_level || "",
    accessibility_info: event.accessibility_info || "",
    space_format: event.space_format || "",
    crowd_level: event.crowd_level ?? 50,
    crowd_level_label: crowdLevelToLabel(event.crowd_level),
    date: event.date || "",
    timeStart: times.timeStart,
    timeEnd: times.timeEnd,
    cost: event.cost || "free",
    cost_amount: event.cost_amount ?? null,
    accessibility: event.accessibility ? [...event.accessibility] : [],
    tagsInput: event.tags ? event.tags.join(", ") : "",
    attending_limit: event.attending_limit ?? null,
    show_attendance: event.show_attendance !== false,
    hide_when_full: event.hide_when_full ?? false,
    selectedSpaceId: "",
  };
}

// ─── Preview Helpers ──────────────────────────────────────────────────────────

function formatPreviewDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getPreviewCrowdLabel(level) {
  if (level <= 20) return "Quiet";
  if (level <= 40) return "Light";
  if (level <= 60) return "Moderately busy";
  if (level <= 80) return "Busy";
  return "Very busy";
}

const PREVIEW_COST_LABEL = { free: "Free", suggested_donation: "Fundraiser", paid: "Paid" };
const PREVIEW_CATEGORY_LABELS = {
  social: "Social", arts: "Arts & Culture", outdoors: "Outdoors",
  food: "Food & Drink", sports: "Sports & Fitness", educational: "Educational",
};
const AMENITY_LABELS = {
  wheelchair_accessible: "♿ Wheelchair Accessible",
  gender_neutral_restroom: "🚻 Gender-Neutral Restroom",
  sensory_friendly: "🔇 Sensory Friendly",
  dog_friendly: "🐕 Dog Friendly",
  wifi: "📶 Wi-Fi",
};

function PreviewBanner({ onClose, onPublish, saving, publishLabel = "Publish", publishError }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <span className="text-sm font-semibold text-amber-700">Preview — not yet published</span>
      <div className="flex items-center gap-3">
        {publishError && (
          <span className="text-sm text-red-600 font-medium">{publishError}</span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Editing
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={saving}
          className="px-5 py-2 rounded-full bg-[#9FB366] hover:bg-[#8a9c57] text-white font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {saving ? "Publishing…" : publishLabel}
        </button>
      </div>
    </div>
  );
}

function EventPreviewModal({ form, imagePreviews, onClose, onPublish, saving, publishError }) {
  const timeStr =
    form.timeStart && form.timeEnd
      ? `${fmt12(form.timeStart)} – ${fmt12(form.timeEnd)}`
      : form.timeStart ? fmt12(form.timeStart) : "TBD";

  const costLabel =
    form.cost === "suggested_donation"
      ? "Fundraiser"
      : form.cost_amount
        ? `${PREVIEW_COST_LABEL[form.cost]} · $${form.cost_amount}`
        : PREVIEW_COST_LABEL[form.cost] ?? "Free";

  const tags = form.tagsInput
    ? form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const galleryImages = imagePreviews.length > 0
    ? imagePreviews.map((url) => ({ url, alt: form.title || "Event" }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "rgba(0,0,0,0.55)" }}>
      <PreviewBanner onClose={onClose} onPublish={onPublish} saving={saving} publishLabel="Publish" publishError={publishError} />
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="relative flex-1 min-w-0 pt-6">
              <div className="bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 pb-4">
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                    {form.title || <span className="text-gray-400 italic">No title yet</span>}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">{costLabel}</span>
                    <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">
                      {PREVIEW_CATEGORY_LABELS[form.category] ?? form.category}
                    </span>
                    {tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700 capitalize">
                        {tag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
                {galleryImages.length > 0 ? (
                  <EventGallery images={galleryImages} title={form.title || "Event"} />
                ) : (
                  <div className="mx-4 mb-4 rounded-xl bg-gray-200 h-48 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">No images added</p>
                  </div>
                )}
                <div className="px-6 pt-3 pb-0 flex flex-col gap-1.5">
                  {form.date && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar size={18} className="text-[#97BFFF] shrink-0" />
                      <span className="font-medium">{formatPreviewDate(form.date)}&nbsp;&nbsp;{timeStr}</span>
                    </div>
                  )}
                  {form.space_name && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin size={18} className="text-[#FD858A] shrink-0" />
                      <span className="font-medium">{form.space_name}{form.neighborhood ? `, ${form.neighborhood}` : ""}</span>
                    </div>
                  )}
                </div>
                <div className="px-6 pt-3 pb-5">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {form.description || <span className="text-gray-400 italic">No description added</span>}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 lg:sticky lg:top-24 pt-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-[#5F77A5] px-6 py-5 border-b border-[#4d6592]">
                  <h2 className="text-xl font-bold text-white">What to expect</h2>
                </div>
                <div className="px-6 py-5 flex flex-col gap-3 flex-1">
                  {form.noise_level && (
                    <p className="text-sm text-gray-700"><span className="font-semibold">Noise level: </span>{form.noise_level}</p>
                  )}
                  {form.accessibility?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1.5">Accessibility:</p>
                      <AccessibilityTags tags={form.accessibility} />
                    </div>
                  )}
                  {form.space_format && (
                    <p className="text-sm text-gray-700"><span className="font-semibold">Space format: </span>{form.space_format}</p>
                  )}
                  {form.crowd_level != null && (
                    <div className="mt-3">
                      <h3 className="font-bold text-gray-900 mb-3">Crowd Level (estimated):</h3>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${form.crowd_level}%` }} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mt-2">{getPreviewCrowdLabel(form.crowd_level)}</p>
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-2">
                  <button disabled className="flex items-center justify-center gap-1.5 flex-1 border border-gray-200 text-gray-400 font-semibold py-2.5 rounded-xl text-sm cursor-not-allowed">
                    <Bookmark size={15} /> Save
                  </button>
                  <button disabled className="flex items-center justify-center gap-1.5 flex-1 border border-gray-200 text-gray-400 font-semibold py-2.5 rounded-xl text-sm cursor-not-allowed">
                    Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpacePreviewModal({ form, imagePreviews, onClose, onPublish, saving, publishError }) {
  const galleryImages = imagePreviews.length > 0
    ? imagePreviews.map((url) => ({ url, alt: form.name || "Space" }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "rgba(0,0,0,0.55)" }}>
      <PreviewBanner onClose={onClose} onPublish={onPublish} saving={saving} publishLabel="Publish Space" publishError={publishError} />
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="relative flex-1 min-w-0 pt-6">
              <div className="bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 pb-4">
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                    {form.name || <span className="text-gray-400 italic">No name yet</span>}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {form.category && (
                      <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">{form.category}</span>
                    )}
                    {form.neighborhood && (
                      <span className="text-sm font-medium px-3 py-1 rounded-full border border-green-300 text-green-700">{form.neighborhood}</span>
                    )}
                  </div>
                </div>
                {galleryImages.length > 0 ? (
                  <EventGallery images={galleryImages} title={form.name || "Space"} />
                ) : (
                  <div className="mx-4 mb-4 rounded-xl bg-gray-200 h-48 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">No images added</p>
                  </div>
                )}
                {form.address && (
                  <div className="px-6 pt-5 flex items-center gap-3 text-gray-700">
                    <MapPin size={18} className="text-[#FD858A] shrink-0" />
                    <span className="font-medium">{form.address}</span>
                  </div>
                )}
                {form.hours && (
                  <div className="px-6 pt-2 flex items-center gap-3 text-gray-700">
                    <Clock size={18} className="text-[#97BFFF] shrink-0" />
                    <span className="font-medium">{form.hours}</span>
                  </div>
                )}
                <div className="px-6 py-5">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {form.description || <span className="text-gray-400 italic">No description added</span>}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 lg:sticky lg:top-24 pt-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#5F77A5] px-6 py-5 border-b border-[#4d6592]">
                  <h2 className="text-xl font-bold text-white">About this Space</h2>
                </div>
                <div className="px-6 py-5 flex flex-col gap-3">
                  {form.capacity && (
                    <p className="text-sm text-gray-700"><span className="font-semibold">Capacity: </span>{form.capacity} people</p>
                  )}
                  {form.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Globe size={14} className="shrink-0 text-gray-500" />
                      <span>{form.website}</span>
                    </div>
                  )}
                  {form.amenities?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.amenities.map((a) => (
                          <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {AMENITY_LABELS[a] ?? a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Event View ─────────────────────────────────────────────────

function CreateEventView({ editingEvent, initialTemplate, templates, createdSpaces = [], onCancel, onPublish, onSaveTemplate }) {
  const isEditing = Boolean(editingEvent);

  const [form, setForm] = useState(() => {
    if (isEditing) return eventToForm(editingEvent);
    if (initialTemplate?.prefill) return { ...BLANK_FORM, ...initialTemplate.prefill };
    return { ...BLANK_FORM };
  });
  const [imagePreviews, setImagePreviews] = useState(() => {
    if (isEditing) return editingEvent.image_url ? [editingEvent.image_url] : [];
    if (initialTemplate?.images?.length) return initialTemplate.images;
    if (initialTemplate?.image) return [initialTemplate.image];
    return [];
  });
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate?.id || null);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [publishError, setPublishError] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const imageInputRef = useRef(null);
  const dragIndex = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  // Maps blob URL → File so we can upload the right file even after reordering
  const imageFilesMap = useRef(new Map());

  const C = "bg-white border border-gray-200 shadow-sm";
  const inputCls =
    "w-full bg-transparent text-gray-900 placeholder:text-gray-400 border-b border-gray-200 pb-1.5 outline-none focus:border-gray-500 transition-colors text-sm";
  const darkSelectCls =
    "bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-gray-400";

  function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = files.map((f) => {
      const url = URL.createObjectURL(f);
      imageFilesMap.current.set(url, f);
      return url;
    });
    setImagePreviews((prev) => [...prev, ...urls]);
  }

  function handleImgDragStart(i) {
    dragIndex.current = i;
  }
  function handleImgDragOver(e, i) {
    e.preventDefault();
    setDragOverIdx(i);
  }
  function handleImgDrop(i) {
    const from = dragIndex.current;
    if (from === null || from === i) { setDragOverIdx(null); return; }
    setImagePreviews((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(i, 0, moved);
      return arr;
    });
    dragIndex.current = null;
    setDragOverIdx(null);
  }
  function handleImgDragEnd() {
    dragIndex.current = null;
    setDragOverIdx(null);
  }

  function applyCategory(cat) {
    if (selectedTemplate === cat.id) { setSelectedTemplate(null); return; }
    setSelectedTemplate(cat.id);
    setForm((f) => ({ ...f, ...cat.prefill }));
  }

  function applyUserTemplate(tpl) {
    setSelectedTemplate(tpl.id);
    if (tpl.prefill) setForm((f) => ({ ...f, ...tpl.prefill }));
    if (tpl.images?.length) setImagePreviews(tpl.images);
    else if (tpl.image) setImagePreviews([tpl.image]);
  }

  async function handleSaveTemplate() {
    if (templateSaving) return;
    const name = form.title.trim() || "Untitled Template";
    const tags = form.tagsInput ? form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const templateId = crypto.randomUUID();

    setTemplateSaving(true);
    setTemplateError(false);

    const resolveImage = async (url) => {
      if (!url.startsWith("blob:")) return url;
      const file = imageFilesMap.current.get(url);
      if (!file) return url;
      try {
        return await uploadEventImage(file, `template-${templateId}`);
      } catch {
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }
    };
    const images = await Promise.all(imagePreviews.map(resolveImage));

    const desc = form.description || "";
    const lastEdited = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    try {
      await onSaveTemplate({
        id: templateId,
        name,
        category: form.category,
        description: desc.slice(0, 90) + (desc.length > 90 ? "…" : ""),
        lastEdited,
        last_edited: lastEdited,
        image: images[0] || null,
        images,
        prefill: { ...form, tags },
      });
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 2000);
    } catch {
      setTemplateError(true);
      setTimeout(() => setTemplateError(false), 3000);
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handlePublish() {
    if (!form.title.trim()) { setPublishError("Please add an event title before publishing."); return false; }
    if (!form.date) { setPublishError("Please select a date for your event."); return false; }
    setPublishError("");
    setSaving(true);
    setSaveSuccess(false);

    const timeStr =
      form.timeStart && form.timeEnd
        ? `${fmt12(form.timeStart)} – ${fmt12(form.timeEnd)}`
        : form.timeStart ? fmt12(form.timeStart) : "TBD";

    const tags = form.tagsInput
      ? form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : ["community"];

    const base = isEditing ? editingEvent : {};
    const eventId = isEditing ? editingEvent.id : crypto.randomUUID();

    try {
      // Resolve blob URLs → permanent storage URLs (base64 fallback if storage unavailable)
      const resolvedPreviews = await Promise.all(
        imagePreviews.map(async (url) => {
          if (!url.startsWith("blob:")) return url;
          const file = imageFilesMap.current.get(url);
          if (!file) return url;
          try {
            return await uploadEventImage(file, eventId);
          } catch {
            // Storage not configured — encode as base64 so image still persists
            return await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            });
          }
        })
      );

      await onPublish({
        ...base,
        id: eventId,
        title: form.title.trim(),
        space_name: form.space_name || "TBD",
        neighborhood: form.neighborhood || "Seattle",
        category: form.category,
        description: form.description,
        date: form.date,
        time: timeStr,
        cost: form.cost,
        cost_amount: form.cost === "paid" ? form.cost_amount : null,
        accessibility: form.accessibility,
        tags,
        image_url: resolvedPreviews[0] || (isEditing ? editingEvent.image_url : `${import.meta.env.BASE_URL}images/headway-F2KRf_QfCqw-unsplash.jpg`),
        gallery_images: resolvedPreviews.length > 0
          ? resolvedPreviews.map((url) => ({ url, alt: form.title }))
          : (isEditing ? editingEvent.gallery_images : []),
        contact_email: base.contact_email || "",
        featured: base.featured ?? false,
        noise_level: form.noise_level || "Community-friendly",
        accessibility_info: form.accessibility_info || "Welcoming to all, no barriers",
        space_format: form.space_format || "Open format",
        crowd_level: form.crowd_level || 50,
        attending_limit: form.attending_limit || null,
        show_attendance: form.show_attendance,
        hide_when_full: form.attending_limit ? form.hide_when_full : false,
        attending_count: isEditing ? (editingEvent.attending_count || 0) : 0,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return true;
    } catch (err) {
      setPublishError(err.message ?? "Failed to save — please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col bg-stone-100" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Templates panel — animates open/closed via width transition ── */}
        <div
          className="bg-white border-r border-gray-200 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: templatesOpen ? 460 : 0, transition: "width 300ms ease-in-out" }}
        >
          {/* Inner wrapper stays 460px so content never reflows during animation */}
          <div className="w-[460px] flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>🗒️</span> Templates
              </h2>
              <button
                onClick={() => setTemplatesOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close templates"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide px-0.5">
                Free Templates
              </p>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <div key={cat.id} onClick={() => applyCategory(cat)} className="cursor-pointer group">
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-3">
                      <h3 className="text-white font-bold text-sm leading-snug drop-shadow">{cat.name}</h3>
                    </div>
                    {selectedTemplate === cat.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                        <Check size={13} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 px-0.5">{cat.description}</p>
                </div>
              ))}

              {(() => {
                const initialIds = new Set(INITIAL_TEMPLATES.map((t) => t.id));
                const ownedTemplates = templates.filter((t) => !initialIds.has(t.id));
                if (ownedTemplates.length === 0) return null;
                return (
                <div className="border-t border-gray-100 pt-4 mt-1">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 px-0.5">
                    Your Templates
                  </p>
                  {ownedTemplates.map((tpl) => (
                    <div key={tpl.id} onClick={() => applyUserTemplate(tpl)} className="cursor-pointer group mb-4">
                      <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                        <img
                          src={tpl.image || CATEGORY_TO_IMAGE[tpl.category] || `${import.meta.env.BASE_URL}images/headway-F2KRf_QfCqw-unsplash.jpg`}
                          alt={tpl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-3">
                          <h3 className="text-white font-bold text-sm leading-snug drop-shadow">{tpl.name}</h3>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                          <span className="text-white text-xs font-semibold">Your Template</span>
                        </div>
                        {selectedTemplate === tpl.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                            <Check size={13} className="text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 px-0.5">{tpl.description}</p>
                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
          </div>{/* end inner 460px wrapper */}
        </div>{/* end animated panel */}

        {/* ── Right: Form panel ── */}
        <div className="flex-1 overflow-y-auto bg-stone-100 px-6 py-6">
          {/* Persistent toggle — always visible */}
          <div className="max-w-4xl mx-auto mb-4">
            <button
              onClick={() => setTemplatesOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FileText size={14} />
              {templatesOpen ? "Hide Templates" : "Show Templates"}
            </button>
          </div>

          <div className="max-w-4xl mx-auto flex flex-col gap-4">

            {/* Edit mode banner */}
            {isEditing && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <Edit2 size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Editing: <span className="font-semibold">{editingEvent.title}</span>
                </p>
              </div>
            )}

            {/* 1. Image upload */}
            <div className={`${C} rounded-2xl overflow-hidden`}>
              {imagePreviews.length > 0 ? (
                <div className="flex flex-col">
                  {imagePreviews.length > 1 && (
                    <p className="text-xs text-gray-400 text-center py-2 border-b border-gray-100">
                      Drag images to reorder · First image is the cover
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {imagePreviews.map((url, i) => (
                      <div
                        key={url + i}
                        draggable
                        onDragStart={() => handleImgDragStart(i)}
                        onDragOver={(e) => handleImgDragOver(e, i)}
                        onDrop={() => handleImgDrop(i)}
                        onDragEnd={handleImgDragEnd}
                        className={`relative group cursor-grab active:cursor-grabbing rounded overflow-hidden transition-all ${
                          dragOverIdx === i && dragIndex.current !== i
                            ? "ring-2 ring-[#9FB366] opacity-60"
                            : ""
                        }`}
                      >
                        <img src={url} alt={`Event image ${i + 1}`} className="w-full h-28 object-cover pointer-events-none" />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-[10px] font-semibold leading-none">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImagePreviews((prev) => prev.filter((_, idx) => idx !== i)); }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    <Upload size={15} /> Add More Images
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-10 px-6 text-center cursor-pointer hover:bg-gray-50 transition-colors min-h-[170px]"
                >
                  <Upload size={36} className="text-gray-400 mb-3" />
                  <h3 className="text-gray-900 font-semibold text-lg">Add Event Images</h3>
                  <p className="text-gray-500 text-sm mt-1">Select one or more images from your computer.</p>
                </div>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </div>

            {/* 2. Event Title */}
            <div className={`${C} rounded-2xl p-6`}>
              <h3 className="text-gray-900 font-semibold text-lg mb-3">Event Title</h3>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Add a short title for your event"
                className={inputCls + " text-base"}
              />
            </div>

            {/* 3. Location + Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`${C} rounded-2xl p-6`}>
                <h3 className="text-gray-900 font-semibold text-lg mb-3 flex items-center gap-2">
                  <MapPin size={18} /> Location
                </h3>
                {createdSpaces.length > 0 && (
                  <div className="mb-3">
                    <p className="text-gray-500 text-xs mb-1.5">Select a space you manage</p>
                    <select
                      value={form.selectedSpaceId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__other__" || val === "") {
                          setForm((f) => ({ ...f, selectedSpaceId: val }));
                        } else {
                          const s = createdSpaces.find((x) => x.id === val);
                          if (s) {
                            setForm((f) => ({
                              ...f,
                              selectedSpaceId: val,
                              space_name: s.name,
                              neighborhood: s.neighborhood || f.neighborhood,
                            }));
                          }
                        }
                      }}
                      className={darkSelectCls + " w-full"}
                    >
                      <option value="">Select a location…</option>
                      {createdSpaces.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="__other__">Other (enter manually)</option>
                    </select>
                  </div>
                )}
                {(createdSpaces.length === 0 || form.selectedSpaceId === "__other__" || form.selectedSpaceId === "") && (
                  <input
                    type="text"
                    value={form.space_name}
                    onChange={(e) => setForm((f) => ({ ...f, space_name: e.target.value }))}
                    placeholder="Enter the venue name and address."
                    className={inputCls + " mb-3"}
                  />
                )}
                <select
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                  className={darkSelectCls + " w-full"}
                >
                  <option value="">Select neighborhood</option>
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n.id} value={n.name}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div className={`${C} rounded-2xl p-6`}>
                <h3 className="text-gray-900 font-semibold text-lg mb-2 flex items-center gap-2">
                  📅 Date &amp; Time
                </h3>
                <p className="text-gray-500 text-xs mb-2">Select the date and time of your event.</p>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className={darkSelectCls + " w-full mb-2"}
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    step="300"
                    value={form.timeStart}
                    onChange={(e) => setForm((f) => ({ ...f, timeStart: e.target.value }))}
                    className={darkSelectCls + " flex-1"}
                  />
                  <input
                    type="time"
                    step="300"
                    value={form.timeEnd}
                    onChange={(e) => setForm((f) => ({ ...f, timeEnd: e.target.value }))}
                    className={darkSelectCls + " flex-1"}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-2">Example: Friday, April 3 · 10:00 AM – 12:00 PM</p>
              </div>
            </div>

            {/* 4. Event Overview + What to Expect + Event Details (combined) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">

              {/* Overview */}
              <div>
                <h3 className="text-gray-900 font-semibold text-lg mb-1">Event Overview</h3>
                <p className="text-gray-500 text-sm mb-3">
                  Briefly describe your event. What is it? Who is it for? Why should someone come?
                </p>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Write your event description here…"
                  rows={7}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-none outline-none focus:ring-2 focus:ring-green-500 leading-relaxed"
                />
                <p className="text-gray-400 text-xs mt-1.5">Recommended: 2–4 short sentences</p>
              </div>

              <div className="border-t border-gray-100" />

              {/* What to Expect */}
              <div>
                <h3 className="text-gray-900 font-semibold text-lg mb-1">What to Expect</h3>
                <p className="text-gray-500 text-sm mb-4">Help attendees understand the vibe and format.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Noise Level</label>
                    <input
                      type="text"
                      value={form.noise_level}
                      onChange={(e) => setForm((f) => ({ ...f, noise_level: e.target.value }))}
                      placeholder="Quiet, moderate, lively, loud…"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Space Format</label>
                    <input
                      type="text"
                      value={form.space_format}
                      onChange={(e) => setForm((f) => ({ ...f, space_format: e.target.value }))}
                      placeholder="Workshop, open mingling, panel…"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Accessibility Info</label>
                    <input
                      type="text"
                      value={form.accessibility_info}
                      onChange={(e) => setForm((f) => ({ ...f, accessibility_info: e.target.value }))}
                      placeholder="e.g. Fully accessible, outdoor terrain…"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Attendance Level <span className="font-normal text-gray-400">(optional)</span></label>
                    <select
                      value={form.crowd_level_label}
                      onChange={(e) => {
                        const label = e.target.value;
                        const level = label === "Small group" ? 25 : label === "Large crowd" ? 80 : 55;
                        setForm((f) => ({ ...f, crowd_level_label: label, crowd_level: level }));
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select…</option>
                      <option value="Small group">Small group</option>
                      <option value="Moderately busy">Moderately busy</option>
                      <option value="Large crowd">Large crowd</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Event Details */}
              <div>
                <h3 className="text-gray-900 font-semibold text-lg mb-4">Event Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="social">Social</option>
                      <option value="arts">Arts</option>
                      <option value="outdoors">Outdoors</option>
                      <option value="food">Food</option>
                      <option value="sports">Sports</option>
                      <option value="educational">Educational</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Cost</label>
                    <select
                      value={form.cost}
                      onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  {form.cost === "paid" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cost_amount ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, cost_amount: parseFloat(e.target.value) || null }))}
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Tags</label>
                    <input
                      type="text"
                      value={form.tagsInput}
                      onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
                      placeholder="drop_in, outdoor, community"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-400">Comma-separated</p>
                  </div>
                </div>
              </div>

            </div>

            {/* 8. Accessibility */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-4">Accessibility</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "wheelchair_accessible", label: "♿ Wheelchair Accessible" },
                  { id: "gender_neutral_restroom", label: "🚻 Gender-Neutral Restroom" },
                  { id: "sensory_friendly", label: "🔇 Sensory Friendly" },
                  { id: "dog_friendly", label: "🐕 Dog Friendly" },
                ].map((opt) => {
                  const on = form.accessibility.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          accessibility: on
                            ? f.accessibility.filter((a) => a !== opt.id)
                            : [...f.accessibility, opt.id],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        on
                          ? "bg-green-700 text-white border-green-700"
                          : "text-gray-600 border-gray-200 hover:border-green-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 9. Attending Limit */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">Attendance Settings</h3>
              <p className="text-sm text-gray-500 mb-4">
                Set a maximum number of attendees and control what attendees see.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Max Attendees</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.attending_limit ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        attending_limit: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    placeholder="e.g. 20"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-400">
                    Leave blank for unlimited attendance.
                  </p>
                </div>

                {/* Show attendance metrics toggle */}
                <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Show attendance metrics</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {form.show_attendance
                        ? "Attendees will see the capacity bar and spots remaining."
                        : "Attendees only see the confirmation button — no counts shown."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, show_attendance: !f.show_attendance }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                      form.show_attendance ? "bg-[#9FB366]" : "bg-gray-300"
                    }`}
                    role="switch"
                    aria-checked={form.show_attendance}
                    aria-label="Show attendance metrics"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form.show_attendance ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* When full behaviour toggle — only relevant when a limit is set */}
                {form.attending_limit && (
                  <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">When attendance limit is reached</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {form.hide_when_full
                          ? "Event will be hidden from the feed once full."
                          : "Event stays posted — attendance button is locked for new attendees."}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, hide_when_full: !f.hide_when_full }))}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                          form.hide_when_full ? "bg-[#5F77A5]" : "bg-gray-300"
                        }`}
                        role="switch"
                        aria-checked={form.hide_when_full}
                        aria-label="Hide event when full"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            form.hide_when_full ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-[11px] text-gray-400">
                        {form.hide_when_full ? "Hide when full" : "Keep posted"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {publishError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {publishError}
              </div>
            )}

            <div className="h-4" />
          </div>
        </div>
        {/* Balancing spacer — mirrors template panel width so mx-auto always centers on the same point */}
        {templatesOpen && <div className="w-[460px] flex-shrink-0 pointer-events-none" />}
      </div>

      {/* ── Bottom action bar ── */}
      <div className="bg-stone-100 border-t border-stone-300 px-8 py-4 flex justify-center gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-2.5 rounded-full bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={templateSaving}
          className={`px-8 py-2.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-60 ${
            templateSaved
              ? "bg-green-100 text-green-700"
              : templateError
              ? "bg-red-100 text-red-700"
              : "bg-stone-500 hover:bg-stone-600 text-white"
          }`}
        >
          {templateSaving ? "Saving…" : templateSaved ? "Template Saved!" : templateError ? "Save Failed" : "Save Template"}
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="px-8 py-2.5 rounded-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <Eye size={14} /> Preview
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={saving}
          className={`px-8 py-2.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-60 ${
            saveSuccess
              ? "bg-green-600 text-white"
              : "bg-[#9FB366] hover:bg-[#8a9c57] text-white"
          }`}
        >
          {saving ? "Saving…" : saveSuccess ? "✓ Saved!" : isEditing ? "Save Changes" : "Publish"}
        </button>
      </div>

      {showPreview && (
        <EventPreviewModal
          form={form}
          imagePreviews={imagePreviews}
          onClose={() => setShowPreview(false)}
          onPublish={async () => {
            const ok = await handlePublish();
            if (ok) setShowPreview(false);
          }}
          saving={saving}
          publishError={publishError}
        />
      )}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection({ user, setUser }) {
  const [form, setForm] = useState({
    displayName: user?.name || "",
    email: user?.email || "",
    currentPw: "",
    newPw: "",
    companyName: "Seattle Ceramic Studio",
    website: "seattleceramicstudio.example.com",
    about: "Seattle Ceramic Studio offers hands-on ceramics classes and open studio time for all skill levels in the heart of Seattle.",
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

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
            {user?.name?.slice(0, 2).toUpperCase() || "DH"}
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
              <input type="text" value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        </div>
        <button type="button"
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
              <input type={showCurrentPw ? "text" : "password"} value={form.currentPw}
                onChange={(e) => setForm((f) => ({ ...f, currentPw: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="button" onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">New Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showNewPw ? "text" : "password"} value={form.newPw}
                onChange={(e) => setForm((f) => ({ ...f, newPw: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="button" onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
        <button type="button"
          onClick={() => { setPwSaved(true); setTimeout(() => setPwSaved(false), 2000); }}
          className={saveBtnCls(pwSaved)}
        >
          {pwSaved ? "Updated!" : "Update Password"}
        </button>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Company Information */}
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Company Information</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Company Name</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Website</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">About</label>
            <textarea value={form.about}
              onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <button type="button"
            onClick={() => { setCompanySaved(true); setTimeout(() => setCompanySaved(false), 2000); }}
            className={saveBtnCls(companySaved) + " self-start"}
          >
            {companySaved ? "Saved!" : "Save Company Info"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Template Modal ──────────────────────────────────────────────────────

const ACCESSIBILITY_OPTS = [
  { id: "wheelchair_accessible",  label: "♿ Wheelchair Accessible" },
  { id: "gender_neutral_restroom", label: "🚻 Gender-Neutral Restroom" },
  { id: "sensory_friendly",       label: "🔇 Sensory Friendly" },
  { id: "dog_friendly",           label: "🐕 Dog Friendly" },
];

function EditTemplateModal({ template, saveError, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(template.name);
  const [category, setCategory] = useState(template.category);
  const [description, setDescription] = useState(template.description);
  const [prefill, setPrefill] = useState({
    noise_level:      "",
    space_format:     "",
    accessibility_info: "",
    crowd_level_label: "",
    crowd_level:       50,
    cost:              "free",
    cost_amount:       null,
    accessibility:     [],
    tagsInput:         "",
    ...template.prefill,
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function setPf(key, value) {
    setPrefill((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const lastEdited = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    await onSave({ name: name.trim(), category, description, prefill, last_edited: lastEdited, lastEdited });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Template</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Category + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="social">Social</option>
                <option value="arts">Arts</option>
                <option value="outdoors">Outdoors</option>
                <option value="food">Food</option>
                <option value="sports">Sports</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Cost Default</label>
              <select
                value={prefill.cost}
                onChange={(e) => setPf("cost", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {prefill.cost === "paid" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Default Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={prefill.cost_amount ?? ""}
                onChange={(e) => setPf("cost_amount", parseFloat(e.target.value) || null)}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="border-t border-gray-100 pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Default Event Settings</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Noise Level</label>
                <input
                  type="text"
                  value={prefill.noise_level}
                  onChange={(e) => setPf("noise_level", e.target.value)}
                  placeholder="Quiet, moderate, lively…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Space Format</label>
                <input
                  type="text"
                  value={prefill.space_format}
                  onChange={(e) => setPf("space_format", e.target.value)}
                  placeholder="Workshop, open mingling…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Accessibility Info</label>
                <input
                  type="text"
                  value={prefill.accessibility_info}
                  onChange={(e) => setPf("accessibility_info", e.target.value)}
                  placeholder="e.g. Fully accessible…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Attendance Level</label>
                <select
                  value={prefill.crowd_level_label}
                  onChange={(e) => {
                    const label = e.target.value;
                    const level = label === "Small group" ? 25 : label === "Large crowd" ? 80 : 55;
                    setPrefill((p) => ({ ...p, crowd_level_label: label, crowd_level: level }));
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select…</option>
                  <option value="Small group">Small group</option>
                  <option value="Moderately busy">Moderately busy</option>
                  <option value="Large crowd">Large crowd</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Default Tags</label>
            <input
              type="text"
              value={prefill.tagsInput}
              onChange={(e) => setPf("tagsInput", e.target.value)}
              placeholder="drop_in, outdoor, community"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400">Comma-separated</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Default Accessibility Tags</label>
            <div className="flex flex-wrap gap-2">
              {ACCESSIBILITY_OPTS.map((opt) => {
                const on = (prefill.accessibility || []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setPf(
                        "accessibility",
                        on
                          ? (prefill.accessibility || []).filter((a) => a !== opt.id)
                          : [...(prefill.accessibility || []), opt.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      on
                        ? "bg-green-700 text-white border-green-700"
                        : "text-gray-600 border-gray-200 hover:border-green-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-red-600 font-medium">{saveError}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-medium">Delete this template?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Keep template
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <Trash2 size={14} /> Delete template
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-4 py-2 rounded-xl bg-[#9FB366] hover:bg-[#8a9c57] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Templates Section ────────────────────────────────────────────────────────

function TemplatesSection({ templates, onCreateTemplate, onUseTemplate, onEditTemplate }) {
  const initialIds = new Set(INITIAL_TEMPLATES.map((t) => t.id));

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Event Templates"
        subtitle="Save time by reusing preset event configurations"
        action={<CreateButton onClick={onCreateTemplate} label="New Template" />}
      />

      <div className="flex flex-col gap-3">
        {templates.map((tpl) => {
          const isOwned = !initialIds.has(tpl.id);
          return (
            <div
              key={tpl.id}
              className="bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-[#9FB366]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-base leading-tight">{tpl.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[tpl.category] || "bg-gray-100 text-gray-600"}`}>
                    {tpl.category}
                  </span>
                  {!isOwned && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Preset</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{tpl.description}</p>
                <p className="text-xs text-gray-400 mt-1.5">Last edited {tpl.last_edited || tpl.lastEdited}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 self-start">
                {isOwned && (
                  <button
                    onClick={() => onEditTemplate(tpl)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600 text-sm font-medium transition-colors"
                  >
                    Edit
                    <Edit2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => onUseTemplate(tpl)}
                  className="px-4 py-2 rounded-lg bg-[#9FB366] hover:bg-[#8a9c57] text-white text-sm font-semibold transition-colors"
                >
                  Use
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <EmptyHostState
        icon={Plus}
        title="Create a new template"
        body="Templates pre-fill event details so you can post new listings in seconds."
        ctaLabel="Create Template"
        onCta={onCreateTemplate}
      />
    </div>
  );
}

// ─── Shared Host UI Primitives ────────────────────────────────────────────────

function HostActionButtons({ viewHref, onEdit, editLoading, onToggleHide, hidden, onDelete }) {
  const baseCls =
    "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors";
  return (
    <div className="flex gap-1.5 shrink-0">
      <button
        type="button"
        onClick={onEdit}
        disabled={editLoading}
        className={`${baseCls} ${editLoading ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400" : "border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600"}`}
      >
        {editLoading ? "Loading…" : "Edit"}
        <Edit2 size={14} />
      </button>
      <Link
        to={viewHref}
        className={`${baseCls} border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600`}
      >
        View
        <Eye size={14} />
      </Link>
      <button
        type="button"
        onClick={onToggleHide}
        className={`${baseCls} ${
          hidden
            ? "border-[#9FB366] text-[#9FB366] bg-green-50"
            : "border-gray-400 hover:border-[#9FB366] hover:text-[#9FB366] text-gray-600"
        }`}
      >
        {hidden ? "Hidden" : "Hide"}
        {hidden ? <EyeOff size={14} /> : <EyeOff size={14} />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={`${baseCls} border-red-300 text-red-500 hover:bg-red-50`}
      >
        Delete
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function DeleteConfirmModal({ title, body, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg text-center mb-1">{title}</h3>
        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">{body}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function CreateButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-[#9FB366] hover:bg-[#8a9c57] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
    >
      <Plus size={14} />
      {label}
    </button>
  );
}

function HostSearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#9FB366] focus:ring-2 focus:ring-[#9FB366]/20 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function EmptyHostState({ icon: Icon, title, body, ctaLabel, onCta }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 flex flex-col items-center text-center gap-2">
      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
        <Icon size={20} className="text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700 mt-1">{title}</p>
      <p className="text-xs text-gray-400 max-w-xs">{body}</p>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="mt-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

// ─── Events Section ───────────────────────────────────────────────────────────

function HostEventCard({ event, onEdit, editLoading, onToggleHide, onDelete }) {
  const costCls = COST_BADGE[event.cost] || "bg-gray-100 text-gray-600";
  const costLbl = COST_LABEL[event.cost] || "Free";
  const dateStr = formatCardDate(event.date);

  return (
    <div className="relative">
      <div
        className={`bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-[220px] ${
          event.hidden ? "opacity-70" : ""
        }`}
      >
        <div className="flex h-full">
          {/* Image */}
          <div className="w-52 shrink-0 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col min-w-0 overflow-hidden gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1 min-w-0 flex-1">
                {event.title}
              </h3>
              {event.hidden ? (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
                  Hidden
                </span>
              ) : (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  Published
                </span>
              )}
            </div>

            {/* Meta — same icon colours as the public FeedCard */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {event.date && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-[#97BFFF] shrink-0" />
                  {dateStr}
                </span>
              )}
              {event.time && (
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-[#FFA86C] shrink-0" />
                  {event.time}
                </span>
              )}
              {event.space_name && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-[#FD858A] shrink-0" />
                  <span className="truncate">{event.space_name}, Seattle</span>
                </span>
              )}
              {event.attending_count != null && (
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-[#9FB366] shrink-0" />
                  {event.attending_count} attending
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {event.description}
              </p>
            )}

            {/* Tags + host actions — same position as FeedCard's tags + actions */}
            <div className="flex items-center justify-between mt-auto gap-2">
              <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
                <span className={`text-sm px-3 py-1 rounded-full font-semibold ${costCls}`}>
                  {costLbl}
                </span>
                {event.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-sm px-3 py-1 rounded-full border border-green-300 text-green-700 capitalize whitespace-nowrap"
                  >
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              <HostActionButtons
                viewHref={`/events/${event.id}`}
                onEdit={onEdit}
                editLoading={editLoading}
                onToggleHide={onToggleHide}
                hidden={event.hidden}
                onDelete={onDelete}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Thumbtack — same position as FeedCard */}
      <img
        src={thumbtackImg}
        alt=""
        aria-hidden="true"
        className="absolute -top-6 -right-3 w-[80px] pointer-events-none select-none z-10 rotate-12"
      />
    </div>
  );
}

function EventsSection({ hostEvents, onCreateEvent, onEditEvent, onDeleteEvent, onToggleHide, isAdmin }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState(new Set());
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [query, setQuery] = useState("");

  const visibleEvents = pendingDeleteIds.size > 0
    ? hostEvents.filter((e) => !pendingDeleteIds.has(e.id))
    : hostEvents;

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleEvents;
    return visibleEvents.filter((e) => {
      const hay = [
        e.title, e.space_name, e.neighborhood, e.category, e.description,
        ...(e.tags || []),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleEvents, query]);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={isAdmin ? "All Events" : "Your Events"}
        subtitle={`${visibleEvents.length} event${visibleEvents.length !== 1 ? "s" : ""} ${isAdmin ? "on the site" : "posted"}`}
        action={<CreateButton onClick={onCreateEvent} label="Create Event" />}
      />

      {visibleEvents.length > 0 && (
        <HostSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search your events by title, space, neighborhood, or tag…"
        />
      )}

      {visibleEvents.length === 0 ? (
        <EmptyHostState
          icon={Calendar}
          title="No events yet"
          body="Post your first event to start showing up in the public catalog."
          ctaLabel="Create Event"
          onCta={onCreateEvent}
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyHostState
          icon={Search}
          title="No matches"
          body={`Nothing matches "${query}". Try a different keyword or clear the search.`}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {filteredEvents.map((event) => (
            <HostEventCard
              key={event.id}
              event={event}
              onEdit={async () => {
                setLoadingEditId(event.id);
                await onEditEvent(event);
                setLoadingEditId(null);
              }}
              editLoading={loadingEditId === event.id}
              onToggleHide={() => onToggleHide(event)}
              onDelete={() => setDeleteConfirm(event)}
            />
          ))}
        </div>
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          title="Delete Event?"
          body={
            <>
              <span className="font-semibold text-gray-700">"{deleteConfirm.title}"</span> will be
              permanently removed from your catalog. This cannot be undone.
            </>
          }
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            setPendingDeleteIds((prev) => new Set([...prev, deleteConfirm.id]));
            onDeleteEvent(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Create Space View ────────────────────────────────────────────────────────

const SPACE_CATEGORIES = ["Café", "Park", "Gallery", "Community Center", "Library", "Brewery", "Other"];

const BLANK_SPACE_FORM = {
  name: "",
  address: "",
  neighborhood: "",
  category: "Café",
  description: "",
  hours: "",
  capacity: "",
  website: "",
  amenities: [],
};

function CreateSpaceView({ editingSpace, onCancel, onPublish }) {
  const isEditing = Boolean(editingSpace);
  const [form, setForm] = useState(() =>
    isEditing
      ? {
          name: editingSpace.name || "",
          address: editingSpace.address || "",
          neighborhood: editingSpace.neighborhood || "",
          category: editingSpace.category || "Café",
          description: editingSpace.description || "",
          hours: editingSpace.hours || "",
          capacity: editingSpace.capacity ? String(editingSpace.capacity) : "",
          website: editingSpace.website || "",
          amenities: editingSpace.amenities ? [...editingSpace.amenities] : [],
        }
      : { ...BLANK_SPACE_FORM }
  );
  const [imagePreviews, setImagePreviews] = useState(() => {
    if (isEditing) {
      if (editingSpace.gallery_images?.length) return editingSpace.gallery_images.map((g) => g.url);
      if (editingSpace.image_url) return [editingSpace.image_url];
    }
    return [];
  });
  const [publishError, setPublishError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const imageInputRef = useRef(null);
  const dragIndex = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const imageFilesMap = useRef(new Map());

  function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = files.map((f) => {
      const url = URL.createObjectURL(f);
      imageFilesMap.current.set(url, f);
      return url;
    });
    setImagePreviews((prev) => [...prev, ...urls]);
  }

  function handleImgDragStart(i) {
    dragIndex.current = i;
  }
  function handleImgDragOver(e, i) {
    e.preventDefault();
    setDragOverIdx(i);
  }
  function handleImgDrop(i) {
    const from = dragIndex.current;
    if (from === null || from === i) { setDragOverIdx(null); return; }
    setImagePreviews((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(i, 0, moved);
      return arr;
    });
    dragIndex.current = null;
    setDragOverIdx(null);
  }
  function handleImgDragEnd() {
    dragIndex.current = null;
    setDragOverIdx(null);
  }

  async function handlePublish() {
    if (!form.name.trim()) { setPublishError("Please add a space name before publishing."); return false; }
    setPublishError("");
    setSaving(true);
    const base = isEditing ? editingSpace : {};
    const spaceId = isEditing ? editingSpace.id : crypto.randomUUID();

    try {
      const resolvedPreviews = await Promise.all(
        imagePreviews.map(async (url) => {
          if (!url.startsWith("blob:")) return url;
          const file = imageFilesMap.current.get(url);
          if (!file) return url;
          try {
            return await uploadSpaceImage(file, spaceId);
          } catch {
            return await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            });
          }
        })
      );

      await onPublish({
        ...base,
        id: spaceId,
        name: form.name.trim(),
        address: form.address,
        neighborhood: form.neighborhood,
        category: form.category,
        description: form.description,
        hours: form.hours,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        website: form.website,
        amenities: form.amenities,
        image_url: resolvedPreviews[0] || (isEditing ? editingSpace.image_url : `${import.meta.env.BASE_URL}images/headway-F2KRf_QfCqw-unsplash.jpg`),
        gallery_images: resolvedPreviews.length > 0
          ? resolvedPreviews.map((url) => ({ url, alt: form.name }))
          : (isEditing ? editingSpace.gallery_images : []),
        noise_level: base.noise_level || "",
        space_format: base.space_format || "",
      });
      return true;
    } catch (err) {
      setPublishError(err.message ?? "Failed to save — please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  const C = "bg-white border border-gray-200 shadow-sm";
  const inputCls =
    "w-full bg-transparent text-gray-900 placeholder:text-gray-400 border-b border-gray-200 pb-1.5 outline-none focus:border-gray-500 transition-colors text-sm";
  const darkSelectCls =
    "bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-gray-400";

  return (
    <div className="flex flex-col bg-stone-100" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">

          {/* Edit mode banner */}
          {isEditing && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <Edit2 size={14} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Editing: <span className="font-semibold">{editingSpace.name}</span>
              </p>
            </div>
          )}

          {/* Image upload */}
          <div className={`${C} rounded-2xl overflow-hidden`}>
            {imagePreviews.length > 0 ? (
              <div className="flex flex-col">
                {imagePreviews.length > 1 && (
                  <p className="text-xs text-gray-400 text-center py-2 border-b border-gray-100">
                    Drag images to reorder · First image is the cover
                  </p>
                )}
                <div className="grid grid-cols-3 gap-1 p-1">
                  {imagePreviews.map((url, i) => (
                    <div
                      key={url + i}
                      draggable
                      onDragStart={() => handleImgDragStart(i)}
                      onDragOver={(e) => handleImgDragOver(e, i)}
                      onDrop={() => handleImgDrop(i)}
                      onDragEnd={handleImgDragEnd}
                      className={`relative group cursor-grab active:cursor-grabbing rounded overflow-hidden transition-all ${
                        dragOverIdx === i && dragIndex.current !== i
                          ? "ring-2 ring-[#9FB366] opacity-60"
                          : ""
                      }`}
                    >
                      <img src={url} alt={`Space image ${i + 1}`} className="w-full h-28 object-cover pointer-events-none" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-[10px] font-semibold leading-none">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImagePreviews((prev) => prev.filter((_, idx) => idx !== i)); }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors border-t border-gray-100"
                >
                  <Upload size={15} /> Add More Images
                </button>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-10 px-6 text-center cursor-pointer hover:bg-gray-50 transition-colors min-h-[170px]"
              >
                <Upload size={36} className="text-gray-400 mb-3" />
                <h3 className="text-gray-900 font-semibold text-lg">Add Space Images</h3>
                <p className="text-gray-500 text-sm mt-1">Upload photos of your venue.</p>
              </div>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Space Name */}
          <div className={`${C} rounded-2xl p-6`}>
            <h3 className="text-gray-900 font-bold text-2xl mb-3">Space Name</h3>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Elm Coffee Roasters"
              className={inputCls + " text-base"}
            />
          </div>

          {/* Address + Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`${C} rounded-2xl p-6`}>
              <h3 className="text-gray-900 font-bold text-xl mb-3 flex items-center gap-2">
                <MapPin size={18} /> Address
              </h3>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address"
                className={inputCls + " mb-3"}
              />
              <select
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                className={darkSelectCls + " w-full"}
              >
                <option value="">Select neighborhood</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n.id} value={n.name}>{n.name}</option>
                ))}
              </select>
            </div>

            <div className={`${C} rounded-2xl p-6`}>
              <h3 className="text-gray-900 font-bold text-xl mb-3">Details</h3>
              <p className="text-gray-500 text-xs mb-2">Category</p>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={darkSelectCls + " w-full mb-3"}
              >
                {SPACE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-gray-500 text-xs mb-2">Capacity</p>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                placeholder="e.g. 50"
                className={darkSelectCls + " w-full"}
              />
            </div>
          </div>

          {/* Description */}
          <div className={`${C} rounded-2xl p-6`}>
            <h3 className="text-gray-900 font-bold text-xl mb-1">✏️ Description</h3>
            <p className="text-gray-500 text-sm mb-3">
              Describe your space for hosts and attendees.
            </p>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Write a brief description of this space…"
              rows={7}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-none outline-none focus:ring-2 focus:ring-green-500 leading-relaxed"
            />
          </div>

          {/* Hours + Website */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">More Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Hours</label>
                <input
                  type="text"
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                  placeholder="Mon–Fri 8 AM – 5 PM"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "wheelchair_accessible", label: "♿ Wheelchair Accessible" },
                { id: "gender_neutral_restroom", label: "🚻 Gender-Neutral Restroom" },
                { id: "sensory_friendly", label: "🔇 Sensory Friendly" },
                { id: "dog_friendly", label: "🐕 Dog Friendly" },
                { id: "wifi", label: "📶 Wi-Fi" },
              ].map((opt) => {
                const on = form.amenities.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        amenities: on
                          ? f.amenities.filter((a) => a !== opt.id)
                          : [...f.amenities, opt.id],
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      on
                        ? "bg-green-700 text-white border-green-700"
                        : "text-gray-600 border-gray-200 hover:border-green-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {publishError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {publishError}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="bg-stone-100 border-t border-stone-300 px-8 py-4 flex justify-center gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-2.5 rounded-full bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="px-8 py-2.5 rounded-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <Eye size={14} /> Preview
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={saving}
          className="px-8 py-2.5 rounded-full bg-[#9FB366] hover:bg-[#8a9c57] text-white font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Publish Space"}
        </button>
      </div>

      {showPreview && (
        <SpacePreviewModal
          form={form}
          imagePreviews={imagePreviews}
          onClose={() => setShowPreview(false)}
          onPublish={async () => {
            const ok = await handlePublish();
            if (ok) setShowPreview(false);
          }}
          saving={saving}
          publishError={publishError}
        />
      )}
    </div>
  );
}

// ─── Spaces Section ───────────────────────────────────────────────────────────

function SpaceCard({ space, onEdit, onDelete, onToggleHide }) {
  const badgeCls = SPACE_CATEGORY_BADGE[space.category] || "bg-gray-100 text-gray-600";

  return (
    <div className="relative">
      <div
        className={`bg-[#F5F0E8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-[220px] ${
          space.hidden ? "opacity-70" : ""
        }`}
      >
        <div className="flex h-full">
          {/* Image */}
          <div className="w-52 shrink-0 overflow-hidden">
            <img
              src={space.image_url || `${import.meta.env.BASE_URL}images/headway-F2KRf_QfCqw-unsplash.jpg`}
              alt={space.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col min-w-0 overflow-hidden gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1 min-w-0 flex-1">
                {space.name}
              </h3>
              {space.hidden ? (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
                  Hidden
                </span>
              ) : (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  Published
                </span>
              )}
            </div>

            {/* Meta — same icon colours as the homepage SpaceCard */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {space.neighborhood && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-[#FD858A] shrink-0" />
                  <span className="truncate">{space.neighborhood}, Seattle</span>
                </span>
              )}
              {space.capacity && (
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-[#97BFFF] shrink-0" />
                  Up to {space.capacity}
                </span>
              )}
              {space.hours && (
                <span className="flex items-center gap-1 min-w-0">
                  <Clock size={11} className="text-[#FFA86C] shrink-0" />
                  <span className="truncate max-w-[180px]">{space.hours}</span>
                </span>
              )}
            </div>

            {space.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {space.description}
              </p>
            )}

            {/* Tags + host actions */}
            <div className="flex items-center justify-between mt-auto gap-2">
              <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
                {space.category && (
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold ${badgeCls}`}>
                    {space.category}
                  </span>
                )}
                {space.amenities?.slice(0, 2).map((a) => (
                  <span
                    key={a}
                    className="text-sm px-3 py-1 rounded-full border border-green-300 text-green-700 capitalize whitespace-nowrap"
                  >
                    {CARD_AMENITY_LABELS[a] || a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              <HostActionButtons
                viewHref={`/spaces/${space.id}`}
                onEdit={onEdit}
                onToggleHide={() => onToggleHide(space)}
                hidden={space.hidden}
                onDelete={onDelete}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Thumbtack — same position as homepage SpaceCard */}
      <img
        src={thumbtackImg}
        alt=""
        aria-hidden="true"
        className="absolute -top-6 -right-3 w-[80px] pointer-events-none select-none z-10 rotate-12"
      />
    </div>
  );
}

function SpacesSection({ createdSpaces, onCreateSpace, onEditSpace, onDeleteSpace, onToggleHide, isAdmin }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState(new Set());
  const [query, setQuery] = useState("");

  const visibleSpaces = pendingDeleteIds.size > 0
    ? createdSpaces.filter((s) => !pendingDeleteIds.has(s.id))
    : createdSpaces;

  const filteredSpaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleSpaces;
    return visibleSpaces.filter((s) => {
      const hay = [
        s.name, s.address, s.neighborhood, s.category, s.description,
        ...(s.amenities || []),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSpaces, query]);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={isAdmin ? "All Spaces" : "Your Spaces"}
        subtitle={`${visibleSpaces.length} space${visibleSpaces.length !== 1 ? "s" : ""} ${isAdmin ? "on the site" : "created"}`}
        action={<CreateButton onClick={onCreateSpace} label="Create Space" />}
      />

      {visibleSpaces.length > 0 && (
        <HostSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search your spaces by name, address, neighborhood, or amenity…"
        />
      )}

      {visibleSpaces.length === 0 ? (
        <EmptyHostState
          icon={Building2}
          title="No spaces yet"
          body="Create a space to promote your venue and link it to events you host."
          ctaLabel="Create Space"
          onCta={onCreateSpace}
        />
      ) : filteredSpaces.length === 0 ? (
        <EmptyHostState
          icon={Search}
          title="No matches"
          body={`Nothing matches "${query}". Try a different keyword or clear the search.`}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {filteredSpaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              onEdit={() => onEditSpace(space)}
              onDelete={() => setDeleteConfirm(space)}
              onToggleHide={onToggleHide}
            />
          ))}
        </div>
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          title="Delete Space?"
          body={
            <>
              <span className="font-semibold text-gray-700">"{deleteConfirm.name}"</span> will be
              permanently removed. This cannot be undone.
            </>
          }
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            setPendingDeleteIds((prev) => new Set([...prev, deleteConfirm.id]));
            onDeleteSpace(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "profile",   label: "Profile",           description: "Account & company info",  icon: User },
  { id: "templates", label: "Templates",         description: "Reusable event formats",  icon: FileText },
  { id: "spaces",    label: "Spaces",            description: "Manage your venues",      icon: Building2 },
  { id: "events",    label: "Your Events",       description: "Manage your listings",    icon: Calendar },
  { id: "bookmarks", label: "Bookmarked Events", description: "Your saved events",       icon: Bookmark },
  { id: "attending", label: "Attending Events",  description: "Events you're going to",  icon: CalendarCheck },
];

export default function HostTools() {
  const { user, setUser, authLoading, createdEvents, deletedEventIds, editedEvents, addCreatedEvent, replaceCreatedEvent, deleteEvent, updateEvent, hiddenEventIds, hideEvent, showEvent, bookmarkedEvents, toggleBookmark, bookmarkGroups, addBookmarkGroup, removeBookmarkGroup, eventGroupMap, addEventToGroup, removeEventFromGroup, attendingEvents, unmarkAttending, createdSpaces, addCreatedSpace, replaceCreatedSpace, deleteCreatedSpace, updateCreatedSpace, deletedStaticSpaceIds, addDeletedStaticSpace, hostTemplates, addHostTemplate, updateHostTemplate, deleteHostTemplate } = useUser();
  const { events: allDbEvents } = useEvents({ mode: "full", includeHidden: true });
  const templates = [...INITIAL_TEMPLATES, ...hostTemplates];
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(() => {
    const s = location.state?.section;
    return ["events", "templates", "spaces", "profile", "bookmarks", "attending"].includes(s) ? s : "profile";
  });
  const [createEventOpen, setCreateEventOpen] = useState(() => Boolean(location.state?.create));
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [hideToast, setHideToast] = useState(null);
  const [editingSpace, setEditingSpace] = useState(null);
  const [initialTemplate, setInitialTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateSaveError, setTemplateSaveError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "host" && user.role !== "admin")) navigate("/signin");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (location.state?.section) {
      const s = location.state.section;
      if (["events", "templates", "spaces", "profile", "bookmarks", "attending"].includes(s)) {
        setActiveSection(s);
      }
    } else {
      setActiveSection("profile");
    }
    if (location.state?.create) {
      setEditingEvent(null);
      setInitialTemplate(null);
      setCreateEventOpen(true);
    } else {
      setCreateEventOpen(false);
      setCreateSpaceOpen(false);
      setEditingEvent(null);
      setEditingSpace(null);
      setInitialTemplate(null);
    }
  }, [location.key]);

  // These memos must run on every render (Rules of Hooks: no hooks after conditional returns)
  const allHostEvents = useMemo(() => {
    if (!user || user.role === "admin") return allDbEvents;
    const ownedDbEvents = allDbEvents.filter((e) => e.host_id === user.id);
    const merged = [...createdEvents, ...ownedDbEvents];
    const seen = new Set();
    const deduped = merged.filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
    return deduped
      .filter((e) => !deletedEventIds.has(e.id))
      .map((e) => (editedEvents[e.id] ? { ...e, ...editedEvents[e.id] } : e));
  }, [user?.role, allDbEvents, user?.id, createdEvents, deletedEventIds, editedEvents]);

  const allCatalogEvents = allDbEvents;

  const allHostSpaces = useMemo(() => {
    if (!user || user.role !== "admin") return createdSpaces;
    const dbIds = new Set(createdSpaces.map((s) => s.id));
    const dbNames = new Set(createdSpaces.map((s) => s.name?.toLowerCase().trim()));
    const unimportedStatics = staticSpaces.filter(
      (s) => !dbIds.has(s.id) && !dbNames.has(s.name?.toLowerCase().trim()) && !deletedStaticSpaceIds.has(s.id)
    );
    return [...createdSpaces, ...unimportedStatics];
  }, [createdSpaces, user?.role, deletedStaticSpaceIds]);

  if (authLoading) return null;
  if (!user || (user.role !== "host" && user.role !== "admin")) return null;

  const isStaticSpace = (id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  async function handlePublish(eventData) {
    const payload = { ...eventData, host_id: user.id };
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
      await updateEventInDB(editingEvent.id, payload);
    } else {
      const tempId = eventData.id;
      addCreatedEvent(eventData);
      try {
        const dbEvent = await createEventInDB(payload);
        // Sync local state to real DB record (which has a DB-assigned UUID)
        if (dbEvent && dbEvent.id !== tempId) {
          replaceCreatedEvent(tempId, { ...eventData, ...dbEvent });
        }
      } catch (err) {
        // Roll back optimistic event so a broken record doesn't linger
        deleteEvent(tempId);
        throw err;
      }
    }
    setCreateEventOpen(false);
    setEditingEvent(null);
    setInitialTemplate(null);
    setActiveSection("events");
  }

  async function handleEditEvent(event) {
    try {
      const full = await fetchEventById(event.id);
      setInitialTemplate(null);
      setEditingEvent(full);
      setCreateEventOpen(true);
    } catch (err) {
      console.warn("Failed to load event for editing:", err.message);
      setInitialTemplate(null);
      setEditingEvent(event);
      setCreateEventOpen(true);
    }
  }

  function handleToggleHide(event) {
    const next = !event.hidden;
    // Optimistic update — flips badge and button text immediately
    updateEvent(event.id, { ...event, hidden: next });
    next ? hideEvent(event.id) : showEvent(event.id);

    setEventHiddenInDB(event.id, next)
      .then(() => {
        setHideToast({ message: next ? "Event hidden from public" : "Event is now visible", ok: true });
        setTimeout(() => setHideToast(null), 3000);
      })
      .catch((err) => {
        // Roll back on failure
        updateEvent(event.id, { ...event, hidden: !next });
        next ? showEvent(event.id) : hideEvent(event.id);
        setHideToast({ message: "Failed to update visibility — check your connection", ok: false });
        setTimeout(() => setHideToast(null), 4000);
        console.warn("Failed to persist visibility change:", err.message);
      });
  }

  function handleUseTemplate(tpl) {
    setEditingEvent(null);
    setInitialTemplate(tpl);
    setCreateEventOpen(true);
  }

  function handleEditTemplate(tpl) {
    setEditingTemplate(tpl);
    setTemplateSaveError("");
  }

  async function handleSaveEditedTemplate(changes) {
    try {
      await updateHostTemplate(editingTemplate.id, changes);
      setEditingTemplate(null);
    } catch {
      setTemplateSaveError("Failed to save — please try again.");
    }
  }

  function handleDeleteTemplate(id) {
    deleteHostTemplate(id);
    setEditingTemplate(null);
  }

  function handleCancelCreate() {
    setCreateEventOpen(false);
    setEditingEvent(null);
    setInitialTemplate(null);
  }

  async function handlePublishSpace(spaceData) {
    // Preserve original host_id when admin edits another host's space
    const hostId = editingSpace?.host_id ?? user.id;
    const payload = { ...spaceData, host_id: hostId };
    if (editingSpace && isStaticSpace(editingSpace.id)) {
      // Static space being edited for the first time — create a DB record instead of updating.
      // Strip the slug id so the DB assigns a real UUID.
      const { id: _slug, ...payloadWithoutId } = payload;
      try {
        const dbSpace = await createSpaceInDB(payloadWithoutId);
        if (dbSpace) addCreatedSpace(dbSpace);
      } catch (err) {
        throw err;
      }
    } else if (editingSpace) {
      const prevSpace = createdSpaces.find((s) => s.id === editingSpace.id);
      updateCreatedSpace(editingSpace.id, payload);
      try {
        await updateSpaceInDB(editingSpace.id, payload);
      } catch (err) {
        if (prevSpace) updateCreatedSpace(editingSpace.id, prevSpace);
        throw err;
      }
    } else {
      const tempId = spaceData.id;
      addCreatedSpace(payload);
      try {
        const dbSpace = await createSpaceInDB(payload);
        if (dbSpace) replaceCreatedSpace(tempId, { ...payload, ...dbSpace });
      } catch (err) {
        deleteCreatedSpace(tempId);
        throw err;
      }
    }
    setCreateSpaceOpen(false);
    setEditingSpace(null);
    setActiveSection("spaces");
  }

  function handleToggleHideSpace(space) {
    if (isStaticSpace(space.id)) {
      // Import the static space to DB as hidden so it persists.
      // Strip the slug id — the DB will assign a real UUID.
      const { id: _slug, ...rest } = space;
      createSpaceInDB({ ...rest, host_id: user.id, hidden: true })
        .then((dbSpace) => {
          if (dbSpace) addCreatedSpace(dbSpace);
          setHideToast({ message: "Space hidden from public", ok: true });
          setTimeout(() => setHideToast(null), 3000);
        })
        .catch((err) => {
          setHideToast({ message: "Failed to update visibility — check your connection", ok: false });
          setTimeout(() => setHideToast(null), 4000);
          console.warn("Failed to import static space:", err.message);
        });
      return;
    }
    const next = !space.hidden;
    updateCreatedSpace(space.id, { ...space, hidden: next });
    setSpaceHiddenInDB(space.id, next)
      .then(() => {
        setHideToast({ message: next ? "Space hidden from public" : "Space is now visible", ok: true });
        setTimeout(() => setHideToast(null), 3000);
      })
      .catch((err) => {
        updateCreatedSpace(space.id, { ...space, hidden: !next });
        setHideToast({ message: "Failed to update visibility — check your connection", ok: false });
        setTimeout(() => setHideToast(null), 4000);
        console.warn("Failed to persist space visibility change:", err.message);
      });
  }

  function handleEditSpace(space) {
    setEditingSpace(space);
    setCreateSpaceOpen(true);
  }

  function handleDeleteSpace(id) {
    if (isStaticSpace(id)) {
      addDeletedStaticSpace(id);
      return;
    }
    deleteCreatedSpace(id);
    deleteSpaceInDB(id).catch((err) =>
      console.warn("Failed to delete space from DB:", err.message),
    );
  }

  if (createSpaceOpen) {
    return (
      <CreateSpaceView
        editingSpace={editingSpace}
        onCancel={() => { setCreateSpaceOpen(false); setEditingSpace(null); }}
        onPublish={handlePublishSpace}
      />
    );
  }

  if (createEventOpen) {
    return (
      <CreateEventView
        editingEvent={editingEvent}
        initialTemplate={initialTemplate}
        templates={templates}
        createdSpaces={allHostSpaces}
        onCancel={handleCancelCreate}
        onPublish={handlePublish}
        onSaveTemplate={(tpl) => addHostTemplate({ ...tpl, host_id: user.id })}
      />
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          saveError={templateSaveError}
          onSave={handleSaveEditedTemplate}
          onDelete={() => handleDeleteTemplate(editingTemplate.id)}
          onCancel={() => { setEditingTemplate(null); setTemplateSaveError(""); }}
        />
      )}

      {/* Visibility toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-full shadow-lg text-sm font-medium pointer-events-none transition-all duration-300 ${
          hideToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        } ${hideToast?.ok ? "bg-gray-900 text-white" : "bg-red-600 text-white"}`}
      >
        {hideToast?.message}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="md:w-72 flex-shrink-0 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
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
              <Link
                to="/host/analytics"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors bg-white border border-gray-200 text-gray-700 hover:border-[#9FB366]/50"
              >
                <BarChart3 size={14} />
                Analytics
              </Link>
            </div>

            {/* Desktop: sidebar card */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Profile summary */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-[#9FB366]/10 to-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#9FB366] text-white font-bold text-xl flex items-center justify-center flex-shrink-0 select-none">
                    {user.name?.slice(0, 2).toUpperCase() || "DH"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base leading-tight">{user.name}</p>
                    <p className="text-sm text-[#9FB366] font-medium mt-0.5">{user.role === "admin" ? "Administrator" : "Event Host"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Seattle, WA</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-[#9FB366]/20">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{allHostEvents.length}</p>
                    <p className="text-xs text-gray-400">Events</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{createdSpaces.length}</p>
                    <p className="text-xs text-gray-400">Spaces</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{bookmarkedEvents.size}</p>
                    <p className="text-xs text-gray-400">Saved</p>
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
              <Link
                to="/host/analytics"
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors border-t border-gray-100 hover:bg-gray-50"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100">
                  <BarChart3 size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight text-gray-800">Analytics</p>
                  <p className="text-xs text-gray-400 mt-0.5">Per-event performance</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </Link>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {activeSection === "profile" && <ProfileSection user={user} setUser={setUser} />}
            {activeSection === "templates" && (
              <TemplatesSection
                templates={templates}
                onCreateTemplate={() => { setEditingEvent(null); setInitialTemplate(null); setCreateEventOpen(true); }}
                onUseTemplate={handleUseTemplate}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />
            )}
            {activeSection === "spaces" && (
              <SpacesSection
                createdSpaces={allHostSpaces}
                onCreateSpace={() => { setEditingSpace(null); setCreateSpaceOpen(true); }}
                onEditSpace={handleEditSpace}
                onDeleteSpace={handleDeleteSpace}
                onToggleHide={handleToggleHideSpace}
                isAdmin={user.role === "admin"}
              />
            )}
            {activeSection === "events" && (
              <EventsSection
                hostEvents={allHostEvents}
                onCreateEvent={() => { setEditingEvent(null); setInitialTemplate(null); setCreateEventOpen(true); }}
                onEditEvent={handleEditEvent}
                onDeleteEvent={(id) => {
                  deleteEvent(id);
                  deleteEventInDB(id).catch((err) =>
                    console.warn("Failed to delete event from DB:", err.message),
                  );
                }}
                onToggleHide={handleToggleHide}
                isAdmin={user.role === "admin"}
              />
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
