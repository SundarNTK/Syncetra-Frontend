import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useActionPopup } from "../../../hooks/useActionPopup";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import {
  getGroupById,
  addGroupMember,
  addGroupMembers,
  updateGroupMember,
  removeGroupMember,
} from "../../../services/groups";
import { getMembers } from "../../../services/users";
import { useTrip } from "../../../context/TripContext";
import ZoomableImage from "../../../components/ui/ZoomableImage";

const TRIP_LINK_BADGE = {
  planned: "bg-blue-600/20 text-blue-400 border-blue-700/40 shadow-[0_0_14px_rgba(56,189,248,0.28)]",
  active: "bg-emerald-600/20 text-emerald-400 border-emerald-700/40 shadow-[0_0_14px_rgba(52,211,153,0.32)]",
  completed: "bg-amber-600/20 text-amber-300 border-amber-700/40 shadow-[0_0_14px_rgba(251,191,36,0.32)]",
  cancelled: "bg-red-600/20 text-red-400 border-red-700/40 shadow-[0_0_14px_rgba(239,68,68,0.28)]",
};

function GroupTripCover({ trip }) {
  if (!trip) return null;
  const linkBadge = TRIP_LINK_BADGE[trip.status] || TRIP_LINK_BADGE.planned;

  return (
    <div className="space-y-3">
      {trip.coverImage ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80">
          <ZoomableImage
            src={trip.coverImage}
            alt={trip.tripName}
            className="w-full h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize mb-2 ${linkBadge}`}
            >
              <span>✈️</span>
              {trip.tripName}
              <span className="opacity-70 font-normal">· {trip.status || "planned"}</span>
            </span>
          </div>
        </div>
      ) : (
        <>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${linkBadge}`}
          >
            <span>✈️</span>
            {trip.tripName}
            <span className="opacity-70 font-normal">· {trip.status || "planned"}</span>
          </span>
          <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 min-h-[11rem] flex flex-col items-center justify-center gap-2">
            <span className="text-5xl opacity-40">✈️</span>
            <p className="text-sm text-slate-400">{trip.tripName}</p>
          </div>
        </>
      )}
    </div>
  );
}

const INPUT_CLS =
  "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 " +
  "focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all text-sm outline-none";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#7c3aed","#a78bfa"], ["#0369a1","#38bdf8"], ["#065f46","#34d399"],
  ["#92400e","#fbbf24"], ["#9d174d","#f472b6"], ["#1e3a5f","#60a5fa"],
  ["#3b0764","#c084fc"], ["#7f1d1d","#f87171"],
];
function avatarColor(name = "") {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}
function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Avatar circle ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 28 }) {
  const [from, to] = avatarColor(name);
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center font-bold text-white"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(135deg,${from},${to})`,
        boxShadow: `0 0 8px ${to}55`,
      }}
    >
      {initials(name)}
    </span>
  );
}

