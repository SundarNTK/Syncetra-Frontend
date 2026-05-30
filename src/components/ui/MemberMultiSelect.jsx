import { useEffect, useMemo, useRef, useState } from "react";
import SyncCheckbox from "./SyncCheckbox";
import {
  SYNC_SELECT_LAYOUT,
  SYNC_SELECT_TRIGGER,
  SYNC_SELECT_TRIGGER_OPEN,
  SYNC_SELECT_PANEL,
  SYNC_SELECT_SEARCH,
  SYNC_SELECT_TRIGGER_LABEL,
  SYNC_SELECT_CHEVRON,
} from "./formControlStyles";

function memberLabel(m) {
  return m.name || m.email || m.username || m.mobileNumber || "Member";
}

function normalizeDraftSelection(draftIds, optionIds, emptyMeansAll) {
  const selected = draftIds.map(String).filter((id) => optionIds.includes(id));
  if (emptyMeansAll && optionIds.length > 0 && selected.length >= optionIds.length) {
    return [];
  }
  return selected;
}

function MultiSelectFooter({ countLabel, onCancel, onOkay, okayDisabled }) {
  return (
    <div className="sync-date-panel__footer sync-date-panel__footer--multi gap-2">
      <span className="text-xs text-slate-500 truncate min-w-0 flex-1">{countLabel}</span>
      <button type="button" className="sync-date-footer-btn shrink-0" onClick={onCancel}>
        Cancel
      </button>
      <button
        type="button"
        className="sync-date-footer-btn sync-date-footer-btn--primary shrink-0"
        onClick={onOkay}
        disabled={okayDisabled}
      >
        Okay
      </button>
    </div>
  );
}

/**
 * Multi-select with checkboxes, search, Okay / Cancel.
 * Empty selection or all selected => "all members" when emptyMeansAll (value []).
 */
export default function MemberMultiSelect({
  options = [],
  value = [],
  onChange,
  disabled = false,
  placeholder = "All members",
  emptyHint = "No members on this trip yet. Add members via Groups linked to this trip.",
  emptyMeansAll = true,
  requireSelection = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState([]);
  const ref = useRef(null);
  const searchRef = useRef(null);

  const optionIds = useMemo(
    () => options.map((o) => String(o.id || o._id)).filter(Boolean),
    [options]
  );

  const committed = useMemo(
    () => value.map(String).filter((id) => optionIds.includes(id)),
    [value, optionIds]
  );

  const draftSelected = useMemo(
    () => draft.map(String).filter((id) => optionIds.includes(id)),
    [draft, optionIds]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((m) => {
      const hay = [memberLabel(m), m.email, m.mobileNumber, m.username]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const isAllMembersDraft = useMemo(() => {
    if (!emptyMeansAll) {
      return optionIds.length > 0 && draftSelected.length >= optionIds.length;
    }
    return (
      optionIds.length === 0 || draftSelected.length === 0 || draftSelected.length >= optionIds.length
    );
  }, [emptyMeansAll, optionIds.length, draftSelected.length]);

  const isAllMembersCommitted = useMemo(() => {
    if (!emptyMeansAll) {
      return optionIds.length > 0 && committed.length >= optionIds.length;
    }
    return (
      optionIds.length === 0 || committed.length === 0 || committed.length >= optionIds.length
    );
  }, [emptyMeansAll, optionIds.length, committed.length]);

  const closePanel = () => {
    setOpen(false);
    setQuery("");
  };

  const openPanel = () => {
    if (disabled || !optionIds.length) return;
    setDraft([...committed]);
    setQuery("");
    setOpen(true);
  };

  const handleCancel = () => closePanel();

  const handleOkay = () => {
    onChange(normalizeDraftSelection(draftSelected, optionIds, emptyMeansAll));
    closePanel();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current?.contains(e.target)) return;
      closePanel();
    };
    const onKey = (e) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const summary = useMemo(() => {
    if (!optionIds.length) return emptyHint;
    if (!emptyMeansAll && !committed.length) return placeholder;
    if (isAllMembersCommitted) return emptyMeansAll ? placeholder : `All ${optionIds.length} members`;
    const names = committed
      .map((id) => options.find((o) => String(o.id || o._id) === id))
      .filter(Boolean)
      .map(memberLabel);
    return names.join(", ");
  }, [
    optionIds.length,
    isAllMembersCommitted,
    placeholder,
    committed,
    options,
    emptyHint,
    emptyMeansAll,
  ]);

  const toggleAllDraft = () => {
    if (emptyMeansAll) setDraft([]);
    else setDraft([...optionIds]);
  };

  const toggleOneDraft = (id) => {
    const sid = String(id);
    if (emptyMeansAll && isAllMembersDraft) {
      setDraft(optionIds.filter((x) => x !== sid));
      return;
    }
    if (draftSelected.includes(sid)) {
      const next = draftSelected.filter((x) => x !== sid);
      setDraft(next);
      return;
    }
    const next = [...draftSelected, sid];
    if (emptyMeansAll && next.length >= optionIds.length) setDraft([]);
    else setDraft(next);
  };

  const okayDisabled = requireSelection && !emptyMeansAll && draftSelected.length === 0;

  const countLabel = (() => {
    if (!optionIds.length) return "";
    if (isAllMembersDraft && emptyMeansAll) return "All members";
    if (isAllMembersDraft && !emptyMeansAll) return `All ${optionIds.length} selected`;
    if (!draftSelected.length) return "None selected";
    return `${draftSelected.length} selected`;
  })();

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled || !optionIds.length}
        onClick={() => (open ? handleCancel() : openPanel())}
        className={`${SYNC_SELECT_LAYOUT} ${SYNC_SELECT_TRIGGER} ${open ? SYNC_SELECT_TRIGGER_OPEN : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`${SYNC_SELECT_TRIGGER_LABEL} ${!optionIds.length ? "text-slate-500" : "text-slate-100"}`}>
          {summary}
        </span>
        <svg
          className={`${SYNC_SELECT_CHEVRON} ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && optionIds.length > 0 && (
        <div className={`${SYNC_SELECT_PANEL} relative`}>
          <div className="p-2 border-b border-cyan-500/10">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className={SYNC_SELECT_SEARCH}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <label className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/70 cursor-pointer border-b border-cyan-500/10">
              <SyncCheckbox checked={isAllMembersDraft} onChange={toggleAllDraft} />
              <span className="text-sm font-medium text-cyan-300/90">Select all (all members)</span>
            </label>
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500 text-center">No members match your search.</p>
            ) : (
              filteredOptions.map((m) => {
                const id = String(m.id || m._id);
                const checked = emptyMeansAll
                  ? isAllMembersDraft || draftSelected.includes(id)
                  : draftSelected.includes(id);
                return (
                  <label
                    key={id}
                    className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/70 cursor-pointer"
                  >
                    <SyncCheckbox checked={checked} onChange={() => toggleOneDraft(id)} />
                    <span className="text-sm text-slate-200 whitespace-normal break-words leading-snug">
                      {memberLabel(m)}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <MultiSelectFooter
            countLabel={countLabel}
            onCancel={handleCancel}
            onOkay={handleOkay}
            okayDisabled={okayDisabled}
          />
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
