import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useTrip } from "../../../context/TripContext";
import { createTrip, deleteTrip, updateTrip } from "../../../services/trips";
import DatePickerField from "../../../components/ui/DatePickerField";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";
import MasterPageShell, {
  MasterList,
  MasterListItem,
  MasterListEmpty,
} from "../../../components/layout/MasterPageShell";
import AdminTaskManager from "../../../components/task-manager/AdminTaskManager";
import LocationPicker from "../../../components/location-picker/LocationPicker";

// ─── Trip types ───────────────────────────────────────────────────────────────
const TRIP_TYPES = [
  { value: "group", label: "Group Tour", icon: "👥", glow: "59,130,246" },
  { value: "adventure", label: "Adventure", icon: "🏔️", glow: "249,115,22" },
  { value: "family", label: "Family", icon: "👨‍👩‍👧‍👦", glow: "16,185,129" },
  { value: "solo", label: "Solo", icon: "🧳", glow: "139,92,246" },
  { value: "beach", label: "Beach", icon: "🏖️", glow: "6,182,212" },
  { value: "mountain", label: "Mountain", icon: "⛰️", glow: "100,116,139" },
  { value: "road_trip", label: "Road Trip", icon: "🚗", glow: "234,179,8" },
  { value: "business", label: "Business", icon: "💼", glow: "99,102,241" },
  { value: "cultural", label: "Cultural", icon: "🏛️", glow: "236,72,153" },
  { value: "religious", label: "Religious", icon: "🛕", glow: "167,139,250" },
  { value: "other", label: "Other", icon: "✈️", glow: "16,185,129" },
];

const tripTypeMap = Object.fromEntries(TRIP_TYPES.map((t) => [t.value, t]));

const STATUS_BADGE = {
  planned: "bg-blue-600/20 text-blue-400 border border-blue-700/40",
  active: "bg-emerald-600/20 text-emerald-400 border border-emerald-700/40",
  completed: "bg-slate-600/20 text-slate-300 border border-slate-600/40",
  cancelled: "bg-red-600/20 text-red-400 border border-red-700/40",
};

const STATUS_COVER_GLOW = {
  planned: "trip-cover-glow--planned",
  active: "trip-cover-glow--active",
  completed: "trip-cover-glow--completed",
  cancelled: "trip-cover-glow--cancelled",
};

const COUNTDOWN_THEME = {
  planned: { glow: "59,130,246", label: "Starts in", textCls: "text-blue-300" },
  active: {
    glow: "16,185,129",
    label: "Starts in",
    textCls: "text-emerald-300",
  },
  completed: {
    glow: "100,116,139",
    label: "Completed",
    textCls: "text-slate-400",
  },
  cancelled: { glow: "239,68,68", label: "Cancelled", textCls: "text-red-400" },
};

function getCountdownTheme(trip) {
  return COUNTDOWN_THEME[trip?.status] || COUNTDOWN_THEME.planned;
}

const CONFETTI_COLORS = [
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
];

const EMPTY_FORM = {
  tripName: "",
  description: "",
  budget: "",
  startDate: "",
  endDate: "",
  coverImage: "",
  status: "planned",
  tripType: "group",
  location: null,
};

