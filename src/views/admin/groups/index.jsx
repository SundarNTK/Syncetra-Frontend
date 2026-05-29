import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { getAdminGroups, deleteGroup, updateGroup } from "../../../services/groups";
import { useTrip } from "../../../context/TripContext";
import MasterPageShell, { MasterList, MasterListItem } from "../../../components/layout/MasterPageShell";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";

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

  const handleTripChange = async (groupId, tripId) => {
    await updateGroup(groupId, { tripId: tripId || null });
    load();
  };

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
            return (
              <MasterListItem key={g._id} className="master-list-item">
                {/* trip cover image — big, left side */}
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
                  {/* trip name badge overlaid on image */}
                  {trip?.coverImage && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-[10px] text-white/90 truncate">{trip.tripName}</p>
                    </div>
                  )}
                </div>

                {/* group info */}
                <div className="flex-1 p-4 flex flex-col sm:flex-row justify-between items-start gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{g.groupName}</h3>
                    <p className="text-sm text-slate-400 mb-1.5">
                      {g.members?.length || 0} member{g.members?.length !== 1 ? "s" : ""}
                    </p>
                    {/* inline trip selector — only show unlinked trips + this group's own trip */}
                    <select
                      value={String(g.tripId || "")}
                      onChange={(e) => handleTripChange(g._id, e.target.value)}
                      className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-300 max-w-[180px] mb-2"
                    >
                      <option value="">— Link a trip —</option>
                      {trips
                        .filter((t) => {
                          const linkedByOther = groups
                            .filter((other) => other._id !== g._id && other.tripId)
                            .map((other) => String(other.tripId));
                          return !linkedByOther.includes(t._id);
                        })
                        .map((t) => (
                          <option key={t._id} value={t._id}>{t.tripName}</option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 self-start">
                    <Link
                      to={`/admin/groups/${g._id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-400 text-xs font-medium transition-colors border border-emerald-700/40"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View Members
                    </Link>
                    <button
                      onClick={() => handleDelete(g._id)}
                      className="text-xs text-red-400 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 transition-colors"
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
