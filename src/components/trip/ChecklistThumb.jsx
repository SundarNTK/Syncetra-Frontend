import { useEffect, useState } from "react";
import { getChecklistItem } from "../../services/trips";

/** Thumbnail for checklist rows; loads full image when list omits large data URLs. */
export function ChecklistThumb({ tripId, item, isAdmin = true, className = "max-w-full max-h-full object-contain p-0.5" }) {
  const [src, setSrc] = useState(item?.imageUrl || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item?.imageUrl) {
      setSrc(item.imageUrl);
      return undefined;
    }
    if (!item?.hasImage || !item?._id || !tripId) {
      setSrc("");
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    getChecklistItem(tripId, item._id, isAdmin)
      .then((r) => {
        if (!cancelled) setSrc(r?.data?.imageUrl || "");
      })
      .catch(() => {
        if (!cancelled) setSrc("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, item?._id, item?.imageUrl, item?.hasImage, isAdmin]);

  if (src) return <img src={src} alt="" className={className} />;
  if (loading || item?.hasImage) return <span className="text-xs text-slate-500">…</span>;
  return <span className="text-xl text-slate-600">📦</span>;
}