// ─── Global keyframes (injected once) ────────────────────────────────────────
const KEYFRAMES = `
@keyframes digitDrop {
  0%   { transform: translateY(-40%) scale(0.8); opacity: 0; }
  100% { transform: translateY(0)    scale(1);   opacity: 1; }
}
@keyframes floatBob {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-8px); }
}
@keyframes gradShift {
  0%,100% { background-position: 0% 50%; }
  50%     { background-position: 100% 50%; }
}
@keyframes cardEntrance {
  0%   { transform: scale(0.05) rotate(-18deg); opacity: 0; }
  35%  { transform: scale(1.09) rotate(4deg);  opacity: 1; }
  58%  { transform: scale(0.95) rotate(-2deg); }
  76%  { transform: scale(1.03) rotate(1deg);  }
  100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
}
@keyframes fadeSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes progressFill {
  from { width: 100%; }
  to   { width: 0%;   }
}
@keyframes goldShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes titleFloat {
  0%,100% { transform: translateY(0px) scale(1);    }
  50%     { transform: translateY(-4px) scale(1.02); }
}
@keyframes spinIn {
  0%   { transform: rotate(-200deg) scale(0); opacity: 0; }
  65%  { transform: rotate(15deg)  scale(1.12); opacity: 1; }
  82%  { transform: rotate(-5deg)  scale(0.97); }
  100% { transform: rotate(0deg)   scale(1);    opacity: 1; }
}
@keyframes imageFloat {
  0%,100% { transform: translateY(0px)   scale(1);    }
  50%     { transform: translateY(-6px)  scale(1.02); }
}
@keyframes glowPulse {
  0%,100% { opacity: 0.6; }
  50%     { opacity: 1;   }
}
@keyframes tilePop {
  0%   { transform: scale(0.4) translateY(10px); opacity: 0; }
  70%  { transform: scale(1.12) translateY(-3px); opacity: 1; }
  100% { transform: scale(1)   translateY(0);    opacity: 1; }
}
@keyframes backdropIn {
  from { backdrop-filter: blur(0px); background: rgba(0,0,0,0); }
  to   { backdrop-filter: blur(12px); background: rgba(0,0,0,0.88); }
}
.digit-drop   { animation: digitDrop   0.22s cubic-bezier(0.22,0.61,0.36,1) forwards; }
.float-bob    { animation: floatBob    3.5s ease-in-out infinite; }
@keyframes shimmerText {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.card-enter   { animation: cardEntrance 0.85s cubic-bezier(0.22,1.2,0.36,1) both; }
.spin-in      { animation: spinIn      0.75s cubic-bezier(0.34,1.4,0.64,1) 0.55s both; }
.image-float  { animation: imageFloat  4s ease-in-out infinite; }
.slide-up-1   { animation: fadeSlideUp 0.45s ease-out 0.7s  both; }
.slide-up-2   { animation: fadeSlideUp 0.45s ease-out 0.85s both; }
.slide-up-3   { animation: fadeSlideUp 0.45s ease-out 1.0s  both; }
.slide-up-4   { animation: fadeSlideUp 0.45s ease-out 1.15s both; }
.tile-pop-0   { animation: tilePop 0.5s cubic-bezier(0.34,1.4,0.64,1) 1.2s both; }
.tile-pop-1   { animation: tilePop 0.5s cubic-bezier(0.34,1.4,0.64,1) 1.32s both; }
.tile-pop-2   { animation: tilePop 0.5s cubic-bezier(0.34,1.4,0.64,1) 1.44s both; }
.tile-pop-3   { animation: tilePop 0.5s cubic-bezier(0.34,1.4,0.64,1) 1.56s both; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function coverImageToDataUrl(file) {
  if (!file.type.startsWith("image/"))
    throw new Error("Please select an image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 480;
        let { width: w, height: h } = img;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

const fmtDate = (iso) =>
  iso ? formatDateTimeDisplay(iso).split(",")[0] : null;
const isoToInputDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const pad2 = (n) => String(Math.max(0, n)).padStart(2, "0");

function calcCountdown(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: false,
  };
}

// ─── getTripPhase ─────────────────────────────────────────────────────────────
function getTripPhase(trip) {
  if (trip.status === "cancelled") return { phase: "cancelled" };
  if (trip.status === "completed") return { phase: "completed" };

  const now   = Date.now();
  const start = trip.startDate ? new Date(trip.startDate).getTime() : null;
  const end   = trip.endDate   ? new Date(trip.endDate).getTime()   : null;

  if (end && now > end)      return { phase: "completed" };
  if (start && now >= start) return { phase: "begun" };
  if (start)                 return { phase: "upcoming", targetDate: trip.startDate };
  return { phase: "no-dates" };
}

// ─── useCountdown ─────────────────────────────────────────────────────────────
function useCountdown(targetDateStr) {
  const [time, setTime] = useState(() => calcCountdown(targetDateStr));
  useEffect(() => {
    if (!targetDateStr) {
      setTime(null);
      return;
    }
    setTime(calcCountdown(targetDateStr));
    const id = setInterval(() => setTime(calcCountdown(targetDateStr)), 1000);
    return () => clearInterval(id);
  }, [targetDateStr]);
  return time;
}

// ─── Confetti canvas (full-screen explosive) ──────────────────────────────────
const GOLD_COLORS = ["#f59e0b", "#fde68a", "#fbbf24", "#f97316", "#fcd34d"];

function FullConfetti({ active }) {
  const canvasRef = useRef(null);
  const raf = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.45;

    // Classic confetti falling from top
    const classic = Array.from({ length: 140 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 5 + 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 10 + 4,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.18,
      shape: i % 3 === 0 ? "circle" : "rect",
      life: 1,
      decay: Math.random() * 0.004 + 0.002,
      type: "classic",
    }));

    // Burst sparks radiating from center
    const sparks = Array.from({ length: 70 }, (_, i) => {
      const angle = (i / 70) * Math.PI * 2;
      const speed = Math.random() * 14 + 7;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        color:
          i % 2 === 0
            ? GOLD_COLORS[i % GOLD_COLORS.length]
            : CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: Math.random() * 4 + 1.5,
        life: 1,
        decay: Math.random() * 0.018 + 0.01,
        type: "spark",
      };
    });

    // Gold streamers bursting from center
    const streamers = Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * Math.PI * 2;
      const speed = Math.random() * 9 + 5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: GOLD_COLORS[i % GOLD_COLORS.length],
        lineWidth: Math.random() * 3 + 1.5,
        life: 1,
        decay: Math.random() * 0.009 + 0.005,
        type: "streamer",
      };
    });

    particles.current = [...classic, ...sparks, ...streamers];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0.01);

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * 1.6);

        if (p.type === "spark") {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else if (p.type === "streamer") {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.lineWidth;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.5, p.y - p.vy * 0.5);
          ctx.stroke();
        } else {
          p.rot += p.rotV;
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
          }
        }

        ctx.restore();
      }

      if (particles.current.length > 0)
        raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 55 }}
    />
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconEye = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const IconClipboard = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);
const IconEdit = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const IconTrash = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const IconClose = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const IconPlus = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// ─── CoverImagePicker ─────────────────────────────────────────────────────────
function CoverImagePicker({ preview, onPreview, onChange, onError, error }) {
  const ref = useRef(null);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onError?.("");
    try {
      const dataUrl = await coverImageToDataUrl(file);
      onChange(dataUrl);
      onPreview(dataUrl);
    } catch (err) {
      onError?.(err.message);
    }
    e.target.value = "";
  };
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">
        Cover photo (optional)
      </label>
      <div className="flex items-center gap-3">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="cover"
              className="w-20 h-20 rounded-xl object-cover border border-slate-700"
            />
            <button
              type="button"
              onClick={() => {
                onChange("");
                onPreview("");
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs flex items-center justify-center shadow"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-600 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950 shrink-0">
            <span className="text-xl mb-0.5">🖼️</span>
            <span className="text-[10px] text-slate-500">Add photo</span>
            <input
              ref={ref}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        )}
        <p className="text-xs text-slate-500 leading-relaxed">
          JPG, PNG, WebP · max 5 MB
          <br />
          Auto-resized to 480 px
        </p>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ─── TripForm ─────────────────────────────────────────────────────────────────
function TripForm({ initialTrip, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initialTrip
      ? {
          tripName: initialTrip.tripName || "",
          description: initialTrip.description || "",
          budget: String(initialTrip.budget || ""),
          startDate: isoToInputDate(initialTrip.startDate),
          endDate: isoToInputDate(initialTrip.endDate),
          coverImage: initialTrip.coverImage || "",
          status: initialTrip.status || "planned",
          tripType: initialTrip.tripType || "group",
          location: initialTrip.location ||
            (initialTrip.latitude && initialTrip.longitude
              ? {
                  name: initialTrip.locationName || `${initialTrip.latitude}, ${initialTrip.longitude}`,
                  lat: Number(initialTrip.latitude),
                  lng: Number(initialTrip.longitude),
                  url: initialTrip.mapLink || `https://maps.google.com/?q=${initialTrip.latitude},${initialTrip.longitude}`,
                }
              : null),
        }
      : {}),
  }));
  const [preview, setPreview] = useState(initialTrip?.coverImage || "");
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState("");
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("End date cannot be before start date");
      return;
    }
    try {
      const loc = form.location;
      await onSubmit({
        ...form,
        budget: Number(form.budget) || 0,
        startDate: form.startDate
          ? new Date(`${form.startDate}T00:00:00`).toISOString()
          : undefined,
        endDate: form.endDate
          ? new Date(`${form.endDate}T23:59:59`).toISOString()
          : undefined,
        location: loc || null,
        locationName: loc?.name || null,
        latitude: loc?.lat || null,
        longitude: loc?.lng || null,
        mapLink: loc?.url || null,
        geoCoordinates: loc ? { lat: loc.lat, lng: loc.lng } : null,
      });
    } catch (err) {
      setError(err.message || "Failed");
    }
  };

  const isEdit = !!initialTrip;
  const inputCls =
    "w-full h-11 px-4 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        placeholder="Trip name *"
        value={form.tripName}
        onChange={f("tripName")}
        className={inputCls}
        required
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={f("description")}
        className={`${inputCls} h-auto py-2.5 resize-none`}
        rows={2}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <select
          value={form.tripType}
          onChange={f("tripType")}
          className={inputCls}
          aria-label="Trip type"
        >
          {TRIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Budget"
          value={form.budget}
          onChange={f("budget")}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Start date
          </label>
          <DatePickerField
            value={form.startDate}
            onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
            max={form.endDate || undefined}
            showHint={false}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">End date</label>
          <DatePickerField
            value={form.endDate}
            onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
            min={form.startDate || undefined}
            showHint={false}
          />
        </div>
        {isEdit && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status</label>
            <select
              value={form.status}
              onChange={f("status")}
              className={inputCls}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      <CoverImagePicker
        preview={preview}
        onPreview={setPreview}
        onChange={(v) => setForm((p) => ({ ...p, coverImage: v }))}
        onError={setImgError}
        error={imgError}
      />

      {/* Location picker */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-base">📍</span>
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Trip Location
          </p>
          <span className="text-xs text-slate-600 font-normal normal-case">(optional)</span>
        </div>
        <LocationPicker
          value={form.location}
          onChange={(loc) => setForm((p) => ({ ...p, location: loc }))}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create Trip"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── TripStatusText ─── "Trip Begins" (green) or "Trip Completed" (gold) ──────
function TripStatusText({ type, compact = false }) {
  const isCompleted = type === "completed";
  const text = isCompleted ? "Trip Completed" : "Trip Begins";
  const icon = isCompleted ? "🏁" : "🚀";
  const grad = isCompleted
    ? "linear-gradient(90deg,#f59e0b,#fcd34d,#f59e0b,#d97706,#f59e0b)"
    : "linear-gradient(90deg,#10b981,#6ee7b7,#10b981,#059669,#10b981)";
  const border = isCompleted ? "1px solid rgba(245,158,11,0.35)"  : "1px solid rgba(16,185,129,0.35)";
  const bg     = isCompleted ? "rgba(245,158,11,0.07)"            : "rgba(16,185,129,0.07)";

  const shimmer = {
    background: grad,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmerText 2s linear infinite",
    fontWeight: 700,
  };

  if (compact) {
    return (
      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border, background: bg }}>
        <span className="text-sm leading-none">{icon}</span>
        <span style={{ ...shimmer, fontSize: "0.72rem" }}>{text}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ border, background: `linear-gradient(135deg,${bg} 0%,rgba(15,23,42,0.9) 100%)` }}>
      <span className="text-3xl leading-none">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 font-semibold">Trip Status</p>
        <span style={{ ...shimmer, fontSize: "1.4rem" }}>{text}</span>
      </div>
    </div>
  );
}

