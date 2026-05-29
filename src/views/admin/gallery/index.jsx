import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getMedia, getMediaItem, addMedia, deleteMedia as deleteMediaApi } from "../../../services/trips";
import { fileToDataUrl } from "../../../utils/fileToDataUrl";

const CATEGORY_TABS = ["all", "mine", "food", "travel", "moments", "other"];
const CATEGORIES = ["food", "travel", "moments", "other"];
const TYPE_FILTERS = [
  { value: "all", label: "All Media" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

const toTitleCase = (text = "") =>
  String(text)
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

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

// ─── MediaTile ────────────────────────────────────────────────────────────────
function MediaTile({ item, onView, isAdmin, onDelete }) {
  const isVideo = item.mediaType === "video";
  return (
    <div className="group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative">
      {isVideo ? (
        <video src={item.url} className="w-full h-40 object-cover bg-black" preload="metadata" />
      ) : (
        <img src={item.url} alt={item.caption || item.fileName || "media"} className="w-full h-40 object-cover" />
      )}

      {/* hover overlay */}
      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button onClick={() => onView(item)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/25 text-white text-xs font-medium border border-white/20 backdrop-blur-sm transition-colors">
          <IconEye /> View
        </button>
        <button onClick={() => downloadMedia(item.url, item.fileName || `media-${item._id}`)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-medium backdrop-blur-sm transition-colors">
          <IconDownload /> Save
        </button>
        {isAdmin && (
          <button onClick={() => onDelete(item)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/70 hover:bg-red-600 text-white text-xs font-medium backdrop-blur-sm transition-colors">
            <IconTrash /> Delete
          </button>
        )}
      </div>

      <div className="p-2 space-y-1">
        <p className="text-xs text-slate-300 truncate">{item.caption || item.fileName || item.category}</p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-500 capitalize">{item.mediaType} · {item.category}</p>
          <div className="flex gap-1">
            <button onClick={() => onView(item)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><IconEye /></button>
            <button onClick={() => downloadMedia(item.url, item.fileName || `media-${item._id}`)} className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"><IconDownload /></button>
            {isAdmin && (
              <button onClick={() => onDelete(item)} className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"><IconTrash /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MediaViewer (fullscreen slider) ─────────────────────────────────────────
function MediaViewer({ items, startIndex, isAdmin, onClose, onRequestDelete }) {
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
  }, [item?._id]);

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
          {isAdmin && (
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
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-slate-700 border-t-white animate-spin" />
              <p className="text-slate-500 text-xs">Loading…</p>
            </div>
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
            <img
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

function ConfirmUploadPopup({ tripName, category, caption, previewUrl, mediaType, fileName, onConfirm, onCancel }) {
  const isVideo = mediaType === "video";
  return (
    <Backdrop>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Confirm Upload</h2>
          <p className="text-xs text-slate-400 mt-0.5">Review details before uploading</p>
        </div>
        <div className="p-5 space-y-4">
          {isVideo
            ? <video src={previewUrl} controls className="w-full h-44 object-cover rounded-xl bg-black" />
            : <img src={previewUrl} alt="preview" className="w-full h-44 object-cover rounded-xl" />}
          <div className="space-y-2">
            <Row label="Trip" value={tripName} />
            <Row label="Category" value={category} capitalize />
            {caption && <Row label="Caption" value={caption} />}
            <Row label="File" value={fileName} muted />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">Upload</button>
        </div>
      </div>
    </Backdrop>
  );
}

function ProcessingPopup() {
  return (
    <Backdrop>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xs shadow-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
        <div className="text-center">
          <p className="text-white font-medium">Uploading…</p>
          <p className="text-xs text-slate-400 mt-1">Please wait, do not close this page</p>
        </div>
      </div>
    </Backdrop>
  );
}

function SuccessPopup({ tripName, category, caption, onClose }) {
  return (
    <Backdrop>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Uploaded Successfully!</h2>
            <p className="text-sm text-slate-400 mt-1">Your media has been added to the gallery</p>
          </div>
          <div className="w-full bg-slate-800 rounded-xl p-4 text-left space-y-2 mt-1">
            <Row label="Trip" value={tripName} />
            <Row label="Category" value={category} capitalize />
            {caption && <Row label="Caption" value={caption} />}
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">Done</button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── Main Gallery ─────────────────────────────────────────────────────────────
export default function TripGallery() {
  const { selectedTripId, selectedTrip, isAdmin } = useTrip();
  const userId = useAppSelector((s) => s.user.userInfo?.user?.id);
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryTab, setCategoryTab] = useState("all");
  const [category, setCategory] = useState("moments");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  const [viewerState, setViewerState] = useState(null); // { startIndex }
  const [popup, setPopup] = useState(null);
  // popup stages: 'confirm' | 'uploading' | 'success'
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  const reloadMedia = useCallback(() => {
    if (!selectedTripId) return;
    getMedia(selectedTripId, {}, isAdmin)
      .then((r) => setItems(r?.data || []))
      .catch(() => setItems([]));
  }, [selectedTripId, isAdmin]);

  useEffect(() => {
    if (!selectedTripId) {
      setItems([]);
      return undefined;
    }
    let ignore = false;
    getMedia(selectedTripId, {}, isAdmin)
      .then((r) => {
        if (!ignore) setItems(r?.data || []);
      })
      .catch(() => {
        if (!ignore) setItems([]);
      });
    return () => {
      ignore = true;
    };
  }, [selectedTripId, isAdmin]);

  // Derived filtered list (used by both grid and viewer)
  const filtered = items.filter((m) => {
    if (typeFilter !== "all" && m.mediaType !== typeFilter) return false;
    if (categoryTab === "all") return true;
    if (categoryTab === "mine") return String(m.uploadedBy) === String(userId);
    return m.category === categoryTab;
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTripId) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
    try {
      const { dataUrl, thumbUrl, mediaType, fileName } = await fileToDataUrl(file);
      setPopup({ stage: "confirm", dataUrl, thumbUrl, mediaType, fileName });
    } catch (err) {
      setError(err.message || "Invalid file");
    }
  };

  const handleConfirmUpload = async () => {
    if (!popup || popup.stage !== "confirm") return;
    const { dataUrl, thumbUrl, mediaType, fileName } = popup;
    const uploadCategory = category;
    const uploadCaption = caption;
    setPopup({ stage: "uploading" });
    try {
      await addMedia(selectedTripId, { url: dataUrl, thumbUrl: thumbUrl || "", mediaType, category: uploadCategory, caption: uploadCaption, fileName }, isAdmin);
      setCaption("");
      reloadMedia();
      setPopup({ stage: "success", category: uploadCategory, caption: uploadCaption });
    } catch (err) {
      setPopup(null);
      setError(err.message || "Upload failed");
    }
  };

  const handleView = (item) => {
    const idx = filtered.findIndex((m) => m._id === item._id);
    setViewerState({ startIndex: idx >= 0 ? idx : 0 });
  };

  const removeMediaFromList = (mediaId) => {
    setItems((prev) => prev.filter((m) => m._id !== mediaId));
  };

  const requestDeleteMedia = (item) => {
    if (!selectedTripId || !isAdmin) return;
    confirmDelete({
      recordLabel: item.caption || item.fileName || "Media",
      onConfirm: async () => {
        try {
          await deleteMediaApi(selectedTripId, item._id);
          removeMediaFromList(item._id);
        } catch {
          setError("Delete failed");
          throw new Error("Delete failed");
        }
      },
    });
  };

  return (
    <TripModuleShell title="Gallery" description="Upload and browse trip photos & videos">
      {selectedTripId && (
        <>
          {/* type filter */}
          <div className="flex items-center gap-2 mb-3">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === f.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-500">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* category tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORY_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setCategoryTab(t)}
                className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${
                  categoryTab === t ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {t === "mine" ? "My uploads" : t}
              </button>
            ))}
          </div>

          {/* upload section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            <p className="text-sm text-slate-400">Choose image (max 4 MB) or video (max 10 MB). Set category and caption first.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200">
                {CATEGORIES.map((c) => <option key={c} value={c}>{toTitleCase(c)}</option>)}
              </select>
              <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200" />
            </div>
            <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-600 hover:bg-slate-950/50 transition-colors">
              <span className="text-3xl mb-2">📤</span>
              <span className="text-sm font-medium text-emerald-400">Tap to upload image or video</span>
              <span className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, WebP, MP4, WebM</span>
              <input ref={fileInputRef} type="file"
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
                  isAdmin={isAdmin}
                  onView={handleView}
                  onDelete={requestDeleteMedia}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* fullscreen viewer */}
      {viewerState && (
        <MediaViewer
          items={filtered}
          startIndex={viewerState.startIndex}
          isAdmin={isAdmin}
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
          previewUrl={popup.dataUrl}
          mediaType={popup.mediaType}
          fileName={popup.fileName}
          onConfirm={handleConfirmUpload}
          onCancel={() => setPopup(null)}
        />
      )}
      {popup?.stage === "uploading" && <ProcessingPopup />}
      {popup?.stage === "success" && (
        <SuccessPopup
          tripName={selectedTrip?.tripName || "Selected Trip"}
          category={popup.category}
          caption={popup.caption}
          onClose={() => setPopup(null)}
        />
      )}
      {deleteModal}
    </TripModuleShell>
  );
}
