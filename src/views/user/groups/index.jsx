import { useEffect, useState } from "react";
import { getUserGroups } from "../../../services/groups";
import { joinGroupRooms } from "../../../services/socketService";
import { requestNotificationPermission } from "../../../utils/notifications";
import { useTrip } from "../../../context/TripContext";
import MasterPageShell, { MasterList, MasterListItem, MasterListEmpty } from "../../../components/layout/MasterPageShell";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";

const fmtDate = (iso) => (iso ? formatDateTimeDisplay(iso).split(",")[0] : null);

const STATUS_BADGE = {
  planned:   "bg-blue-600/20 text-blue-400 border border-blue-700/40",
  active:    "bg-emerald-600/20 text-emerald-400 border border-emerald-700/40",
  completed: "bg-amber-600/20 text-amber-300 border border-amber-700/40",
  cancelled: "bg-red-600/20 text-red-400 border border-red-700/40",
};

const STATUS_COVER_GLOW = {
  planned:   "trip-cover-glow--planned",
  active:    "trip-cover-glow--active",
  completed: "trip-cover-glow--completed",
  cancelled: "trip-cover-glow--cancelled",
};

const TRIP_LINK_BADGE = {
  planned:   "bg-blue-600/20 text-blue-400 border-blue-700/40 shadow-[0_0_14px_rgba(56,189,248,0.28)]",
  active:    "bg-emerald-600/20 text-emerald-400 border-emerald-700/40 shadow-[0_0_14px_rgba(52,211,153,0.32)]",
  completed: "bg-amber-600/20 text-amber-300 border-amber-700/40 shadow-[0_0_14px_rgba(251,191,36,0.32)]",
  cancelled: "bg-red-600/20 text-red-400 border-red-700/40 shadow-[0_0_14px_rgba(239,68,68,0.28)]",
};

const MEMBER_BADGE =
  "bg-violet-600/20 text-violet-300 border-violet-700/40 shadow-[0_0_14px_rgba(139,92,246,0.28)]";

const actionBtn =
  "flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-colors w-full sm:w-auto";

const IconEye   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IconClose = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;

// ─── GroupViewModal ────────────────────────────────────────────────────────────
function GroupViewModal({ group, trip, onClose }) {
  const memberCount = group.members?.length || 0;

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
        {trip?.coverImage ? (
          <div className="relative">
            <ZoomableImage
              src={trip.coverImage}
              alt={trip.tripName}
              className="w-full h-52 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
            >
              <IconClose />
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pointer-events-none">
              <h2 className="text-2xl font-bold text-white">{group.groupName}</h2>
              {trip && (
                <p className="text-sm text-white/80 mt-0.5">✈️ {trip.tripName}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">{group.groupName}</h2>
              {trip && (
                <p className="text-sm text-slate-400 mt-0.5">✈️ {trip.tripName}</p>
              )}
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
              <IconClose />
            </button>
          </div>
        )}

        <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
          {trip && (
            <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize border ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}>
              {trip.status}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full">
            👥 {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="p-5 pt-3 space-y-4">
          {trip ? (
            <>
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
            </>
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

// ─── GroupCoverThumb ───────────────────────────────────────────────────────────
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

// ─── GroupCard ─────────────────────────────────────────────────────────────────
function GroupCard({ group, trip, onView }) {
  const memberCount = group.members?.length || 0;
  const tripBadge = trip
    ? TRIP_LINK_BADGE[trip.status] || TRIP_LINK_BADGE.planned
    : null;

  return (
    <MasterListItem className="master-list-item trip-card flex-col sm:flex-row">
      <GroupCoverThumb trip={trip} />

      <div className="flex-1 flex flex-col sm:flex-row min-w-0 w-full">
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg leading-snug break-words w-full sm:w-auto sm:truncate sm:flex-1 min-w-0 mb-2">
            {group.groupName}
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
          <button
            type="button"
            onClick={() => onView(group)}
            className={`${actionBtn} col-span-2 sm:col-span-1 bg-slate-700 hover:bg-slate-600 text-slate-300`}
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
