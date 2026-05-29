import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import {
  getGroupById,
  getAdminGroups,
  addGroupMember,
  updateGroupMember,
  removeGroupMember,
  updateGroup,
} from "../../../services/groups";
import { getMembers } from "../../../services/users";
import { useTrip } from "../../../context/TripContext";

const INPUT_CLS =
  "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-600 " +
  "focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all text-sm outline-none";

// ─── Searchable User Picker ───────────────────────────────────────────────────
function UserPicker({ users, selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (user) => {
    onSelect(user);
    setQuery(user.name);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs font-medium text-slate-400 mb-1">
        Search &amp; Select User
      </label>
      <div className="relative">
        <input
          type="text"
          value={selected ? selected.name : query}
          onChange={(e) => {
            if (selected) return; // locked when selected
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (!selected) setOpen(true); }}
          placeholder="Type name, email or username…"
          className={`${INPUT_CLS} pr-8`}
          readOnly={!!selected}
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-lg leading-none"
            title="Clear selection"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown list */}
      {open && !selected && (
        <ul className="absolute z-30 mt-1 w-full max-h-52 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-xl">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-slate-500 text-sm">No users found.</li>
          ) : (
            filtered.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(u)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-800 transition-colors"
                >
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-xs text-slate-400">
                    {u.email}
                    {u.username && (
                      <span className="ml-2 text-slate-500 font-mono">@{u.username}</span>
                    )}
                  </p>
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
  const { trips } = useTrip();

  const [group,       setGroup]       = useState(null);
  const [allUsers,    setAllUsers]    = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [linkedTripIds, setLinkedTripIds] = useState([]);

  const [error, setError]       = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [editingId, setEditingId]   = useState(null);
  const [editName, setEditName]     = useState("");
  const [editMobile, setEditMobile] = useState("");
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  const load = async () => {
    const res = await getGroupById(id);
    setGroup(res?.data);
  };

  useEffect(() => {
    load();
    getMembers()
      .then((res) => setAllUsers(res?.data || []))
      .catch(() => {});
    getAdminGroups()
      .then((res) => {
        const ids = (res?.data || [])
          .filter((g) => String(g._id) !== id && g.tripId)
          .map((g) => String(g.tripId));
        setLinkedTripIds(ids);
      })
      .catch(() => {});
  }, [id]);

  // Filter out users already in this group from the picker
  const existingMemberIds = new Set(
    (group?.memberDetails || []).map((m) => String(m._id))
  );
  const availableUsers = allUsers.filter((u) => !existingMemberIds.has(String(u.id)));

  // ── Add member ──────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedUser) { setError("Please select a user."); return; }
    setError("");
    setAddLoading(true);
    try {
      await addGroupMember(id, { userId: selectedUser.id });
      setSelectedUser(null);
      load();
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
      {/* Breadcrumb */}
      <Link to="/admin/groups" className="text-sm text-slate-400 hover:text-white transition-colors">
        ← Groups
      </Link>

      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">{group.groupName}</h2>
        <p className="text-slate-400 text-sm mt-1">View, add, edit and remove members</p>
      </div>

      {/* Trip selector */}
      <div className="flex items-center gap-3">
        {trip?.coverImage && (
          <img src={trip.coverImage} alt={trip.tripName}
            className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0" />
        )}
        <div className="flex-1 max-w-sm">
          <label className="block text-xs text-slate-500 mb-1">Linked trip</label>
          <select
            value={String(group.tripId || "")}
            onChange={async (e) => { await updateGroup(id, { tripId: e.target.value || null }); load(); }}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
          >
            <option value="">— No trip linked —</option>
            {trips
              .filter((t) => !linkedTripIds.includes(t._id))
              .map((t) => <option key={t._id} value={t._id}>{t.tripName}</option>)}
          </select>
        </div>
      </div>

      {/* Trip cover */}
      {trip && (
        <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
          {trip.coverImage ? (
            <div className="relative">
              <img src={trip.coverImage} alt={trip.tripName}
                className="w-full h-48 sm:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end px-5 pb-4">
                <div>
                  <p className="text-white text-lg font-bold">{trip.tripName}</p>
                  <p className="text-slate-300 text-xs capitalize">{trip.status}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-24 bg-gradient-to-br from-emerald-900/40 to-slate-800 flex items-center gap-4 px-5">
              <span className="text-4xl opacity-50">✈️</span>
              <div>
                <p className="text-white font-semibold">{trip.tripName}</p>
                <p className="text-slate-400 text-xs capitalize">{trip.status}</p>
              </div>
            </div>
          )}
        </div>
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
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 sm:p-5">
        <h3 className="font-semibold mb-1">Add member</h3>
        <p className="text-xs text-slate-500 mb-4">
          Select a registered member user. Their email and mobile are filled automatically.
        </p>

        <form onSubmit={handleAdd} className="space-y-4">
          {/* User picker */}
          <UserPicker
            users={availableUsers}
            selected={selectedUser}
            onSelect={setSelectedUser}
          />

          {/* Auto-filled read-only fields */}
          {selectedUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  readOnly
                  className={`${INPUT_CLS} bg-slate-900 text-slate-400 cursor-not-allowed`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={selectedUser.mobileNumber}
                  readOnly
                  className={`${INPUT_CLS} bg-slate-900 text-slate-400 cursor-not-allowed`}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-800/40 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!selectedUser || addLoading}
            className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity text-sm"
          >
            {addLoading ? "Adding…" : "+ Add to Group"}
          </button>
        </form>
      </div>
      {deleteModal}
    </div>
  );
}
