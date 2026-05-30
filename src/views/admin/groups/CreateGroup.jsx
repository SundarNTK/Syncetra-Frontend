import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGroup, getAdminGroups } from "../../../services/groups";
import { getMembers } from "../../../services/users";
import { useTrip } from "../../../context/TripContext";
import SearchableSelect from "../../../components/ui/SearchableSelect";

/* ─── MemberPickerDropdown ───────────────────────────────────────────────────
   Multi-select from existing registered members.
   selectedIds: string[]   onChange: (ids: string[]) => void
─────────────────────────────────────────────────────────────────────────────*/
function MemberPickerDropdown({ allMembers, selectedIds, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState([]);
  const ref = useRef(null);

  const allIds = allMembers.map((m) => String(m.id || m._id));

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current?.contains(e.target)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const openPanel = () => {
    setDraft([...selectedIds]);
    setSearch("");
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
    setSearch("");
  };

  const handleCancel = () => closePanel();

  const handleOkay = () => {
    onChange([...draft]);
    closePanel();
  };

  const filtered = allMembers.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q)
    );
  });

  const allSelected = allMembers.length > 0 && draft.length === allMembers.length;
  const someSelected = draft.length > 0 && !allSelected;

  const toggle = (id) => {
    if (draft.includes(id)) setDraft(draft.filter((s) => s !== id));
    else setDraft([...draft, id]);
  };

  const toggleAll = () => {
    if (allSelected) setDraft([]);
    else setDraft([...allIds]);
  };

  const label =
    selectedIds.length === 0
      ? "Select members to add"
      : selectedIds.length === allMembers.length
      ? "All members selected"
      : `${selectedIds.length} member${selectedIds.length > 1 ? "s" : ""} selected`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => (open ? handleCancel() : openPanel())}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 focus:outline-none focus:border-red-500/60 text-sm transition-colors"
      >
        <span className={selectedIds.length === 0 ? "text-slate-500" : "text-slate-200"}>
          {loading ? "Loading members…" : label}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Selected tags */}
      {!open && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedIds.map((id) => {
            const m = allMembers.find((x) => String(x.id || x._id) === id);
            return m ? (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-700/20 text-emerald-400 border border-emerald-700/30 px-2.5 py-1 rounded-full"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-700/40 flex items-center justify-center text-[9px] font-bold shrink-0">
                  {(m.name || "?").charAt(0).toUpperCase()}
                </span>
                {m.name || m.email}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(selectedIds.filter((s) => s !== id)); }}
                  className="hover:text-red-400 leading-none ml-0.5"
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-800">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-red-500/60 focus:outline-none transition-colors"
            />
          </div>

          {allMembers.length === 0 ? (
            <p className="px-4 py-4 text-xs text-slate-500 text-center">
              No registered members found.
            </p>
          ) : (
            <>
              {/* Select all */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAll(); }}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  allSelected
                    ? "bg-emerald-600 border-emerald-600"
                    : someSelected
                    ? "bg-emerald-600/40 border-emerald-600"
                    : "border-slate-600"
                }`}>
                  {allSelected && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1 4l3 3 5-5" />
                    </svg>
                  )}
                  {someSelected && !allSelected && <div className="w-2 h-0.5 bg-white rounded" />}
                </div>
                <span className="text-sm font-medium text-slate-200 select-none">Select All</span>
                <span className="ml-auto text-[10px] text-slate-500">{allMembers.length} members</span>
              </div>

              {/* Member list */}
              <div className="max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-500 text-center">No results for "{search}"</p>
                ) : (
                  filtered.map((m) => {
                    const id      = String(m.id || m._id);
                    const checked = draft.includes(id);
                    return (
                      <div
                        key={id}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          checked ? "bg-emerald-700/10" : "hover:bg-slate-800/60"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-emerald-600 border-emerald-600" : "border-slate-600"
                        }`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M1 4l3 3 5-5" />
                            </svg>
                          )}
                        </div>
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {(m.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200 truncate select-none">{m.name || "—"}</p>
                          <p className="text-[11px] text-slate-500 truncate select-none">{m.email}</p>
                        </div>
                        {checked && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="sync-date-panel__footer sync-date-panel__footer--multi gap-2">
                <span className="text-xs text-slate-500 truncate min-w-0 flex-1">
                  {draft.length === 0 ? "None selected" : `${draft.length} selected`}
                </span>
                <button type="button" className="sync-date-footer-btn shrink-0" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="button" className="sync-date-footer-btn sync-date-footer-btn--primary shrink-0" onClick={handleOkay}>
                  Okay
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── CreateGroup ─────────────────────────────────────────────────────────── */
export default function CreateGroup() {
  const navigate        = useNavigate();
  const { trips }       = useTrip();
  const [groupName, setGroupName] = useState("");
  const [tripId, setTripId]       = useState("");
  const [allMembers,      setAllMembers]      = useState([]);
  const [selectedIds,     setSelectedIds]     = useState([]);
  const [loadingMembers,  setLoadingMembers]  = useState(true);
  const [linkedTripIds,   setLinkedTripIds]   = useState([]);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  /* ── load registered members + existing groups (to know which trips are taken) ── */
  useEffect(() => {
    getMembers()
      .then((res) => setAllMembers(res?.data || []))
      .catch(() => setAllMembers([]))
      .finally(() => setLoadingMembers(false));
    getAdminGroups()
      .then((res) => {
        const ids = (res?.data || [])
          .filter((g) => g.tripId)
          .map((g) => String(g.tripId));
        setLinkedTripIds(ids);
      })
      .catch(() => {});
  }, []);

  const availableTrips = trips.filter((t) => !linkedTripIds.includes(t._id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) { setError("Group name is required."); return; }
    if (selectedIds.length === 0) { setError("Select at least one member."); return; }

    setLoading(true);
    setError("");
    try {
      const members = selectedIds.map((id) => {
        const m = allMembers.find((x) => String(x.id || x._id) === id);
        return {
          name:         m?.name         || "",
          email:        m?.email        || "",
          mobileNumber: m?.mobileNumber || "",
        };
      });
      await createGroup({ groupName: groupName.trim(), tripId: tripId || undefined, members });
      navigate("/admin/groups");
    } catch (err) {
      setError(err.message || "Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTrip = trips.find((t) => t._id === tripId);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Create Group</h2>
        <p className="text-slate-400 text-sm mt-1">
          Members receive alarms on mobile via FCM. They login with email OTP.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Group name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Group Name <span className="text-red-400">*</span>
          </label>
          <input
            value={groupName}
            onChange={(e) => { setGroupName(e.target.value); setError(""); }}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm text-white placeholder-slate-500"
            placeholder="Enter group name"
            required
          />
        </div>

        {/* Trip linkage */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Link to Trip <span className="text-slate-600 font-normal normal-case">(optional)</span>
          </label>
          {availableTrips.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
              {trips.length === 0
                ? "No trips available — create a trip first to link this group."
                : "All trips are already linked to other groups."}
            </p>
          ) : (
            <div className="flex items-center gap-3">
              {selectedTrip?.coverImage && (
                <img
                  src={selectedTrip.coverImage}
                  alt={selectedTrip.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                />
              )}
              <SearchableSelect
                className="flex-1 w-full min-w-0"
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
            </div>
          )}
        </div>

        {/* Members dropdown */}
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">Members</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Select existing registered members to add to this group.
            </p>
          </div>

          <MemberPickerDropdown
            allMembers={allMembers}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            loading={loadingMembers}
          />

          {allMembers.length === 0 && !loadingMembers && (
            <p className="mt-3 text-xs text-amber-400/80 bg-amber-950/30 border border-amber-800/30 px-3 py-2 rounded-lg">
              No registered members found. Add members first from the Members section.
            </p>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || selectedIds.length === 0}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-900/30 transition-all text-sm"
          >
            {loading ? "Creating…" : `Create Group${selectedIds.length > 0 ? ` (${selectedIds.length} member${selectedIds.length > 1 ? "s" : ""})` : ""}`}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/groups")}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-all text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
