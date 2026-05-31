import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { ChecklistThumb } from "../../../components/trip/ChecklistThumb";
import ChecklistViewModal from "../../../components/checklist/ChecklistViewModal";
import SyncCheckbox from "../../../components/ui/SyncCheckbox";
import { getChecklists, toggleChecklist } from "../../../services/trips";

function userIdFromPackedEntry(p) {
  if (p == null) return "";
  if (typeof p === "object" && p._id != null) return String(p._id);
  return String(p);
}

function isPackedForUser(packedBy, myId) {
  if (!myId || !packedBy?.length) return false;
  return packedBy.some((p) => userIdFromPackedEntry(p) === String(myId));
}

function patchPackedBy(packedBy, myId, shouldBePacked) {
  const id = String(myId);
  const list = packedBy || [];
  const has = list.some((p) => userIdFromPackedEntry(p) === id);
  if (shouldBePacked && !has) return [...list, { _id: myId }];
  if (!shouldBePacked && has) return list.filter((p) => userIdFromPackedEntry(p) !== id);
  return list;
}

function ChecklistRow({ row, packed, tripId, onTogglePacked, onViewDescription }) {
  const hasDescription = Boolean(row.description && String(row.description).trim());
  const hasImage = Boolean(row.imageUrl || row.hasImage);
  const showView = hasDescription || hasImage;

  return (
    <li
      className={`rounded-xl overflow-hidden border transition-colors duration-200 ${
        packed
          ? "checklist-row-packed border-emerald-700/40"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="flex gap-3 items-center p-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950 flex items-center justify-center">
          <ChecklistThumb tripId={tripId} item={row} isAdmin={false} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-sm leading-snug transition-colors ${
              packed ? "text-emerald-100/90 line-through decoration-emerald-600/50" : "text-slate-100"
            }`}
          >
            {row.item}
          </p>
          {showView && (
            <button
              type="button"
              onClick={() => onViewDescription(row)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 mt-1 font-medium"
            >
              View description
            </button>
          )}
        </div>
        <label className="shrink-0 flex flex-col items-center gap-1.5 select-none cursor-pointer py-1">
          <SyncCheckbox
            checked={packed}
            onChange={onTogglePacked}
            className="sync-checkbox-lg"
            aria-label={packed ? "Mark as not packed" : "Mark as packed"}
          />
          <span className={`checklist-packed-label ${packed ? "is-packed" : ""}`}>
            {packed ? "Packed" : "Pack"}
          </span>
        </label>
      </div>
    </li>
  );
}

export default function UserChecklist() {
  const { selectedTripId } = useTrip();
  const { userInfo } = useAppSelector((s) => s.user);
  const myId = useMemo(() => userInfo?.user?._id || userInfo?.user?.id || "", [userInfo]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [viewItem, setViewItem] = useState(null);
  const inFlightRef = useRef(new Set());

  useEffect(() => {
    if (!selectedTripId) {
      setItems([]);
      return undefined;
    }
    let ignore = false;
    setLoadError("");
    setLoading(true);
    getChecklists(selectedTripId, false)
      .then((r) => {
        if (!ignore) setItems(r?.data || []);
      })
      .catch((err) => {
        if (!ignore) {
          setItems([]);
          setLoadError(err.message || "Could not load checklist");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selectedTripId]);

  const handleTogglePacked = (itemId) => {
    if (!selectedTripId || !myId || inFlightRef.current.has(itemId)) return;

    const item = items.find((c) => c._id === itemId);
    if (!item) return;

    const wasPacked = isPackedForUser(item.packedBy, myId);
    const nextPacked = !wasPacked;
    const snapshot = items;

    setItems((list) =>
      list.map((c) =>
        c._id === itemId ? { ...c, packedBy: patchPackedBy(c.packedBy, myId, nextPacked) } : c
      )
    );

    inFlightRef.current.add(itemId);
    toggleChecklist(selectedTripId, itemId, false)
      .catch((err) => {
        setItems(snapshot);
        alert(err.message || "Could not update checklist");
      })
      .finally(() => {
        inFlightRef.current.delete(itemId);
      });
  };

  const totalCount   = items.length;
  const checkedCount = items.filter((c) => isPackedForUser(c.packedBy, myId)).length;
  const pendingCount = totalCount - checkedCount;

  return (
    <TripModuleShell title="Checklist" description="Mark items you have packed" loading={loading && !!selectedTripId}>
      {loadError ? <p className="text-sm text-red-400 mb-3">{loadError}</p> : null}

      {selectedTripId && totalCount > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-200">{totalCount}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Total</p>
          </div>
          <div className="bg-emerald-700/10 border border-emerald-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{checkedCount}</p>
            <p className="text-[10px] text-emerald-600/70 uppercase tracking-wider mt-0.5">Packed</p>
          </div>
          <div className="bg-amber-700/10 border border-amber-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
            <p className="text-[10px] text-amber-600/70 uppercase tracking-wider mt-0.5">Remaining</p>
          </div>
        </div>
      )}

      {!selectedTripId ? null : items.length === 0 && !loadError ? (
        <p className="text-slate-500 text-sm">No checklist items for you on this trip.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <ChecklistRow
              key={c._id}
              row={c}
              packed={isPackedForUser(c.packedBy, myId)}
              tripId={selectedTripId}
              onTogglePacked={() => handleTogglePacked(c._id)}
              onViewDescription={setViewItem}
            />
          ))}
        </ul>
      )}

      {viewItem && selectedTripId && (
        <ChecklistViewModal
          tripId={selectedTripId}
          item={viewItem}
          isAdmin={false}
          onClose={() => setViewItem(null)}
        />
      )}
    </TripModuleShell>
  );
}
