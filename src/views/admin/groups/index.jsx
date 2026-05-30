import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { getAdminGroups, deleteGroup } from "../../../services/groups";
import { useTrip } from "../../../context/TripContext";
import MasterPageShell, { MasterList, MasterListItem } from "../../../components/layout/MasterPageShell";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import ZoomableImage from "../../../components/ui/ZoomableImage";

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

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { trips } = useTrip();
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminGroups();
      setGroups(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
    </MasterPageShell>
  );
}
