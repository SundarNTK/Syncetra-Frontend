import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { getAdminGroups, deleteGroup, updateGroup } from "../../../services/groups";
import { useTrip } from "../../../context/TripContext";
import { useAppSelector } from "../../../hooks";
import { ROLES } from "../../../constants/enum";
import MasterPageShell, { MasterList, MasterListItem } from "../../../components/layout/MasterPageShell";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import SearchableSelect from "../../../components/ui/SearchableSelect";

const STATUS_COVER_GLOW = {
  planned: "trip-cover-glow--planned",
  active: "trip-cover-glow--active",
  completed: "trip-cover-glow--completed",
  cancelled: "trip-cover-glow--cancelled",
};

const TRIP_LINK_BADGE = {
  planned: "bg-blue-600/20 text-blue-400 border-blue-700/40 shadow-[0_0_14px_rgba(56,189,248,0.28)]",
  active: "bg-emerald-600/20 text-emerald-400 border-emerald-700/40 shadow-[0_0_14px_rgba(52,211,153,0.32)]",
  completed: "bg-amber-600/20 text-amber-300 border-amber-700/40 shadow-[0_0_14px_rgba(251,191,36,0.32)]",
  cancelled: "bg-red-600/20 text-red-400 border-red-700/40 shadow-[0_0_14px_rgba(239,68,68,0.28)]",
};

const MEMBER_BADGE =
  "bg-violet-600/20 text-violet-300 border-violet-700/40 shadow-[0_0_14px_rgba(139,92,246,0.28)]";

function GroupCoverThumb({ trip }) {
  const coverGlowClass = trip
    ? STATUS_COVER_GLOW[trip.status] || STATUS_COVER_GLOW.planned
    : "";

  return (
    <div className="trip-cover-column relative shrink-0 w-full h-40 sm:h-auto sm:w-36 md:w-40 sm:min-h-[7.5rem] sm:self-stretch bg-slate-950 border-b sm:border-b-0 sm:border-r border-slate-800/60 p-1 sm:p-1.5">
      <div className={`trip-cover-glow-wrap trip-cover-glow-wrap--card h-full w-full ${coverGlowClass}`}>
        <span className="trip-cover-glow-shimmer" aria-hidden="true" />
        {trip?.coverImage ? (
          <ZoomableImage
            src={trip.coverImage}
            alt={trip.tripName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-700 to-slate-900">
            <span className="text-3xl opacity-30">✈️</span>
            {trip && (
              <span className="text-[10px] text-slate-500 px-1 text-center leading-tight line-clamp-2">
                {trip.tripName}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const actionBtn =
  "flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-colors w-full sm:w-auto";

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm text-white placeholder-slate-500";

/* ─── EditGroupModal ───────────────────────────────────────────────────────── */
function EditGroupModal({ group, trips, linkedTripIds, onClose, onSaved }) {
  const [groupName, setGroupName] = useState(group.groupName || "");
  const [tripId, setTripId] = useState(group.tripId ? String(group.tripId) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableTrips = trips.filter(
    (t) => t._id === tripId || !linkedTripIds.includes(t._id)
  );

  const handleSave = async () => {
    if (!groupName.trim()) { setError("Group name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await updateGroup(group._id, {
        groupName: groupName.trim(),
        tripId: tripId || null,
      });
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to update group.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        <div className="h-1 bg-gradient-to-r from-red-600 to-orange-500" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <p className="font-bold text-white">Edit Group</p>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
            ×
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setError(""); }}
              className={inputCls}
              placeholder="Enter group name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Link to Trip <span className="text-slate-600 font-normal normal-case">(optional)</span>
            </label>
            {availableTrips.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                No trips available to link.
              </p>
            ) : (
              <SearchableSelect
                value={tripId}
                onChange={setTripId}
                options={[
                  { value: "", label: "None" },
                  ...availableTrips.map((t) => ({
                    value: t._id,
                    label: t.name || t.tripName,
                  })),
                ]}
                placeholder="None"
                searchPlaceholder="Search trips…"
              />
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const { trips, loadTrips } = useTrip();
  const { confirmDelete, deleteModal } = useDeleteConfirm();
  const { popup, showSuccess } = useActionPopup("groups");
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminGroups();
      setGroups(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Trips are cached across the whole session — re-fetch on every visit to this page so a
    // trip renamed elsewhere (possibly in a different session) is reflected immediately here.
    loadTrips();
  }, []);

  const handleDelete = (id) => {
    const group = groups.find((g) => g._id === id);
    confirmDelete({
      recordLabel: group?.groupName,
      onConfirm: async () => {
        await deleteGroup(id);
        load();
      },
    });
  };

  const getTripForGroup = (g) =>
    g.tripId ? trips.find((t) => t._id === String(g.tripId)) : null;

  const linkedTripIdsExcluding = (excludeGroupId) =>
    groups
      .filter((g) => g.tripId && g._id !== excludeGroupId)
      .map((g) => String(g.tripId));

  return (
    <MasterPageShell
      title="Groups"
      action={
        <Link
          to="/admin/groups/create"
          className="text-sm px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-red-900/30 transition-all"
        >
          + New Group
        </Link>
      }
    >
      {loading ? (
        <SyncetraLoader className="py-16" />
      ) : groups.length === 0 ? (
        <p className="text-slate-400">No groups yet.</p>
      ) : (
        <MasterList>
          {groups.map((g) => {
            const trip = getTripForGroup(g);
            const memberCount = g.members?.length || 0;
            const tripBadge = trip
              ? TRIP_LINK_BADGE[trip.status] || TRIP_LINK_BADGE.planned
              : null;

            return (
              <MasterListItem key={g._id} className="master-list-item trip-card flex-col sm:flex-row">
                <GroupCoverThumb trip={trip} />

                <div className="flex-1 flex flex-col sm:flex-row min-w-0 w-full">
                  <div className="flex-1 p-3 sm:p-4 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg leading-snug break-words w-full sm:w-auto sm:truncate sm:flex-1 min-w-0 mb-2">
                      {g.groupName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${MEMBER_BADGE}`}
                      >
                        👥 {memberCount} member{memberCount !== 1 ? "s" : ""}
                      </span>
                      {trip ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${tripBadge}`}
                        >
                          ✈️ {trip.tripName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                          No trip linked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 p-3 pt-0 sm:p-4 sm:pt-4 sm:pl-2 sm:shrink-0 sm:self-start border-t sm:border-t-0 sm:border-l border-slate-700/40">
                    <Link
                      to={`/admin/groups/${g._id}`}
                      className={`${actionBtn} bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-400 border border-emerald-700/40`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View Members
                    </Link>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => setEditingGroup(g)}
                        className={`${actionBtn} bg-blue-700/30 hover:bg-blue-700/50 text-blue-400 border border-blue-700/40`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(g._id)}
                      className={`${actionBtn} bg-red-900/30 hover:bg-red-900/50 text-red-400`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </MasterListItem>
            );
          })}
        </MasterList>
      )}
      {deleteModal}
      {popup}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          trips={trips}
          linkedTripIds={linkedTripIdsExcluding(editingGroup._id)}
          onClose={() => setEditingGroup(null)}
          onSaved={() => {
            setEditingGroup(null);
            load();
            showSuccess("Group updated successfully.");
          }}
        />
      )}
    </MasterPageShell>
  );
}
