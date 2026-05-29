import { useEffect, useMemo, useRef, useState } from "react";

function memberLabel(m) {
  return m.name || m.email || m.username || m.mobileNumber || "Member";
}

/**
 * Multi-select with checkboxes + Select all.
 * Empty selection or all selected => "all members" (value []).
 */
export default function MemberMultiSelect({
  options = [],
  value = [],
  onChange,
  disabled = false,
  placeholder = "All members",
  emptyHint = "No members on this trip yet. Add members via Groups linked to this trip.",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const optionIds = useMemo(
    () => options.map((o) => String(o.id || o._id)).filter(Boolean),
    [options]
  );

  const selected = useMemo(
    () => value.map(String).filter((id) => optionIds.includes(id)),
    [value, optionIds]
  );

  const isAllMembers =
    optionIds.length === 0 || selected.length === 0 || selected.length >= optionIds.length;

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const summary = useMemo(() => {
    if (!optionIds.length) return emptyHint;
    if (isAllMembers) return placeholder;
    const names = selected
      .map((id) => options.find((o) => String(o.id || o._id) === id))
      .filter(Boolean)
      .map(memberLabel);
    return names.join(", ");
  }, [optionIds.length, isAllMembers, placeholder, selected, options, emptyHint]);

  const toggleAll = () => {
    onChange([]);
  };

  const toggleOne = (id) => {
    const sid = String(id);
    if (isAllMembers) {
      onChange(optionIds.filter((x) => x !== sid));
      return;
    }
    if (selected.includes(sid)) {
      const next = selected.filter((x) => x !== sid);
      onChange(next.length ? next : []);
      return;
    }
    const next = [...selected, sid];
    if (next.length >= optionIds.length) onChange([]);
    else onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || !optionIds.length}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        <span className={`truncate ${!optionIds.length ? "text-slate-500" : ""}`}>{summary}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && optionIds.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg bg-slate-900 border border-slate-700 shadow-xl py-1">
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 cursor-pointer border-b border-slate-800">
            <input
              type="checkbox"
              checked={isAllMembers}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-emerald-400">Select all (all members)</span>
          </label>
          {options.map((m) => {
            const id = String(m.id || m._id);
            const checked = isAllMembers || selected.includes(id);
            return (
              <label
                key={id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOne(id)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-200 truncate">{memberLabel(m)}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function formatChecklistAssignees(item, memberOptions = []) {
  const raw = item?.assignedTo;
  let ids = [];
  if (raw == null) ids = [];
  else if (Array.isArray(raw)) {
    ids = raw.map((a) => (a && typeof a === "object" ? String(a._id || a.id) : String(a))).filter(Boolean);
  } else if (typeof raw === "object" && raw._id) {
    ids = [String(raw._id)];
  } else {
    ids = [String(raw)];
  }
  if (!ids.length) return "All members";
  const lookup = new Map(memberOptions.map((m) => [String(m.id || m._id), m]));
  const names = ids
    .map((id) => {
      const fromPop = Array.isArray(raw)
        ? raw.find((a) => a && typeof a === "object" && String(a._id) === id)
        : typeof raw === "object"
        ? raw
        : null;
      if (fromPop?.name) return fromPop.name;
      const m = lookup.get(id);
      return m ? memberLabel(m) : null;
    })
    .filter(Boolean);
  return names.length ? names.join(", ") : "All members";
}

/** Form selection from a saved checklist row */
export function assignedIdsFromItem(item) {
  const raw = item?.assignedTo;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((a) => (a && typeof a === "object" ? String(a._id || a.id) : String(a)))
      .filter(Boolean);
  }
  if (typeof raw === "object" && raw._id) return [String(raw._id)];
  const single = String(raw);
  return single && single !== "null" ? [single] : [];
}

/** Payload: [] = all members; otherwise specific user ids */
export function assigneesForApi(selectedIds, allOptionIds) {
  const selected = selectedIds.map(String);
  const all = allOptionIds.map(String);
  if (!all.length || !selected.length || selected.length >= all.length) return [];
  return selected;
}
