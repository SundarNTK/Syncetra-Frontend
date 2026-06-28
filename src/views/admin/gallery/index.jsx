import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useTrip } from "../../../context/TripContext";
import { ROLES } from "../../../constants/enum";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import { getMedia, getMediaItem, addMedia, deleteMedia as deleteMediaApi, signMediaUpload } from "../../../services/trips";
import { validateFile, uploadToCloudinary, MAX_IMAGE_MB, MAX_VIDEO_MB } from "../../../utils/uploadToCloudinary";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import SearchableSelect from "../../../components/ui/SearchableSelect";
import MasterActionPopup from "../../../components/ui/MasterActionPopup";

const CATEGORY_TABS = ["all", "mine", "food", "travel", "moments", "other"];
const CATEGORIES = ["food", "travel", "moments", "other"];
const MAX_BATCH_FILES = 20;
const TYPE_FILTERS = [
  { value: "all", label: "All Media" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

const toTitleCase = (text = "") =>
  String(text)
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const GALLERY_CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c,
  label: toTitleCase(c),
}));

// ─── download helper ────────────────────────────────────────────────────────
async function downloadMedia(url, fileName) {
  try {
    if (url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "media";
      a.click();
    } else {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "media";
      a.click();
      URL.revokeObjectURL(blobUrl);
    }
  } catch {
    window.open(url, "_blank");
  }
}

// ─── icons ───────────────────────────────────────────────────────────────────
const IconEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconDownload = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconClose = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconPlay = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IconPause = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const IconChevronLeft = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const IconChevronRight = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// deterministic hue from any string (user ID)
function strHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

