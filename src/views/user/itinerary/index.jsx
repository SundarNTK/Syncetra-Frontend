import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";

const fmt12h = (t) => {
  if (!t) return "";
  const [hs, ms] = t.split(":");
  const h24 = parseInt(hs, 10); const m = parseInt(ms, 10);
  const ap = h24 >= 12 ? "PM" : "AM";
  return `${h24 % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
};
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getItinerary } from "../../../services/trips";
import ZoomableImage from "../../../components/ui/ZoomableImage";

/* ─── ImagePreview ─────────────────────────────────────────────────────────── */
function ImagePreview({ src, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <ZoomableImage src={src} alt="Preview" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
        <button type="button" onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ─── UserTimelineCard ─────────────────────────────────────────────────────── */
function UserTimelineCard({ item, index, total, onPreview }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-9 h-9 rounded-full bg-emerald-600/20 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
          {item.sequenceOrder}
        </div>
        {index < total - 1 && <div className="w-0.5 flex-1 bg-slate-700/60 mt-1" />}
      </div>

      <div className="flex-1 pb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3">
            <p className="font-semibold text-white">{item.pointName}</p>
            {item.locationName && <p className="text-xs text-slate-400 mt-0.5">{item.locationName}</p>}
            <div className="flex flex-wrap gap-3 mt-1.5">
              {item.visitDate && (
                <span className="text-xs text-emerald-400/80">
                  📅 {new Date(item.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              {item.visitTime && <span className="text-xs text-emerald-400/80">🕐 {fmt12h(item.visitTime)}</span>}
              {item.duration && <span className="text-xs text-slate-400">⏱ {item.duration}</span>}
            </div>
          </div>

          {item.images?.length > 0 && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-4 gap-1.5">
                {item.images.slice(0, 4).map((src, i) => (
                  <button key={i} type="button" onClick={() => onPreview(src)}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-950 cursor-zoom-in">
                    <ZoomableImage src={src} alt={`photo-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              {item.images.length > 4 && (
                <p className="text-[10px] text-slate-500 mt-1">+{item.images.length - 4} more</p>
              )}
            </div>
          )}

          {(item.description || item.notes || item.location?.url) && (
            <>
              <button type="button" onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2 border-t border-slate-800 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <span>{expanded ? "Hide details" : "Show details"}</span>
                <span>{expanded ? "▲" : "▼"}</span>
              </button>
              {expanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-800/50">
                  {item.description && <p className="text-sm text-slate-300 pt-3">{item.description}</p>}
                  {item.notes && (
                    <div className="px-3 py-2 rounded-lg bg-amber-900/10 border border-amber-700/20">
                      <p className="text-[10px] text-amber-400 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-xs text-slate-300">{item.notes}</p>
                    </div>
                  )}
                  {item.location?.url && (
                    <a href={item.location.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                      📍 View on Google Maps ↗
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── UserItinerary ────────────────────────────────────────────────────────── */
export default function UserItinerary() {
  const { selectedTripId } = useTrip();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const r = await getItinerary(selectedTripId, false);
      setItems((r?.data || []).slice().sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0)));
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setItems([]); return; }
    load();
  }, [selectedTripId, load]);

  return (
    <TripModuleShell title="Itinerary" description="Trip schedule & route points" loading={loading && !!selectedTripId}>
      {previewImg && <ImagePreview src={previewImg} onClose={() => setPreviewImg(null)} />}

      {selectedTripId && (
        items.length === 0 ? (
          <div className="text-center py-14 text-slate-500">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-sm">No itinerary published yet for this trip.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {items.map((item, idx) => (
              <UserTimelineCard
                key={item._id}
                item={item}
                index={idx}
                total={items.length}
                onPreview={setPreviewImg}
              />
            ))}
          </div>
        )
      )}
    </TripModuleShell>
  );
}
