import { useEffect, useState } from "react";
import { getUserGroups } from "../../../services/groups";
import { joinGroupRooms } from "../../../services/socketService";
import { requestNotificationPermission } from "../../../utils/notifications";
import { useTrip } from "../../../context/TripContext";
import MasterPageShell, { MasterList, MasterListItem, MasterListEmpty } from "../../../components/layout/MasterPageShell";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";

const fmtDate = (iso) => (iso ? formatDateTimeDisplay(iso).split(",")[0] : null);

const STATUS_BADGE = {
  planned:   "bg-blue-600/20 text-blue-400 border border-blue-700/40",
  active:    "bg-emerald-600/20 text-emerald-400 border border-emerald-700/40",
  completed: "bg-slate-600/20 text-slate-300 border border-slate-600/40",
  cancelled: "bg-red-600/20 text-red-400 border border-red-700/40",
};

const IconEye   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IconClose = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;

// ─── GroupViewModal ────────────────────────────────────────────────────────────
function GroupViewModal({ group, trip, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">{group.groupName}</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {group.members?.length || 0} member{group.members?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
            <IconClose />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Linked trip */}
          {trip ? (
            <div className="rounded-2xl overflow-hidden border border-slate-700">
              {trip.coverImage && (
                <img src={trip.coverImage} alt={trip.tripName} className="w-full h-36 object-cover" />
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize border ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}>
                    {trip.status}
                  </span>
                  <h3 className="font-semibold text-white">{trip.tripName}</h3>
                </div>
                {trip.description && (
                  <p className="text-sm text-slate-300 leading-relaxed">{trip.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Budget</p>
                    <p className="text-sm font-medium text-slate-200">₹{(trip.budget || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Status</p>
                    <p className="text-sm font-medium text-slate-200 capitalize">{trip.status}</p>
                  </div>
                  {trip.startDate && (
                    <div className="bg-slate-800/60 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Start Date</p>
                      <p className="text-sm font-medium text-slate-200">{fmtDate(trip.startDate) || "—"}</p>
                    </div>
                  )}
                  {trip.endDate && (
                    <div className="bg-slate-800/60 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">End Date</p>
                      <p className="text-sm font-medium text-slate-200">{fmtDate(trip.endDate) || "—"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <span>✈️</span> No trip linked to this group yet.
            </div>
          )}

          {/* Members list */}
          {(group.memberDetails?.length > 0) && (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/40">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Members
                </p>
                <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                  {group.memberDetails.length}
                </span>
              </div>
              <ul className="divide-y divide-slate-700/30">
                {group.memberDetails.map((m, i) => {
                  const initials = (m.name || "?")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const AVATAR_COLORS = [
                    "bg-emerald-700/50 text-emerald-300",
                    "bg-blue-700/50 text-blue-300",
                    "bg-violet-700/50 text-violet-300",
                    "bg-amber-700/50 text-amber-300",
                    "bg-rose-700/50 text-rose-300",
                    "bg-cyan-700/50 text-cyan-300",
                  ];
                  const colorCls = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <li key={m._id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorCls}`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{m.name || "—"}</p>
                        {m.email && (
                          <p className="text-xs text-slate-500 truncate">{m.email}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0">#{i + 1}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GroupCard ─────────────────────────────────────────────────────────────────
function GroupCard({ group, trip, onView }) {
  return (
    <MasterListItem>
      {/* Trip cover image */}
      <div className="w-28 sm:w-36 shrink-0 relative">
        {trip?.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.tripName}
            className="w-full h-full object-cover min-h-[6rem]"
          />
        ) : (
          <div className="w-full h-full min-h-[6rem] bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center gap-1">
            <span className="text-3xl opacity-30">✈️</span>
            {trip && (
              <span className="text-[10px] text-slate-500 px-1 text-center leading-tight">
                {trip.tripName}
              </span>
            )}
          </div>
        )}
        {trip?.coverImage && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
            <p className="text-[10px] text-white/90 truncate">{trip.tripName}</p>
          </div>
        )}
      </div>

      {/* Group info + actions */}
      <div className="flex-1 p-4 flex flex-col sm:flex-row justify-between items-start gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg truncate">{group.groupName}</h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {group.members?.length || 0} member{group.members?.length !== 1 ? "s" : ""}
          </p>
          {trip ? (
            <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1">
              <span>✈️</span> {trip.tripName}
            </p>
          ) : (
            <p className="text-xs text-slate-600 mt-1">No trip linked</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0 self-start">
          <button
            onClick={() => onView(group)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
          >
            <IconEye /> View
          </button>
        </div>
      </div>
    </MasterListItem>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserGroups() {
  const [groups, setGroups] = useState([]);
  const [viewGroup, setViewGroup] = useState(null);
  const { trips } = useTrip();

  useEffect(() => {
    requestNotificationPermission();
    getUserGroups().then((res) => {
      const list = res?.data || [];
      setGroups(list);
      joinGroupRooms(list.map((g) => g._id));
    });
  }, []);

  const getTripForGroup = (g) =>
    g.tripId ? trips.find((t) => t._id === String(g.tripId)) : null;

  return (
    <MasterPageShell title="My Groups" description="Groups you are assigned to">
      {groups.length === 0 ? (
        <MasterListEmpty
          icon="👥"
          message="You are not in any group yet. Ask your trip admin to add your mobile number."
        />
      ) : (
        <MasterList>
          {groups.map((g) => (
            <GroupCard
              key={g._id}
              group={g}
              trip={getTripForGroup(g)}
              onView={setViewGroup}
            />
          ))}
        </MasterList>
      )}

      {viewGroup && (
        <GroupViewModal
          group={viewGroup}
          trip={getTripForGroup(viewGroup)}
          onClose={() => setViewGroup(null)}
        />
      )}
    </MasterPageShell>
  );
}