// ─── MediaTile ────────────────────────────────────────────────────────────────
function MediaTile({ item, onView, canDelete, onDelete, isMultiselect, isSelected, onToggleSelect }) {
  const isVideo = item.mediaType === "video";

  const handleTileClick = () => {
    if (isMultiselect) onToggleSelect(item._id);
    else onView(item);
  };

  return (
    <div
      onClick={handleTileClick}
      className={`group rounded-xl overflow-hidden border bg-slate-900 relative transition-all duration-150 ${
        isMultiselect ? "cursor-pointer" : ""
      } ${isSelected ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-slate-800"}`}
    >
      {/* multiselect checkbox */}
      {isMultiselect && (
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? "bg-emerald-500 border-emerald-400" : "bg-black/60 border-white/50"
          }`}>
            {isSelected && <IconCheck />}
          </div>
        </div>
      )}

      {isVideo ? (
        <video src={item.url} className="w-full h-40 object-cover bg-black" preload="metadata" />
      ) : (
        <ZoomableImage src={item.url} alt={item.caption || item.fileName || "media"} className="w-full h-40 object-cover" />
      )}

      {/* uploader name badge — top right, per-user color */}
      {item.uploaderName && (() => {
        const hue = strHue(String(item.uploadedBy || item.uploaderName));
        return (
          <div style={{
            position: "absolute", top: 6, right: 6, zIndex: 4,
            background: `hsla(${hue},55%,8%,0.88)`,
            backdropFilter: "blur(6px)",
            border: `1px solid hsla(${hue},70%,60%,0.45)`,
            boxShadow: `0 0 8px 2px hsla(${hue},70%,50%,0.35), 0 0 18px 4px hsla(${hue},65%,45%,0.15)`,
            borderRadius: 7, padding: "2px 8px",
            fontSize: 9, fontWeight: 800, letterSpacing: ".04em",
            color: `hsl(${hue},85%,82%)`, pointerEvents: "none",
            maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.uploaderName.split(" ")[0]}
          </div>
        );
      })()}

      {/* hover overlay — hidden during multiselect */}
      {!isMultiselect && (
        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onView(item); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/25 text-white text-xs font-medium border border-white/20 backdrop-blur-sm transition-colors">
            <IconEye /> View
          </button>
          <button onClick={(e) => { e.stopPropagation(); downloadMedia(item.url, item.fileName || `media-${item._id}`); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-medium backdrop-blur-sm transition-colors">
            <IconDownload /> Save
          </button>
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/70 hover:bg-red-600 text-white text-xs font-medium backdrop-blur-sm transition-colors">
              <IconTrash /> Delete
            </button>
          )}
        </div>
      )}

      <div className="p-2 space-y-1">
        <p className="text-xs text-slate-300 truncate">{item.caption || item.fileName || item.category}</p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-500 capitalize">{item.mediaType} · {item.category}</p>
          {!isMultiselect && (
            <div className="flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); onView(item); }} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><IconEye /></button>
              <button onClick={(e) => { e.stopPropagation(); downloadMedia(item.url, item.fileName || `media-${item._id}`); }} className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"><IconDownload /></button>
              {canDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"><IconTrash /></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MediaViewer (fullscreen slider) ─────────────────────────────────────────
function MediaViewer({ items, startIndex, tripId, isAdmin, canDeleteItem, onClose, onRequestDelete }) {
  const [index, setIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerSec, setTimerSec] = useState(5);
  const [fade, setFade] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(null);
  const urlCache = useRef({});
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const total = items.length;
  const item = items[Math.min(index, total - 1)];
  const isVideo = item?.mediaType === "video";

  // Lazy-fetch the full URL whenever the current item changes
  useEffect(() => {
    if (!item) return;
    const cached = urlCache.current[item._id];
    if (cached) { setCurrentUrl(cached); return; }
    if (item.url) { urlCache.current[item._id] = item.url; setCurrentUrl(item.url); return; }
    setCurrentUrl(null);
    getMediaItem(tripId, item._id, isAdmin)
      .then((res) => {
        const url = res?.data?.url || "";
        urlCache.current[item._id] = url;
        setCurrentUrl(url);
      })
      .catch(() => setCurrentUrl(""));
  }, [item?._id, tripId, isAdmin]);

  // Keep index in bounds when items shrink after delete
  useEffect(() => {
    if (total === 0) { onClose(); return; }
    if (index >= total) setIndex(total - 1);
  }, [total]);

  const navigate = useCallback((dir) => {
    clearTimeout(timerRef.current);
    setFade(false);
    setTimeout(() => {
      setIndex((i) => (i + dir + total) % total);
      setFade(true);
    }, 180);
  }, [total]);

  const goNext = useCallback(() => navigate(1), [navigate]);
  const goPrev = useCallback(() => navigate(-1), [navigate]);

  // Image slideshow timer
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (isPlaying && !isVideo) {
      timerRef.current = setTimeout(goNext, timerSec * 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, index, isVideo, timerSec, goNext]);

  // When navigating to a video while slideshow is active, auto-play it
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    if (isPlaying) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  }, [index]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
      else if (e.key === " ") { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white bg-black/50 px-2.5 py-1 rounded-full">
            {index + 1} / {total}
          </span>
          <span className="text-xs text-slate-400 capitalize hidden sm:block">
            {item.mediaType} · {item.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => currentUrl && downloadMedia(currentUrl, item.fileName || `media-${item._id}`)}
            title="Download"
            disabled={!currentUrl}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40">
            <IconDownload />
          </button>
          {canDeleteItem?.(item) && (
            <button onClick={() => onRequestDelete?.(item)}
              title="Delete"
              className="p-2 rounded-lg bg-red-600/30 hover:bg-red-600/60 text-red-300 transition-colors">
              <IconTrash />
            </button>
          )}
          <button onClick={onClose} title="Close (Esc)"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <IconClose />
          </button>
        </div>
      </div>

      {/* media area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {total > 1 && (
          <button onClick={goPrev}
            className="absolute left-2 sm:left-4 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/10">
            <IconChevronLeft />
          </button>
        )}

        <div
          style={{
            opacity: fade ? 1 : 0,
            transform: fade ? "scale(1)" : "scale(0.96)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
          }}
          className="w-full h-full flex items-center justify-center px-14 sm:px-20 py-16"
        >
          {!currentUrl ? (
            <SyncetraLoader size="sm" />
          ) : isVideo ? (
            <video
              ref={videoRef}
              key={item._id}
              src={currentUrl}
              controls
              onEnded={() => { if (isPlaying) goNext(); }}
              className="max-h-full max-w-full rounded-xl shadow-2xl"
            />
          ) : (
            <ZoomableImage
              key={item._id}
              src={currentUrl}
              alt={item.caption || item.fileName || "media"}
              className="max-h-full max-w-full rounded-xl shadow-2xl object-contain"
            />
          )}
        </div>

        {total > 1 && (
          <button onClick={goNext}
            className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/10">
            <IconChevronRight />
          </button>
        )}
      </div>

      {/* bottom bar */}
      <div className="bg-gradient-to-t from-black/95 to-transparent absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 space-y-3">
        {/* caption */}
        {item.caption && (
          <p className="text-sm text-white/90 text-center">{item.caption}</p>
        )}

        {/* slideshow controls — only show when more than 1 item */}
        {total > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isPlaying
                  ? "bg-amber-500 hover:bg-amber-400 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isPlaying ? <><IconPause /> Pause</> : <><IconPlay /> Slideshow</>}
            </button>

            {!isVideo && (
              <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-xl border border-white/10">
                <span className="text-xs text-slate-400">Every</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={timerSec}
                  onChange={(e) => setTimerSec(Math.max(1, Number(e.target.value)))}
                  className="w-12 bg-transparent text-xs text-white text-center focus:outline-none"
                />
                <span className="text-xs text-slate-400">sec</span>
              </div>
            )}

            {isVideo && isPlaying && (
              <span className="text-xs text-slate-400 bg-black/50 px-3 py-2 rounded-xl border border-white/10">
                Auto-advance after video ends
              </span>
            )}

            {/* dot indicators */}
            <div className="flex gap-1.5 items-center">
              {items.slice(Math.max(0, index - 4), index + 5).map((m, i) => {
                const realI = Math.max(0, index - 4) + i;
                return (
                  <button
                    key={m._id}
                    onClick={() => { clearTimeout(timerRef.current); setFade(false); setTimeout(() => { setIndex(realI); setFade(true); }, 180); }}
                    className={`rounded-full transition-all ${realI === index ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Upload popups (unchanged) ────────────────────────────────────────────────
function Backdrop({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      {children}
    </div>
  );
}

function Row({ label, value, capitalize, muted }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs font-medium break-all ${muted ? "text-slate-500" : "text-slate-200"} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ConfirmUploadPopup({ tripName, category, caption, items, prepErrors, onConfirm, onCancel }) {
  const count = items.length;
  return (
    <Backdrop>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-slate-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Confirm Upload</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {count} file{count !== 1 ? "s" : ""} ready — review before uploading
          </p>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto">
            {items.map((item, i) => (
              <div key={`${item.fileName}-${i}`} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                {item.mediaType === "video" ? (
                  <video src={item.previewUrl} className="w-full h-16 object-cover bg-black" muted />
                ) : (
                  <ZoomableImage src={item.previewUrl} alt="" className="w-full h-16 object-cover" />
                )}
                <p className="text-[10px] text-slate-500 truncate px-1.5 py-1">{item.fileName}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Row label="Trip" value={tripName} />
            <Row label="Category" value={category} capitalize />
            {caption && <Row label="Caption" value={caption} />}
            <Row label="Files" value={`${count} selected`} />
          </div>
          {prepErrors?.length > 0 && (
            <div className="rounded-xl border border-amber-700/40 bg-amber-950/30 px-3 py-2 space-y-1">
              <p className="text-xs font-medium text-amber-400">Some files were skipped:</p>
              {prepErrors.map((msg) => (
                <p key={msg} className="text-[11px] text-amber-200/80">{msg}</p>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-3 shrink-0">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
            Upload {count} file{count !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function ProcessingPopup({ current = 0, total = 0, message, progress }) {
  const showProgress = total > 0;
  const overallPct = showProgress
    ? Math.round(((current - 1) * 100 + (progress ?? 0)) / total)
    : 0;
  return (
    <Backdrop>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xs shadow-2xl p-8 flex flex-col items-center gap-4">
        <SyncetraLoader size="md" />
        <div className="text-center">
          <p className="text-white font-medium">
            {showProgress ? `Uploading ${current} of ${total}…` : (message || "Processing…")}
          </p>
          <p className="text-xs text-slate-400 mt-1">Please wait, do not close this page</p>
          {showProgress && (
            <>
              <div className="mt-3 h-1.5 w-48 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{overallPct}%</p>
            </>
          )}
        </div>
      </div>
    </Backdrop>
  );
}

function SuccessPopup({ onClose }) {
  return (
    <MasterActionPopup master="gallery" action="add" open={true} onClose={onClose} />
  );
}

// ─── Main Gallery ─────────────────────────────────────────────────────────────
export default function TripGallery() {
  const { selectedTripId, selectedTrip, isAdmin } = useTrip();
  const userInfo  = useAppSelector((s) => s.user.userInfo);
  const userId    = userInfo?.user?._id ?? userInfo?.user?.id;
  const role      = userInfo?.user?.role;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryTab, setCategoryTab] = useState("all");
  const [category, setCategory] = useState("moments");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  // type filter dropdown
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  // category filter dropdown
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // user filter (multiselect — empty Set = all members)
  const [userFilters, setUserFilters] = useState(new Set());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // multiselect (super admin only)
  const [multiselect, setMultiselect] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [viewerState, setViewerState] = useState(null);
  const [popup, setPopup] = useState(null);
  const { confirmDelete, deleteModal } = useDeleteConfirm();
  const blobUrlsRef = useRef([]);

  const releaseBlobUrls = () => {
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) setTypeDropdownOpen(false);
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) setCategoryDropdownOpen(false);
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) setUserDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleUserFilter = (id) => {
    setUserFilters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const reloadMedia = useCallback(() => {
    if (!selectedTripId) return;
    setLoading(true);
    getMedia(selectedTripId, {}, isAdmin)
      .then((r) => { if (r !== null) setItems(r?.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTripId, isAdmin]);

  useEffect(() => {
    if (!selectedTripId) {
      setItems([]);
      return undefined;
    }
    let ignore = false;
    setLoading(true);
    getMedia(selectedTripId, {}, isAdmin)
      .then((r) => {
        if (!ignore && r !== null) setItems(r?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selectedTripId, isAdmin]);
  useOnlineReload(reloadMedia);

  // Unique uploaders derived from loaded items
  const uploaders = useMemo(() => {
    const map = {};
    items.forEach((m) => {
      if (m.uploadedBy && m.uploaderName) {
        map[String(m.uploadedBy)] = m.uploaderName;
      }
    });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Derived filtered list (used by both grid and viewer)
  const filtered = items.filter((m) => {
    if (typeFilter !== "all" && m.mediaType !== typeFilter) return false;
    if (userFilters.size > 0 && !userFilters.has(String(m.uploadedBy))) return false;
    if (categoryTab === "all") return true;
    if (categoryTab === "mine") return String(m.uploadedBy) === String(userId);
    return m.category === categoryTab;
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedTripId) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");

    if (files.length > MAX_BATCH_FILES) {
      setError(`You can upload up to ${MAX_BATCH_FILES} files at once.`);
      return;
    }

    const prepared = [];
    const prepErrors = [];

    for (const file of files) {
      try {
        const mediaType = validateFile(file);
        const previewUrl = URL.createObjectURL(file);
        blobUrlsRef.current.push(previewUrl);
        prepared.push({ file, previewUrl, mediaType, fileName: file.name });
      } catch (err) {
        prepErrors.push(`${file.name}: ${err.message || "Invalid file"}`);
      }
    }

    if (!prepared.length) {
      setError(prepErrors[0] || "No valid files selected");
      return;
    }

    setPopup({
      stage: "confirm",
      items: prepared,
      prepErrors: prepErrors.length ? prepErrors : undefined,
    });
  };

  const handleConfirmUpload = async () => {
    if (!popup || popup.stage !== "confirm" || !popup.items?.length) return;
    const { items } = popup;
    const uploadCategory = category;
    const uploadCaption = caption;

    let successCount = 0;
    const failures = [];

    for (let i = 0; i < items.length; i++) {
      const { file, mediaType, fileName } = items[i];
      setPopup({ stage: "uploading", current: i + 1, total: items.length, progress: 0 });
      try {
        // 1. Get a short-lived signed upload token from our backend
        const signRes = await signMediaUpload(selectedTripId, isAdmin);
        const signData = signRes?.data;
        if (!signData?.signature) throw new Error("Could not get upload token");

        // 2. Upload the file directly to Cloudinary (browser → CDN, no base64)
        const uploaded = await uploadToCloudinary(file, signData, (pct) => {
          setPopup({ stage: "uploading", current: i + 1, total: items.length, progress: pct });
        });

        // 3. Save the Cloudinary URL + publicId to our backend
        await addMedia(
          selectedTripId,
          {
            url:       uploaded.url,
            publicId:  uploaded.publicId,
            thumbUrl:  uploaded.thumbUrl,
            mediaType: uploaded.mediaType,
            category:  uploadCategory,
            caption:   uploadCaption,
            fileName:  uploaded.fileName,
          },
          isAdmin
        );
        successCount++;
      } catch (err) {
        failures.push(`${fileName}: ${err.message || "Upload failed"}`);
      }
    }

    releaseBlobUrls();
    setCaption("");

    if (successCount === 0) {
      setPopup(null);
      setError(failures[0] || "Upload failed");
      return;
    }

    reloadMedia();
    setPopup({
      stage: "success",
      category: uploadCategory,
      caption: uploadCaption,
      count: successCount,
      failed: failures.length ? failures : undefined,
    });
  };

  // Which items the current user is allowed to delete
  const canDeleteItem = useCallback((item) => {
    if (isSuperAdmin) return true;
    if (!isAdmin && String(item.uploadedBy) === String(userId)) return true;
    return false;
  }, [isSuperAdmin, isAdmin, userId]);

  const handleView = (item) => {
    if (multiselect) return;
    const idx = filtered.findIndex((m) => m._id === item._id);
    setViewerState({ startIndex: idx >= 0 ? idx : 0 });
  };

  const removeMediaFromList = (mediaId) => {
    setItems((prev) => prev.filter((m) => m._id !== mediaId));
  };

  const requestDeleteMedia = (item) => {
    if (!selectedTripId || !canDeleteItem(item)) return;
    confirmDelete({
      recordLabel: item.caption || item.fileName || "Media",
      onConfirm: async () => {
        try {
          await deleteMediaApi(selectedTripId, item._id, isAdmin);
          removeMediaFromList(item._id);
        } catch {
          setError("Delete failed");
          throw new Error("Delete failed");
        }
      },
    });
  };

  // Multiselect helpers (super admin only)
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m._id)));
    }
  };

  const exitMultiselect = () => {
    setMultiselect(false);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (!selectedIds.size) return;
    const count = selectedIds.size;
    confirmDelete({
      recordLabel: `${count} item${count !== 1 ? "s" : ""}`,
      onConfirm: async () => {
        const ids = [...selectedIds];
        let failed = 0;
        for (const id of ids) {
          try {
            await deleteMediaApi(selectedTripId, id, isAdmin);
            removeMediaFromList(id);
          } catch {
            failed++;
          }
        }
        exitMultiselect();
        if (failed) setError(`${failed} item${failed !== 1 ? "s" : ""} could not be deleted`);
      },
    });
  };

  return (
    <TripModuleShell title="Gallery" description="Upload and browse trip photos & videos" loading={loading && !!selectedTripId}>
      {selectedTripId && (
        <>
          {/* ── shared dropdown styles ── */}
          <style>{`
            @keyframes gal-drop-in{0%{opacity:0;transform:translateY(-10px) scale(.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
            @keyframes gal-row-in{0%{opacity:0;transform:translateX(-8px)}100%{opacity:1;transform:translateX(0)}}
            @keyframes gal-cb-pop{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.3) rotate(5deg)}100%{transform:scale(1) rotate(0deg)}}
          `}</style>

          {/* ── all filters + actions in one row ── */}
          <div className="flex flex-wrap items-center gap-2 mb-5">

            {/* ── Type filter dropdown ── */}
            {(() => {
              const TYPE_OPTS = [
                { value: "all",   label: "All Media", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, color: [99,102,241] },
                { value: "image", label: "Images",    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/></svg>, color: [16,185,129] },
                { value: "video", label: "Videos",    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>, color: [245,158,11] },
              ];
              const active = TYPE_OPTS.find((o) => o.value === typeFilter);
              const [r,g,b] = active.color;
              return (
                <div className="relative" ref={typeDropdownRef}>
                  <button onClick={() => { setTypeDropdownOpen((o)=>!o); setCategoryDropdownOpen(false); setUserDropdownOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200"
                    style={typeFilter !== "all" ? {
                      background: `linear-gradient(135deg,rgba(${r},${g},${b},.5),rgba(${r},${g},${b},.25))`,
                      border: `1.5px solid rgba(${r},${g},${b},.65)`,
                      color: `rgb(${Math.min(r+120,255)},${Math.min(g+120,255)},${Math.min(b+120,255)})`,
                      boxShadow: `0 0 18px 4px rgba(${r},${g},${b},.25)`,
                    } : { background:"rgba(15,23,42,.8)", border:"1.5px solid rgba(51,65,85,.7)", color:"#94a3b8" }}>
                    <span style={{ color: typeFilter !== "all" ? `rgb(${Math.min(r+120,255)},${Math.min(g+120,255)},${Math.min(b+120,255)})` : "#64748b" }}>{active.icon}</span>
                    {active.label}
                    <svg className="w-3 h-3 ml-1 transition-transform duration-300" style={{ transform: typeDropdownOpen?"rotate(180deg)":"rotate(0deg)", opacity:.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {typeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 z-50 rounded-3xl overflow-hidden" style={{ minWidth:220, background:"linear-gradient(160deg,rgba(10,14,35,.98),rgba(6,8,22,.99))", border:"1px solid rgba(99,102,241,.25)", boxShadow:"0 24px 80px rgba(0,0,0,.8),0 0 60px rgba(99,102,241,.08)", animation:"gal-drop-in .2s cubic-bezier(.34,1.4,.64,1) both" }}>
                      <div className="px-5 py-3.5" style={{ borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(99,102,241,.06)" }}>
                        <p className="text-[10px] font-black tracking-widest uppercase" style={{ background:"linear-gradient(90deg,#a5b4fc,#818cf8)", WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>Media Type</p>
                      </div>
                      {TYPE_OPTS.map(({ value, label, icon, color: [tr,tg,tb] }, idx) => {
                        const cnt = value === "all" ? items.length : items.filter((m) => m.mediaType === value).length;
                        const sel = typeFilter === value;
                        return (
                          <button key={value} onClick={() => { setTypeFilter(value); setTypeDropdownOpen(false); }}
                            className="w-full flex items-center gap-3.5 px-5 py-3.5 transition-all duration-150 text-left"
                            style={{ animation:`gal-row-in .15s ease ${idx*0.05}s both`, background: sel ? `linear-gradient(90deg,rgba(${tr},${tg},${tb},.2),rgba(${tr},${tg},${tb},.08))` : "transparent", borderBottom:"1px solid rgba(255,255,255,.03)" }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                              style={{ background: sel ? `linear-gradient(135deg,rgba(${tr},${tg},${tb},.5),rgba(${tr},${tg},${tb},.3))` : "rgba(15,23,42,.8)", border:`1px solid rgba(${tr},${tg},${tb},${sel?.5:.2})`, color: sel ? `rgb(${Math.min(tr+100,255)},${Math.min(tg+100,255)},${Math.min(tb+100,255)})` : "#475569", boxShadow: sel ? `0 0 14px 3px rgba(${tr},${tg},${tb},.4)` : "none" }}>
                              {icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold" style={{ color: sel ? `rgb(${Math.min(tr+130,255)},${Math.min(tg+130,255)},${Math.min(tb+130,255)})` : "#cbd5e1" }}>{label}</p>
                              <p className="text-[10px] mt-0.5" style={{ color:"#475569" }}>{cnt} item{cnt!==1?"s":""}</p>
                            </div>
                            {sel && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background:`rgba(${tr},${tg},${tb},.3)`, border:`1.5px solid rgba(${tr},${tg},${tb},.7)`, boxShadow:`0 0 10px rgba(${tr},${tg},${tb},.5)` }}>
                                <svg style={{ animation:"gal-cb-pop .2s ease both" }} className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Category filter dropdown ── */}
            {(() => {
              const CAT_OPTS = [
                { value:"all",     label:"All",        emoji:"◎", color:[99,102,241]  },
                { value:"mine",    label:"My Uploads",  emoji:"👤", color:[16,185,129] },
                { value:"food",    label:"Food",        emoji:"🍽",  color:[245,158,11] },
                { value:"travel",  label:"Travel",      emoji:"✈️",  color:[56,189,248]  },
                { value:"moments", label:"Moments",     emoji:"✨", color:[244,114,182] },
                { value:"other",   label:"Other",       emoji:"📁", color:[148,163,184] },
              ];
              const active = CAT_OPTS.find((o) => o.value === categoryTab) || CAT_OPTS[0];
              const [r,g,b] = active.color;
              return (
                <div className="relative" ref={categoryDropdownRef}>
                  <button onClick={() => { setCategoryDropdownOpen((o)=>!o); setTypeDropdownOpen(false); setUserDropdownOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200"
                    style={categoryTab !== "all" ? {
                      background: `linear-gradient(135deg,rgba(${r},${g},${b},.5),rgba(${r},${g},${b},.25))`,
                      border: `1.5px solid rgba(${r},${g},${b},.65)`,
                      color: `rgb(${Math.min(r+120,255)},${Math.min(g+120,255)},${Math.min(b+120,255)})`,
                      boxShadow: `0 0 18px 4px rgba(${r},${g},${b},.25)`,
                    } : { background:"rgba(15,23,42,.8)", border:"1.5px solid rgba(51,65,85,.7)", color:"#94a3b8" }}>
                    <span className="text-sm leading-none">{active.emoji}</span>
                    {active.label}
                    <svg className="w-3 h-3 ml-1 transition-transform duration-300" style={{ transform: categoryDropdownOpen?"rotate(180deg)":"rotate(0deg)", opacity:.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 z-50 rounded-3xl overflow-hidden" style={{ minWidth:220, background:"linear-gradient(160deg,rgba(10,14,35,.98),rgba(6,8,22,.99))", border:"1px solid rgba(99,102,241,.25)", boxShadow:"0 24px 80px rgba(0,0,0,.8),0 0 60px rgba(99,102,241,.08)", animation:"gal-drop-in .2s cubic-bezier(.34,1.4,.64,1) both" }}>
                      <div className="px-5 py-3.5" style={{ borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(99,102,241,.06)" }}>
                        <p className="text-[10px] font-black tracking-widest uppercase" style={{ background:"linear-gradient(90deg,#a5b4fc,#818cf8)", WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>Category</p>
                      </div>
                      {CAT_OPTS.map(({ value, label, emoji, color:[cr,cg,cb] }, idx) => {
                        const cnt = value==="all" ? items.length : value==="mine" ? items.filter((m)=>String(m.uploadedBy)===String(userId)).length : items.filter((m)=>m.category===value).length;
                        const sel = categoryTab === value;
                        return (
                          <button key={value} onClick={() => { setCategoryTab(value); setCategoryDropdownOpen(false); }}
                            className="w-full flex items-center gap-3.5 px-5 py-3 transition-all duration-150 text-left"
                            style={{ animation:`gal-row-in .15s ease ${idx*0.04}s both`, background: sel ? `linear-gradient(90deg,rgba(${cr},${cg},${cb},.2),rgba(${cr},${cg},${cb},.07))` : "transparent", borderBottom:"1px solid rgba(255,255,255,.03)" }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                              style={{ background: sel ? `rgba(${cr},${cg},${cb},.2)` : "rgba(15,23,42,.8)", border:`1px solid rgba(${cr},${cg},${cb},${sel?.5:.15})`, boxShadow: sel ? `0 0 14px 3px rgba(${cr},${cg},${cb},.35)` : "none", transition:"all .2s" }}>
                              {emoji}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold" style={{ color: sel ? `rgb(${Math.min(cr+130,255)},${Math.min(cg+130,255)},${Math.min(cb+130,255)})` : "#cbd5e1" }}>{label}</p>
                              <p className="text-[10px] mt-0.5" style={{ color:"#475569" }}>{cnt} item{cnt!==1?"s":""}</p>
                            </div>
                            {sel && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background:`rgba(${cr},${cg},${cb},.3)`, border:`1.5px solid rgba(${cr},${cg},${cb},.7)`, boxShadow:`0 0 10px rgba(${cr},${cg},${cb},.5)` }}>
                                <svg style={{ animation:"gal-cb-pop .2s ease both" }} className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

          {/* member filter dropdown — multiselect */}
          {uploaders.length > 1 && (() => {
            const maxCount = Math.max(...uploaders.map(({ id }) => items.filter((m) => String(m.uploadedBy) === id).length), 1);
            return (
            <div className="relative" ref={userDropdownRef}>
              <style>{`
                @keyframes gal-bar-fill{0%{width:0}100%{width:var(--bar-w)}}
                @keyframes gal-pulse-ring{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
              `}</style>

              {/* ── trigger button ── */}
              <button
                onClick={() => { setUserDropdownOpen((o) => !o); setTypeDropdownOpen(false); setCategoryDropdownOpen(false); }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200"
                style={userFilters.size > 0 ? {
                  background: "linear-gradient(135deg,rgba(79,70,229,.6) 0%,rgba(99,102,241,.4) 100%)",
                  border: "1.5px solid rgba(165,180,252,.55)",
                  color: "#e0e7ff",
                  boxShadow: "0 0 24px 6px rgba(99,102,241,.28), inset 0 1px 0 rgba(255,255,255,.08)",
                } : {
                  background: "rgba(15,23,42,.8)",
                  border: "1.5px solid rgba(51,65,85,.7)",
                  color: "#94a3b8",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
                }}
              >
                {userFilters.size > 0 ? (
                  <div className="flex -space-x-2">
                    {uploaders.filter((u) => userFilters.has(u.id)).slice(0, 4).map(({ id, name }) => {
                      const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
                      return (
                        <div key={id}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                          style={{ background: `linear-gradient(135deg,hsl(${hue},75%,52%),hsl(${hue},85%,36%))`, border: "1.5px solid rgba(0,0,0,.5)" }}>
                          {name[0].toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: .65 }}>
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                )}
                <span className="tracking-wide">
                  {userFilters.size === 0 ? "All Members"
                    : userFilters.size === 1 ? uploaders.find((u) => userFilters.has(u.id))?.name.split(" ")[0]
                    : `${userFilters.size} Members`}
                </span>
                {userFilters.size > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                    style={{ background: "rgba(99,102,241,.4)", color: "#c7d2fe", border: "1px solid rgba(165,180,252,.3)" }}>
                    {userFilters.size}
                  </span>
                )}
                <svg className="w-3.5 h-3.5 ml-1 transition-transform duration-300"
                  style={{ transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: .5 }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* ── dropdown panel ── */}
              {userDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 rounded-3xl overflow-hidden"
                  style={{
                    minWidth: 300,
                    background: "linear-gradient(160deg,rgba(10,14,35,.98) 0%,rgba(6,8,22,.99) 100%)",
                    border: "1px solid rgba(99,102,241,.3)",
                    boxShadow: "0 24px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(99,102,241,.1), 0 0 60px rgba(99,102,241,.1)",
                    animation: "gal-drop-in .22s cubic-bezier(.34,1.4,.64,1) both",
                  }}>

                  {/* header */}
                  <div className="relative px-5 py-4 flex items-center justify-between overflow-hidden"
                    style={{ borderBottom: "1px solid rgba(99,102,241,.15)" }}>
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(135deg,rgba(99,102,241,.12) 0%,transparent 60%)" }} />
                    <div className="relative flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,rgba(99,102,241,.5),rgba(67,56,202,.4))", border: "1px solid rgba(129,140,248,.3)" }}>
                        <svg className="w-3.5 h-3.5 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-widest uppercase"
                          style={{ background: "linear-gradient(90deg,#a5b4fc,#818cf8)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          Filter by Member
                        </p>
                        <p className="text-[9px] text-slate-600 mt-0.5">{uploaders.length} contributors</p>
                      </div>
                    </div>
                    {userFilters.size > 0 && (
                      <button onClick={() => setUserFilters(new Set())}
                        className="relative flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: "rgba(239,68,68,.12)", color: "#f87171", border: "1px solid rgba(239,68,68,.25)" }}>
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  {/* select all */}
                  <button
                    onClick={() => setUserFilters(userFilters.size === uploaders.length ? new Set() : new Set(uploaders.map((u) => u.id)))}
                    className="w-full flex items-center gap-3 px-5 py-3 transition-all duration-150"
                    style={{
                      background: userFilters.size === uploaders.length
                        ? "linear-gradient(90deg,rgba(99,102,241,.18),rgba(67,56,202,.08))"
                        : "transparent",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                    }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200"
                      style={{
                        background: userFilters.size === uploaders.length ? "linear-gradient(135deg,#6366f1,#4338ca)" : "rgba(15,23,42,1)",
                        border: userFilters.size === uploaders.length ? "1.5px solid #818cf8" : "1.5px solid rgba(71,85,105,.5)",
                        boxShadow: userFilters.size === uploaders.length ? "0 0 12px 3px rgba(99,102,241,.5)" : "none",
                      }}>
                      {userFilters.size === uploaders.length && (
                        <svg style={{ animation: "gal-cb-pop .2s ease both" }} className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-bold" style={{ color: userFilters.size === uploaders.length ? "#a5b4fc" : "#64748b" }}>
                      Select All Members
                    </span>
                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(30,41,59,.8)", color: "#475569", border: "1px solid rgba(71,85,105,.3)" }}>
                      {uploaders.length}
                    </span>
                  </button>

                  {/* member rows */}
                  <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
                    {uploaders.map(({ id, name }, idx) => {
                      const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
                      const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                      const checked = userFilters.has(id);
                      const uploadCount = items.filter((m) => String(m.uploadedBy) === id).length;
                      const barPct = Math.round((uploadCount / maxCount) * 100);
                      return (
                        <button key={id} onClick={() => toggleUserFilter(id)}
                          className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left transition-all duration-200"
                          style={{
                            animation: `gal-row-in .18s ease ${idx * 0.04}s both`,
                            background: checked
                              ? `linear-gradient(90deg,hsl(${hue},60%,18%,.6),hsl(${hue},50%,12%,.3))`
                              : "transparent",
                            borderBottom: "1px solid rgba(255,255,255,.03)",
                          }}>

                          {/* avatar with ring */}
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white"
                              style={{
                                background: `linear-gradient(135deg,hsl(${hue},75%,48%) 0%,hsl(${hue},85%,30%) 100%)`,
                                boxShadow: checked
                                  ? `0 0 0 2px hsl(${hue},75%,55%), 0 0 20px 4px hsl(${hue},70%,40%,.6)`
                                  : `0 0 0 1.5px hsl(${hue},50%,30%,.4)`,
                                transition: "box-shadow .25s",
                              }}>
                              {initials}
                            </div>
                            {checked && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: `hsl(${hue},70%,48%)`, border: "1.5px solid rgba(6,8,22,1)", boxShadow: `0 0 8px hsl(${hue},70%,40%,.8)` }}>
                                <svg style={{ animation: "gal-cb-pop .22s ease both" }} className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* name + upload bar */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate mb-1.5 transition-colors"
                              style={{ color: checked ? `hsl(${hue},80%,82%)` : "#e2e8f0" }}>
                              {name}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(30,41,59,.8)" }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${barPct}%`,
                                    background: checked
                                      ? `linear-gradient(90deg,hsl(${hue},80%,55%),hsl(${hue},70%,42%))`
                                      : `linear-gradient(90deg,rgba(71,85,105,.6),rgba(51,65,85,.4))`,
                                    boxShadow: checked ? `0 0 6px hsl(${hue},70%,45%,.7)` : "none",
                                  }} />
                              </div>
                              <span className="text-[10px] font-semibold shrink-0"
                                style={{ color: checked ? `hsl(${hue},70%,70%)` : "#475569" }}>
                                {uploadCount}
                              </span>
                            </div>
                          </div>

                          {/* toggle pill */}
                          <div className="shrink-0 w-10 h-5 rounded-full transition-all duration-250 relative"
                            style={{
                              background: checked
                                ? `linear-gradient(135deg,hsl(${hue},70%,48%),hsl(${hue},80%,35%))`
                                : "rgba(30,41,59,1)",
                              border: checked ? `1px solid hsl(${hue},70%,60%)` : "1px solid rgba(71,85,105,.4)",
                              boxShadow: checked ? `0 0 14px 3px hsl(${hue},70%,40%,.55)` : "none",
                            }}>
                            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-250"
                              style={{
                                left: checked ? "calc(100% - 18px)" : 2,
                                background: checked ? "#fff" : "rgba(71,85,105,.6)",
                                boxShadow: checked ? "0 1px 4px rgba(0,0,0,.4)" : "none",
                              }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* footer */}
                  <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(99,102,241,.12)", background: "rgba(99,102,241,.04)" }}>
                    {userFilters.size > 0 ? (
                      <button onClick={() => setUserDropdownOpen(false)}
                        className="w-full py-2.5 rounded-2xl text-xs font-black text-white tracking-wide transition-all"
                        style={{
                          background: "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)",
                          boxShadow: "0 0 24px 6px rgba(99,102,241,.35), inset 0 1px 0 rgba(255,255,255,.15)",
                        }}>
                        ✦ Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                      </button>
                    ) : (
                      <p className="text-center text-[10px] text-slate-700">Select members to filter</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );})()}

            {/* ── item count + multiselect ── */}
            <span className="ml-auto text-xs font-semibold" style={{ color:"#475569" }}>
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </span>
            {isSuperAdmin && filtered.length > 0 && !multiselect && (
              <button onClick={() => setMultiselect(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200"
                style={{ background:"rgba(15,23,42,.8)", border:"1.5px solid rgba(51,65,85,.7)", color:"#94a3b8" }}>
                <IconCheck /> Select
              </button>
            )}
            {isSuperAdmin && multiselect && (
              <div className="flex items-center gap-2">
                <button onClick={toggleSelectAll}
                  className="px-3 py-2 rounded-2xl text-xs font-bold transition-colors"
                  style={{ background:"rgba(30,41,59,.9)", border:"1px solid rgba(71,85,105,.5)", color:"#cbd5e1" }}>
                  {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
                </button>
                <button onClick={exitMultiselect}
                  className="px-3 py-2 rounded-2xl text-xs font-bold transition-colors"
                  style={{ background:"rgba(15,23,42,.8)", border:"1px solid rgba(51,65,85,.4)", color:"#64748b" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>{/* end all-filters row */}

          {/* upload section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            {/* size limit note */}
            <div style={{
              background: "linear-gradient(135deg,rgba(15,23,42,1) 0%,rgba(10,14,35,1) 100%)",
              border: "1px solid rgba(99,102,241,.35)",
              borderRadius: 14,
              overflow: "hidden",
            }}>
              {/* header bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px",
                background: "rgba(99,102,241,.1)",
                borderBottom: "1px solid rgba(99,102,241,.18)",
              }}>
                <svg style={{ color:"#818cf8", flexShrink:0 }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#a5b4fc", letterSpacing: ".04em" }}>
                  Upload Limits
                </span>
              </div>
              {/* cards row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "14px 16px" }}>
                {[
                  { emoji: "🖼️", label: "Images",     value: `${MAX_IMAGE_MB} MB max`,        sub: "JPG · PNG · GIF · WebP", accent: [52,211,153]  },
                  { emoji: "🎬", label: "Videos",     value: `${MAX_VIDEO_MB} MB max`,        sub: "MP4 · WebM · MOV",       accent: [251,191,36]  },
                  { emoji: "📂", label: "Batch size", value: `${MAX_BATCH_FILES} files max`,  sub: "per upload session",     accent: [129,140,248] },
                ].map(({ emoji, label, value, sub, accent: [r,g,b] }) => (
                  <div key={label} style={{
                    flex: "1 1 140px",
                    background: `rgba(${r},${g},${b},.07)`,
                    border: `1px solid rgba(${r},${g},${b},.25)`,
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>{label}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 900, color: `rgb(${r},${g},${b})`, marginBottom: 3 }}>
                      {value}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b" }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SearchableSelect
                value={category}
                onChange={setCategory}
                options={GALLERY_CATEGORY_OPTIONS}
                searchable={false}
                searchThreshold={99}
              />
              <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200" />
            </div>
            <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-600 hover:bg-slate-950/50 transition-colors">
              <span className="text-3xl mb-2">📤</span>
              <span className="text-sm font-medium text-emerald-400">Tap to upload images or videos</span>
              <span className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, WebP, MP4, WebM — select multiple files</span>
              <input ref={fileInputRef} type="file" multiple
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                className="hidden" onChange={handleFileSelect} />
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {/* grid */}
          {filtered.length === 0 ? (
            <p className="text-slate-500 text-sm">No media found for this filter.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((m) => (
                <MediaTile
                  key={m._id}
                  item={m}
                  canDelete={canDeleteItem(m)}
                  onView={handleView}
                  onDelete={requestDeleteMedia}
                  isMultiselect={multiselect}
                  isSelected={selectedIds.has(m._id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}

          {/* floating batch delete bar (super admin multiselect) */}
          {isSuperAdmin && multiselect && selectedIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-red-700/50 shadow-2xl"
              style={{ background: "rgba(10,5,5,0.95)", backdropFilter: "blur(12px)" }}>
              <span className="text-sm font-semibold text-white">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
              >
                <IconTrash /> Delete {selectedIds.size === filtered.length ? "All" : "Selected"}
              </button>
            </div>
          )}
        </>
      )}

      {/* fullscreen viewer */}
      {viewerState && (
        <MediaViewer
          items={filtered}
          startIndex={viewerState.startIndex}
          tripId={selectedTripId}
          isAdmin={isAdmin}
          canDeleteItem={canDeleteItem}
          onClose={() => setViewerState(null)}
          onRequestDelete={requestDeleteMedia}
        />
      )}

      {/* upload popups */}
      {popup?.stage === "confirm" && (
        <ConfirmUploadPopup
          tripName={selectedTrip?.tripName || "Selected Trip"}
          category={category}
          caption={caption}
          items={popup.items}
          prepErrors={popup.prepErrors}
          onConfirm={handleConfirmUpload}
          onCancel={() => { releaseBlobUrls(); setPopup(null); }}
        />
      )}
      {popup?.stage === "uploading" && (
        <ProcessingPopup
          current={popup.current || 0}
          total={popup.total || 0}
          progress={popup.progress}
          message={popup.message}
        />
      )}
      {popup?.stage === "success" && (
        <SuccessPopup
          tripName={selectedTrip?.tripName || "Selected Trip"}
          category={popup.category}
          caption={popup.caption}
          count={popup.count}
          failed={popup.failed}
          onClose={() => setPopup(null)}
        />
      )}
      {deleteModal}
    </TripModuleShell>
  );
}