// ─── Multi-select Searchable User Picker ─────────────────────────────────────
function UserPicker({ users, selectedUsers, onAdd, onRemove }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedIds = new Set(selectedUsers.map((u) => String(u.id)));

  const filtered = users.filter((u) => {
    if (selectedIds.has(String(u.id))) return false;
    const q = query.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (user) => {
    onAdd(user);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className="relative space-y-3">
      {/* Selected chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((u) => {
            const [from, to] = avatarColor(u.name);
            return (
              <span
                key={u.id}
                className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full text-xs font-semibold text-white transition-all"
                style={{
                  background: `linear-gradient(135deg,${from}33,${to}22)`,
                  border: `1px solid ${to}55`,
                  boxShadow: `0 0 10px ${to}22`,
                }}
              >
                <Avatar name={u.name} size={20} />
                <span className="tracking-wide">{u.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(u)}
                  className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors text-[11px] leading-none"
                  title="Remove"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, email or username…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm outline-none text-slate-100 placeholder-slate-500"
        />
        {query && (
          <button
            type="button"
            onMouseDown={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-40 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 divide-y divide-slate-800/60">
          {filtered.length === 0 ? (
            <li className="flex items-center gap-3 px-4 py-4 text-slate-500 text-sm">
              <span className="text-xl">🔍</span>
              {query ? "No matching users found." : "Start typing to search members…"}
            </li>
          ) : (
            filtered.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/70 transition-colors text-left group"
                >
                  <Avatar name={u.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {u.email}
                      {u.username && (
                        <span className="ml-2 font-mono text-slate-600">@{u.username}</span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-cyan-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    + Add
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function GroupDetail() {
  const { id } = useParams();
  const { trips, loadTrips } = useTrip();

  const [group,         setGroup]         = useState(null);
  const [allUsers,      setAllUsers]      = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [error, setError]       = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [editingId, setEditingId]   = useState(null);
  const [editName, setEditName]     = useState("");
  const [editMobile, setEditMobile] = useState("");
  const { confirmDelete, deleteModal } = useDeleteConfirm();
  const { popup, showSuccess } = useActionPopup("members");

  const load = async () => {
    const res = await getGroupById(id);
    setGroup(res?.data);
  };

  useEffect(() => {
    load();
    getMembers()
      .then((res) => setAllUsers(res?.data || []))
      .catch(() => {});
    // Trips are cached across the whole session — re-fetch on every visit to this page so a
    // trip renamed elsewhere (possibly in a different session) is reflected immediately here.
    loadTrips();
  }, [id]);

  // Filter out users already in this group from the picker
  const existingMemberIds = new Set(
    (group?.memberDetails || []).map((m) => String(m._id))
  );
  const availableUsers = allUsers.filter((u) => !existingMemberIds.has(String(u.id)));

  // ── Add members (multi) ─────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedUsers.length) { setError("Please select at least one user."); return; }
    setError("");
    setAddLoading(true);
    try {
      const userIds = selectedUsers.map((u) => u.id);
      if (userIds.length === 1) {
        await addGroupMember(id, { userId: userIds[0] });
      } else {
        await addGroupMembers(id, userIds);
      }
      setSelectedUsers([]);
      load();
      showSuccess(
        userIds.length === 1
          ? "Member added to group successfully."
          : `${userIds.length} members added to group successfully.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // ── Edit member ─────────────────────────────────────────────────────────────
  const startEdit = (m) => {
    setEditingId(m._id);
    setEditName(m.name);
    setEditMobile(m.mobileNumber);
  };
  const cancelEdit = () => { setEditingId(null); setEditName(""); setEditMobile(""); };
  const saveEdit = async (memberId) => {
    setError("");
    try {
      await updateGroupMember(id, memberId, { name: editName, mobileNumber: editMobile });
      cancelEdit();
      load();
      showSuccess("Group member updated successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Remove member ───────────────────────────────────────────────────────────
  const handleDelete = (memberId, memberName) => {
    confirmDelete({
      title: "Confirm removal",
      message: "Shall we proceed to remove this member from the group?",
      confirmLabel: "Yes, proceed",
      recordLabel: memberName,
      onConfirm: async () => {
        try {
          await removeGroupMember(id, memberId);
          load();
        } catch (err) {
          setError(err.message);
          throw err;
        }
      },
    });
  };

  if (!group) return <SyncetraLoader className="py-16 min-h-[240px]" />;

  const members = group.memberDetails || [];
  const trip = group.tripId
    ? trips.find((t) => t._id === String(group.tripId))
    : null;

  return (
    <div className="w-full max-w-none space-y-6">
      {popup}
      {/* Breadcrumb */}
      <Link to="/admin/groups" className="text-sm text-slate-400 hover:text-white transition-colors">
        ← Groups
      </Link>

      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">{group.groupName}</h2>
        <p className="text-slate-400 text-sm mt-1">View, add, edit and remove members</p>
      </div>

      {/* Linked trip cover (read-only — link trip when creating/editing group) */}
      {trip ? (
        <GroupTripCover trip={trip} />
      ) : (
        <p className="text-sm text-slate-500 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
          No trip linked to this group.
        </p>
      )}

      {/* Info banner */}
      <div className="rounded-xl border border-cyan-700/50 bg-cyan-950/30 p-4 text-sm text-cyan-100/90">
        <p className="font-semibold text-cyan-300 mb-1">Mobile number ≠ SMS alarm</p>
        <p className="text-xs sm:text-sm">
          Alarms are sent to the <strong>phone where the member opens the app</strong> (PWA)
          and allows notifications — not as a text message to the stored mobile number.
        </p>
      </div>

      {/* Members list */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 sm:p-5">
        <h3 className="font-semibold mb-4">Members ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-slate-500 text-sm">No members yet. Add one below.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m._id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                {editingId === m._id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)}
                          className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Mobile</label>
                        <input value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ""))}
                          className={INPUT_CLS} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Email: {m.email}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveEdit(m._id)}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                        Save
                      </button>
                      <button type="button" onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm sm:text-base">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.hasFcmToken ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/30 text-green-400 border border-green-600">Ready</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400 border border-amber-600">Not on phone</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
                      <p className="text-xs font-mono text-slate-400">Mobile: {m.mobileNumber}</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(m)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(m._id, m.name)}
                          className="px-3 py-1.5 rounded-lg bg-red-900/50 text-red-400 text-xs font-medium hover:bg-red-800/50 transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add member ── */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700/80"
        style={{ background: "linear-gradient(135deg,#0f172a 60%,#0c1a2e 100%)" }}>
        {/* Accent top bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,#06b6d4,#818cf8,#ec4899)" }} />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#164e63,#0e7490)", boxShadow: "0 0 16px rgba(6,182,212,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight">Add Members</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select one or more registered users to add to this group</p>
            </div>
            {selectedUsers.length > 0 && (
              <span className="shrink-0 inline-flex items-center justify-center min-w-[1.6rem] h-6 px-2 rounded-full text-[11px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#0891b2,#6366f1)" }}>
                {selectedUsers.length}
              </span>
            )}
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <UserPicker
              users={availableUsers}
              selectedUsers={selectedUsers}
              onAdd={(u) => setSelectedUsers((prev) => [...prev, u])}
              onRemove={(u) => setSelectedUsers((prev) => prev.filter((x) => x.id !== u.id))}
            />

            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={!selectedUsers.length || addLoading}
                className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                style={{
                  background: selectedUsers.length
                    ? "linear-gradient(135deg,#0891b2,#6366f1)"
                    : "linear-gradient(135deg,#334155,#475569)",
                  boxShadow: selectedUsers.length ? "0 0 20px rgba(6,182,212,0.35)" : "none",
                }}
              >
                {addLoading ? (
                  <>
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                    </svg>
                    Adding…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {selectedUsers.length > 1
                      ? `Add ${selectedUsers.length} Members`
                      : "Add to Group"}
                  </>
                )}
              </button>

              {selectedUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedUsers([])}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
                >
                  Clear all
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {deleteModal}
    </div>
  );
}
