import { useEffect, useMemo, useRef, useState } from "react";
import {
  SYNC_SELECT_LAYOUT,
  SYNC_SELECT_TRIGGER,
  SYNC_SELECT_TRIGGER_OPEN,
  SYNC_SELECT_TRIGGER_ALARM,
  SYNC_SELECT_TRIGGER_ALARM_OPEN,
  SYNC_SELECT_PANEL,
  SYNC_SELECT_SEARCH,
  SYNC_SELECT_OPTION,
  SYNC_SELECT_OPTION_ACTIVE,
  SYNC_SELECT_OPTION_IDLE,
  SYNC_SELECT_ICON,
  SYNC_SELECT_TRIGGER_LABEL,
  SYNC_SELECT_OPTION_LABEL,
  SYNC_SELECT_CHEVRON,
} from "./formControlStyles";

export const SELECT_TRIGGER_LAYOUT = SYNC_SELECT_LAYOUT;
export const SELECT_TRIGGER_DEFAULT = SYNC_SELECT_TRIGGER;

export function filterSelectOptions(options, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return options;
  return options.filter((opt) => {
    const hay = [opt.label, opt.sublabel, opt.value, opt.icon, ...(opt.keywords || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function ChevronDown({ open }) {
  return (
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
  );
}

function OptionRow({ opt, active }) {
  return (
    <>
      {opt.icon != null && opt.icon !== "" && (
        <span className={SYNC_SELECT_ICON} aria-hidden>
          {opt.icon}
        </span>
      )}
      <span className={`${SYNC_SELECT_OPTION_LABEL} min-w-0`}>
        <span className="block">{opt.label}</span>
        {opt.sublabel && (
          <span className="block text-[10px] text-slate-500 mt-0.5">{opt.sublabel}</span>
        )}
      </span>
    </>
  );
}

/**
 * Searchable single-select with futuristic styling.
 * options: { value, label, sublabel?, icon?, disabled?, keywords? }[]
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches",
  disabled = false,
  required = false,
  className = "",
  buttonClassName = "",
  searchable = true,
  searchThreshold = 1,
  variant = "default",
  id,
  name,
  "aria-label": ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const showSearch = searchable && options.length >= searchThreshold;

  const filtered = useMemo(
    () => filterSelectOptions(options, showSearch ? query : ""),
    [options, query, showSearch]
  );

  const isAlarm = variant === "alarm";
  const openRing = isAlarm ? SYNC_SELECT_TRIGGER_ALARM_OPEN : SYNC_SELECT_TRIGGER_OPEN;
  const variantTrigger = isAlarm ? SYNC_SELECT_TRIGGER_ALARM : "";

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, showSearch]);

  const pick = (opt) => {
    if (opt.disabled) return;
    onChange(String(opt.value));
    setOpen(false);
    setQuery("");
  };

  const triggerLabel = selected?.label || placeholder;
  const triggerMuted = !selected || (String(selected.value) === "" && !value);

  const triggerClasses = [
    SYNC_SELECT_LAYOUT,
    SYNC_SELECT_TRIGGER,
    variantTrigger,
    open ? openRing : "",
    buttonClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ""}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden
        />
      )}
      <button
        type="button"
        id={id}
        aria-label={ariaLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={triggerClasses}
        title={typeof triggerLabel === "string" ? triggerLabel : undefined}
      >
        {selected?.icon != null && selected.icon !== "" && (
          <span className={SYNC_SELECT_ICON} aria-hidden>
            {selected.icon}
          </span>
        )}
        <span className={`${SYNC_SELECT_TRIGGER_LABEL} ${triggerMuted ? "text-slate-500" : "text-slate-100"}`}>
          {triggerLabel}
        </span>
        <ChevronDown open={open} />
      </button>

      {open && (
        <div role="listbox" className={SYNC_SELECT_PANEL}>
          {showSearch && (
            <div className="p-2 border-b border-cyan-500/10">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={SYNC_SELECT_SEARCH}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500 text-center">{emptyMessage}</p>
            ) : (
              filtered.map((opt) => {
                const active = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={opt.disabled}
                    onClick={() => pick(opt)}
                    className={`${SYNC_SELECT_OPTION} ${active ? SYNC_SELECT_OPTION_ACTIVE : SYNC_SELECT_OPTION_IDLE}`}
                  >
                    <OptionRow opt={opt} active={active} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
