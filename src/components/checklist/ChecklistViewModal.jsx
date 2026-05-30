import { useEffect, useState } from "react";
import { formatChecklistAssignees } from "../ui/MemberMultiSelect";
import { getChecklistItem } from "../../services/trips";
import ZoomableImage from "../ui/ZoomableImage";

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function ChecklistViewModal({ tripId, item, tripMembers = [], isAdmin = true, onClose }) {
  const [detail, setDetail] = useState(item);
  const [loading, setLoading] = useState(Boolean(item?.hasImage && !item?.imageUrl));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!tripId || !item?._id) return;
    if (item.imageUrl || !item.hasImage) {
      setDetail(item);
      setLoading(false);
      return;
    }
    setLoading(true);
    getChecklistItem(tripId, item._id, isAdmin)
      .then((r) => setDetail(r?.data || item))
      .catch(() => setDetail(item))
      .finally(() => setLoading(false));
  }, [tripId, item, isAdmin]);

  const assigneeLabel = formatChecklistAssignees(detail, tripMembers);
  const packedNames = (detail?.packedBy || [])
    .map((p) => (p && typeof p === "object" ? p.name || p.email : null))
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h2 className="font-semibold text-emerald-400">Checklist item</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <IconClose />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-4 min-h-[160px] max-h-[360px]">
            {loading ? (
              <span className="text-slate-500 text-sm">Loading image…</span>
            ) : detail?.imageUrl ? (
              <ZoomableImage
                src={detail.imageUrl}
                alt="Checklist item"
                className="max-w-full max-h-[320px] w-auto h-auto object-contain rounded-md shadow-lg"
              />
            ) : (
              <span className="text-4xl text-slate-600">📦</span>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Item</p>
            <p className="text-lg font-medium text-white">{detail?.item}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Assignee</p>
              <p className="text-slate-200">{assigneeLabel}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Packed by</p>
              <p className="text-slate-200">{packedNames.length ? packedNames.join(", ") : "—"}</p>
            </div>
          </div>
          {detail?.description ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{detail.description}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No description provided.</p>
          )}
        </div>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