// ─── CountdownTile ────────────────────────────────────────────────────────────
function CountdownTile({ value, label, glow, size = "sm" }) {
  const isLg = size === "lg";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl ${isLg ? "w-20 h-20 sm:w-24 sm:h-24" : "w-12 h-12"} relative overflow-hidden`}
      style={{
        background: `rgba(${glow}, 0.07)`,
        border: `1px solid rgba(${glow}, 0.35)`,
        boxShadow: `0 0 ${isLg ? 20 : 10}px rgba(${glow}, 0.25), inset 0 0 ${isLg ? 20 : 8}px rgba(${glow}, 0.05)`,
      }}
    >
      {/* animated shimmer strip */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 40%, rgba(${glow}, 0.3) 50%, transparent 60%)`,
          backgroundSize: "200% 200%",
          animation: "gradShift 3s ease infinite",
        }}
      />
      <span
        key={value}
        className={`digit-drop font-bold tabular-nums leading-none ${isLg ? "text-3xl sm:text-4xl" : "text-lg"}`}
        style={{
          color: `rgb(${glow})`,
          textShadow: `0 0 12px rgba(${glow}, 0.6)`,
        }}
      >
        {pad2(value)}
      </span>
      <span
        className={`${isLg ? "text-[11px] mt-1" : "text-[9px] mt-0.5"} uppercase tracking-widest font-medium`}
        style={{ color: `rgba(${glow}, 0.7)` }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── TripCountdownStrip (compact — for TripCard) ──────────────────────────────
function TripCountdownStrip({ trip }) {
  const { phase, targetDate } = getTripPhase(trip);
  const time = useCountdown(phase === "upcoming" ? targetDate : null);
  const theme = getCountdownTheme(trip);

  if (phase === "cancelled" || phase === "no-dates") return null;
  if (phase === "completed") return <TripStatusText type="completed" compact />;
  if (phase === "begun")     return <TripStatusText type="begun"     compact />;
  if (!time) return null;

  return (
    <div className="mt-2.5">
      <p className={`text-[10px] uppercase tracking-widest font-medium mb-1.5 ${theme.textCls}`}>
        {theme.label}
      </p>
      <div className="flex items-center gap-1.5">
        <CountdownTile value={time.days}    label="D" glow={theme.glow} size="sm" />
        <CountdownTile value={time.hours}   label="H" glow={theme.glow} size="sm" />
        <CountdownTile value={time.minutes} label="M" glow={theme.glow} size="sm" />
        <CountdownTile value={time.seconds} label="S" glow={theme.glow} size="sm" />
      </div>
    </div>
  );
}

// ─── TripCountdownFull (premium — for ViewModal) ──────────────────────────────
function TripCountdownFull({ trip }) {
  const { phase, targetDate } = getTripPhase(trip);
  const time = useCountdown(phase === "upcoming" ? targetDate : null);
  const theme = getCountdownTheme(trip);

  if (phase === "cancelled" || phase === "no-dates") return null;
  if (phase === "completed") return <TripStatusText type="completed" compact={false} />;
  if (phase === "begun")     return <TripStatusText type="begun"     compact={false} />;
  if (!time) return null;

  const glow = theme.glow;
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(${glow}, 0.12) 0%, rgba(15,23,42,0.9) 60%, rgba(${glow}, 0.06) 100%)`,
        border: `1px solid rgba(${glow}, 0.25)`,
        boxShadow: `0 0 30px rgba(${glow}, 0.1)`,
        backgroundSize: "300% 300%",
        animation: "gradShift 6s ease infinite",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, rgba(${glow}, 0.1) 0%, transparent 70%)`,
        }}
      />
      <p className={`text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2 ${theme.textCls}`}>
        <span className="animate-pulse">⏱</span>
        {theme.label}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { value: time.days,    label: "Days",    delay: "0s" },
          { value: time.hours,   label: "Hours",   delay: "0.4s" },
          { value: time.minutes, label: "Minutes", delay: "0.8s" },
          { value: time.seconds, label: "Seconds", delay: "1.2s" },
        ].map(({ value, label, delay }) => (
          <div key={label} className="float-bob" style={{ animationDelay: delay }}>
            <CountdownTile value={value} label={label} glow={glow} size="lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TripCreationSuccessPopup ─────────────────────────────────────────────────
function TripCreationSuccessPopup({ data, onClose }) {
  const [confettiActive, setConfettiActive] = useState(false);
  const [closing, setClosing] = useState(false);
  const progressRef = useRef(null);
  const AUTO_DISMISS = 8000;
  const tripType = tripTypeMap[data.tripType] || tripTypeMap.group;
  const time = useCountdown(data.startDate);

  useEffect(() => {
    // Fire confetti after card entrance animation completes (~0.9s)
    const confId = setTimeout(() => setConfettiActive(true), 900);
    const tId = setTimeout(() => handleClose(), AUTO_DISMISS);
    return () => {
      clearTimeout(confId);
      clearTimeout(tId);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 350);
  }, [closing, onClose]);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <FullConfetti active={confettiActive} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center px-4 py-6 overflow-y-auto"
        style={{
          zIndex: 50,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(12px)",
          animation: "backdropIn 0.4s ease forwards",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.35s ease",
        }}
        onClick={handleClose}
      >
        {/* Card */}
        <div
          className="card-enter relative w-full max-w-md rounded-3xl overflow-hidden my-auto"
          style={{
            background: "linear-gradient(145deg, #0b1120, #141e30, #0f172a)",
            border: `1px solid rgba(${tripType.glow}, 0.45)`,
            boxShadow: `0 0 80px rgba(${tripType.glow}, 0.3), 0 0 160px rgba(${tripType.glow}, 0.1), 0 40px 100px rgba(0,0,0,0.7)`,
            opacity: closing ? 0 : 1,
            transform: closing ? "scale(0.9)" : undefined,
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Radial glow wash top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, rgba(${tripType.glow}, 0.22) 0%, transparent 60%)`,
            }}
          />

          {/* Top accent line */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${tripType.glow}, 1), transparent)`,
            }}
          />

          <div className="p-7 relative">
            {/* Close X */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors z-10"
            >
              <IconClose />
            </button>

            {/* ── TRIP MODE ON — gold gradient shimmer ── */}
            <div className="text-center mb-5">
              <p
                className="text-3xl font-black uppercase tracking-[0.2em] leading-tight select-none"
                style={{
                  background:
                    "linear-gradient(90deg,#f59e0b,#fde68a,#f97316,#fbbf24,#fde68a,#f59e0b)",
                  backgroundSize: "300% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation:
                    "goldShimmer 2s linear infinite, titleFloat 3s ease-in-out infinite",
                  filter: "drop-shadow(0 0 18px rgba(245,158,11,0.55))",
                }}
              >
                TRIP MODE ON
              </p>
            </div>

            {/* ── Spin-in celebration emoji ── */}
            <div className="text-center mb-5">
              <span
                className="spin-in text-7xl inline-block"
                style={{
                  filter: `drop-shadow(0 0 28px rgba(${tripType.glow}, 0.85))`,
                }}
              >
                🎉
              </span>
            </div>

            {/* ── Cover image (floating) ── */}
            {data.coverImage ? (
              <div className="slide-up-1 flex justify-center mb-5">
                <div className="relative">
                  <img
                    src={data.coverImage}
                    alt={data.tripName}
                    className="image-float w-32 h-32 rounded-2xl object-cover"
                    style={{
                      boxShadow: `0 0 0 3px rgba(${tripType.glow}, 0.55), 0 0 45px rgba(${tripType.glow}, 0.5), 0 0 90px rgba(${tripType.glow}, 0.2)`,
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 30px rgba(${tripType.glow}, 0.1)`,
                      animation: "glowPulse 2s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="slide-up-1 flex justify-center mb-5">
                <div
                  className="image-float w-28 h-28 rounded-2xl flex items-center justify-center text-5xl"
                  style={{
                    background: `rgba(${tripType.glow}, 0.1)`,
                    border: `2px solid rgba(${tripType.glow}, 0.45)`,
                    boxShadow: `0 0 45px rgba(${tripType.glow}, 0.3), 0 0 80px rgba(${tripType.glow}, 0.12)`,
                  }}
                >
                  {tripType.icon}
                </div>
              </div>
            )}

            {/* ── Trip type badge ── */}
            <div className="slide-up-2 flex justify-center mb-2">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{
                  background: `rgba(${tripType.glow}, 0.15)`,
                  border: `1px solid rgba(${tripType.glow}, 0.4)`,
                  color: `rgb(${tripType.glow})`,
                  boxShadow: `0 0 14px rgba(${tripType.glow}, 0.2)`,
                }}
              >
                <span>{tripType.icon}</span>
                <span>{tripType.label}</span>
              </span>
            </div>

            {/* ── Headline ── */}
            <div className="slide-up-2 text-center mb-1">
              <h2 className="text-2xl font-bold text-white">Trip Created!</h2>
            </div>

            {/* ── Trip name ── */}
            <div className="slide-up-3 text-center mb-5">
              <p
                className="text-base font-semibold"
                style={{
                  color: `rgba(${tripType.glow}, 0.95)`,
                  textShadow: `0 0 18px rgba(${tripType.glow}, 0.5)`,
                }}
              >
                {data.tripName}
              </p>
            </div>

            {/* ── Countdown tiles with staggered pop-in ── */}
            {data.startDate && !time?.isPast && time && (
              <div className="mb-5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mb-3">
                  Starts in
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="tile-pop-0">
                    <CountdownTile
                      value={time.days}
                      label="Days"
                      glow={tripType.glow}
                      size="lg"
                    />
                  </div>
                  <div className="tile-pop-1">
                    <CountdownTile
                      value={time.hours}
                      label="Hours"
                      glow={tripType.glow}
                      size="lg"
                    />
                  </div>
                  <div className="tile-pop-2">
                    <CountdownTile
                      value={time.minutes}
                      label="Mins"
                      glow={tripType.glow}
                      size="lg"
                    />
                  </div>
                  <div className="tile-pop-3">
                    <CountdownTile
                      value={time.seconds}
                      label="Secs"
                      glow={tripType.glow}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Dates row ── */}
            {(data.startDate || data.endDate) && (
              <div className="slide-up-4 flex justify-center gap-4 mb-5 text-xs text-slate-400">
                {data.startDate && <span>📅 {fmtDate(data.startDate)}</span>}
                {data.endDate && <span>→ {fmtDate(data.endDate)}</span>}
              </div>
            )}

            {/* ── Auto-dismiss progress bar ── */}
            <div className="bg-slate-800/80 rounded-full h-1 overflow-hidden mb-5">
              <div
                ref={progressRef}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, rgba(${tripType.glow}, 0.5), rgba(${tripType.glow}, 1))`,
                  animation: `progressFill ${AUTO_DISMISS}ms linear forwards`,
                  width: "100%",
                }}
              />
            </div>

            {/* ── Continue button ── */}
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: `rgba(${tripType.glow}, 0.15)`,
                border: `1px solid rgba(${tripType.glow}, 0.35)`,
                color: `rgb(${tripType.glow})`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${tripType.glow}, 0.28)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `rgba(${tripType.glow}, 0.15)`;
              }}
            >
              Continue Exploring ✈️
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── InfoTile ─────────────────────────────────────────────────────────────────
function InfoTile({ label, value }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

// ─── TripViewModal ─────────────────────────────────────────────────────────────
function TripViewModal({ trip, onClose, onEdit }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tripType = tripTypeMap[trip.tripType] || tripTypeMap.group;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover banner */}
        {trip.coverImage ? (
          <div className="relative">
            <img
              src={trip.coverImage}
              alt={trip.tripName}
              className="w-full h-52 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
            >
              <IconClose />
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[trip.status]}`}
                >
                  {trip.status}
                </span>
                <span className="text-xs text-white/70">
                  {tripType.icon} {tripType.label}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{trip.tripName}</h2>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[trip.status]}`}
                >
                  {trip.status}
                </span>
                <span className="text-xs text-slate-400">
                  {tripType.icon} {tripType.label}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{trip.tripName}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <IconClose />
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          {trip.description && (
            <p className="text-slate-300 text-sm leading-relaxed">
              {trip.description}
            </p>
          )}

          {/* Premium countdown */}
          <TripCountdownFull trip={trip} />

          <div className="grid grid-cols-2 gap-3">
            <InfoTile
              label="Budget"
              value={`₹${(trip.budget || 0).toLocaleString()}`}
            />
            <InfoTile
              label="Collected"
              value={`₹${(trip.collectedAmount || 0).toLocaleString()}`}
            />
            <InfoTile
              label="Start date"
              value={fmtDate(trip.startDate) || "—"}
            />
            <InfoTile label="End date" value={fmtDate(trip.endDate) || "—"} />
            <InfoTile
              label="Members"
              value={`${(trip.members || []).length} member${(trip.members || []).length !== 1 ? "s" : ""}`}
            />
            <InfoTile
              label="Status"
              value={<span className="capitalize">{trip.status}</span>}
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <IconEdit /> Edit Trip
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TripEditModal ─────────────────────────────────────────────────────────────
function TripEditModal({ trip, onClose, onSaved, saving }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800 shrink-0">
          <h2 className="font-semibold text-emerald-400">Edit Trip</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <IconClose />
          </button>
        </div>
        <div className="p-5 overflow-y-auto min-h-0 flex-1">
          <TripForm
            initialTrip={trip}
            onSubmit={onSaved}
            onCancel={onClose}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}

// ─── TripCard ─────────────────────────────────────────────────────────────────
function TripCard({ trip, onView, onEdit, onDelete, onCoverChange, onTasks }) {
  const tripType = tripTypeMap[trip.tripType] || tripTypeMap.group;
  const coverGlowClass = STATUS_COVER_GLOW[trip.status] || STATUS_COVER_GLOW.planned;

  return (
    <MasterListItem className="master-list-item">
      {/* Cover image */}
      <div className="relative group shrink-0 w-32 sm:w-40 self-stretch min-h-[7.5rem] bg-slate-950 border-r border-slate-800/60 flex items-center justify-center p-2">
        <div className={`trip-cover-glow-wrap ${coverGlowClass}`}>
          <span className="trip-cover-glow-shimmer" aria-hidden="true" />
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.tripName}
            className="absolute inset-0 w-full h-full object-contain p-1"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            style={{
              background: `linear-gradient(135deg, rgba(${tripType.glow},0.15) 0%, #1e293b 100%)`,
            }}
          >
            <span className="text-3xl opacity-50">{tripType.icon}</span>
          </div>
        )}
        {/* Hover overlay to change photo */}
        <label
          title={trip.coverImage ? "Change photo" : "Add cover photo"}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
        >
          <span className="text-white text-lg">📷</span>
          <span className="text-[10px] text-white/80">
            {trip.coverImage ? "Change" : "Add"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => onCoverChange(trip._id, e)}
          />
        </label>
        {/* Trip name badge */}
        {trip.coverImage && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 z-[5]">
            <p className="text-[10px] text-white/90 truncate">
              {trip.tripName}
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col sm:flex-row justify-between items-start gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-base sm:text-lg truncate">
              {trip.tripName}
            </h3>
            <span
              className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}
            >
              {trip.status}
            </span>
            <span className="text-[10px] text-slate-500 shrink-0">
              {tripType.icon} {tripType.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-1">
            {trip.description || "No description"}
          </p>
          <p className="text-xs text-slate-500">
            Budget ₹{(trip.budget || 0).toLocaleString()}
            {trip.startDate && <> · {fmtDate(trip.startDate)}</>}
            {trip.endDate && <> → {fmtDate(trip.endDate)}</>}
          </p>

          {/* Compact countdown */}
          <TripCountdownStrip trip={trip} />
        </div>

        {/* Actions stacked right */}
        <div className="flex flex-col gap-1.5 shrink-0 self-start">
          <button
            onClick={() => onView(trip)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
          >
            <IconEye /> View
          </button>
          <button
            onClick={() => onEdit(trip)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
          >
            <IconEdit /> Edit
          </button>
          <button
            onClick={() => onTasks(trip)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-900/30 hover:bg-violet-900/50 text-violet-400 text-xs font-medium transition-colors"
          >
            <IconClipboard /> Tasks
          </button>
          <button
            onClick={() => onDelete(trip._id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-medium transition-colors"
          >
            <IconTrash /> Delete
          </button>
        </div>
      </div>
    </MasterListItem>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminTrips() {
  const { trips, loadTrips } = useTrip();
  const [showCreate, setShowCreate] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [viewTrip, setViewTrip] = useState(null);
  const [tasksTrip, setTasksTrip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  // Inject global keyframes once
  useEffect(() => {
    const id = "trip-keyframes";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await createTrip(data);
      setShowCreate(false);
      setSuccessData(data);
      loadTrips();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    if (!editTrip) return;
    setSaving(true);
    try {
      await updateTrip(editTrip._id, data);
      setEditTrip(null);
      loadTrips();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    const trip = trips.find((t) => t._id === id);
    confirmDelete({
      recordLabel: trip?.tripName,
      onConfirm: async () => {
        await deleteTrip(id);
        loadTrips();
      },
    });
  };

  const handleCoverChange = async (tripId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await coverImageToDataUrl(file);
      await updateTrip(tripId, { coverImage: dataUrl });
      loadTrips();
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  };

  const openEdit = (trip) => {
    setViewTrip(null);
    setEditTrip(trip);
  };

  return (
    <MasterPageShell
      title="Trips"
      description="Manage trekking and travel trips"
      action={
        !showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition-colors"
          >
            <IconPlus /> Add New Trip
          </button>
        ) : null
      }
    >
      {/* Create form (inline panel) */}
      {showCreate && (
        <div className="bg-slate-900/80 border border-emerald-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-emerald-400">New Trip</h2>
            <button
              onClick={() => setShowCreate(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <IconClose />
            </button>
          </div>
          <TripForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Trip list */}
      {trips.length === 0 ? (
        <MasterListEmpty
          icon="✈️"
          message={
            <>
              No trips yet. Click <strong>Add New Trip</strong> to create one.
            </>
          }
        />
      ) : (
        <MasterList>
          {trips.map((t) => (
            <TripCard
              key={t._id}
              trip={t}
              onView={setViewTrip}
              onEdit={openEdit}
              onDelete={handleDelete}
              onCoverChange={handleCoverChange}
              onTasks={setTasksTrip}
            />
          ))}
        </MasterList>
      )}

      <p className="text-sm text-slate-500">
        Coordinate alarms via{" "}
        <Link to="/admin/groups" className="text-emerald-400">
          Groups
        </Link>
        .
      </p>

      {/* View modal */}
      {viewTrip && (
        <TripViewModal
          trip={viewTrip}
          onClose={() => setViewTrip(null)}
          onEdit={() => openEdit(viewTrip)}
        />
      )}

      {/* Edit modal */}
      {editTrip && (
        <TripEditModal
          trip={editTrip}
          onClose={() => setEditTrip(null)}
          onSaved={handleEdit}
          saving={saving}
        />
      )}

      {/* Trip creation success popup */}
      {successData && (
        <TripCreationSuccessPopup
          data={successData}
          onClose={() => setSuccessData(null)}
        />
      )}

      {/* Task manager modal */}
      {tasksTrip && (
        <AdminTaskManager trip={tasksTrip} onClose={() => setTasksTrip(null)} />
      )}

      {deleteModal}
    </MasterPageShell>
  );
}
