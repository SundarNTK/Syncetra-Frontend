import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SYNC_SELECT_LAYOUT,
  SYNC_SELECT_TRIGGER,
  SYNC_SELECT_TRIGGER_OPEN,
} from "./formControlStyles";

const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_WIDTH = 320;
const PANEL_EST_HEIGHT = 380;
const PANEL_Z_INDEX = 10050;

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const getTodayStr = () => {
  const d = new Date();
  return toYmd(d);
};

export const toYmd = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const parseYmd = (ymd) => {
  if (!ymd) return null;
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
};

export const formatDisplayDate = (ymd) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}-${m}-${y}`;
};

const isDisabledDate = (ymd, min, max) => {
  if (!ymd) return true;
  if (min && ymd < min) return true;
  if (max && ymd > max) return true;
  return false;
};

function buildCalendarCells(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startDay - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    const d = new Date(year, month - 1, day);
    cells.push({ day, outside: true, ymd: toYmd(d) });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, outside: false, ymd: toYmd(new Date(year, month, day)) });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const d = new Date(year, month + 1, nextDay);
    cells.push({ day: nextDay, outside: true, ymd: toYmd(d) });
    nextDay += 1;
  }

  return cells;
}

function CalendarIcon() {
  return (
    <svg
      className="w-5 h-5 shrink-0 text-cyan-400/90"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function NavIcon({ dir }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {dir === "prev" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      )}
    </svg>
  );
}

function CalendarPanelContent({
  viewMonth,
  viewYear,
  shiftMonth,
  cells,
  value,
  today,
  min,
  max,
  pickDate,
  onChange,
  onClose,
}) {
  return (
    <>
      <div className="sync-date-panel__header">
        <div>
          <p className="sync-date-panel__month">{MONTHS[viewMonth]}</p>
          <p className="sync-date-panel__year">{viewYear}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="sync-date-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <NavIcon dir="prev" />
          </button>
          <button type="button" className="sync-date-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
            <NavIcon dir="next" />
          </button>
        </div>
      </div>

      <div className="sync-date-panel__weekdays">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="sync-date-weekday">
            {wd}
          </span>
        ))}
      </div>

      <div className="sync-date-panel__grid">
        {cells.map((cell) => {
          const selected = cell.ymd === value;
          const isToday = cell.ymd === today;
          const off = isDisabledDate(cell.ymd, min, max);
          return (
            <button
              key={`${cell.ymd}-${cell.outside ? "o" : "i"}`}
              type="button"
              disabled={off}
              onClick={() => pickDate(cell.ymd)}
              className={[
                "sync-date-day",
                cell.outside ? "sync-date-day--outside" : "",
                selected ? "sync-date-day--selected" : "",
                isToday && !selected ? "sync-date-day--today" : "",
                off ? "sync-date-day--disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="sync-date-panel__footer">
        <button
          type="button"
          className="sync-date-footer-btn"
          onClick={() => {
            onChange("");
            onClose();
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="sync-date-footer-btn sync-date-footer-btn--primary"
          disabled={isDisabledDate(today, min, max)}
          onClick={() => pickDate(today)}
        >
          Today
        </button>
      </div>
    </>
  );
}

function computePanelPosition(triggerEl) {
  if (!triggerEl) return null;
  const rect = triggerEl.getBoundingClientRect();
  const width = Math.min(PANEL_MAX_WIDTH, Math.max(rect.width, PANEL_MIN_WIDTH));
  let left = rect.left;
  if (left + width > window.innerWidth - 12) {
    left = window.innerWidth - width - 12;
  }
  left = Math.max(12, left);

  const gap = 6;
  let top = rect.bottom + gap;
  if (top + PANEL_EST_HEIGHT > window.innerHeight - 12) {
    top = Math.max(12, rect.top - PANEL_EST_HEIGHT - gap);
  }

  return {
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    zIndex: PANEL_Z_INDEX,
  };
}

export default function DatePickerField({
  value,
  onChange,
  required,
  min,
  max,
  showHint = true,
  className = "",
  id,
  disabled = false,
  placeholder = "dd-mm-yyyy",
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const today = getTodayStr();

  const initialView = parseYmd(value) || parseYmd(min) || new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    const parsed = parseYmd(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return undefined;
    }

    const updatePosition = () => {
      setPanelStyle(computePanelPosition(triggerRef.current));
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, viewYear, viewMonth]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pickDate = (ymd) => {
    if (isDisabledDate(ymd, min, max)) return;
    onChange(ymd);
    setOpen(false);
  };

  const display = value ? formatDisplayDate(value) : placeholder;
  const muted = !value;

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      {required && (
        <input
          type="text"
          value={value || ""}
          required
          readOnly
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
      )}

      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${SYNC_SELECT_LAYOUT} ${SYNC_SELECT_TRIGGER} ${
          open ? SYNC_SELECT_TRIGGER_OPEN : ""
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`flex-1 min-w-0 text-left tracking-wide ${muted ? "text-slate-500" : "text-slate-100"}`}>
          {display}
        </span>
        <CalendarIcon />
      </button>

      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            className="sync-date-panel sync-date-panel--floating"
            style={panelStyle}
            role="dialog"
            aria-label="Choose date"
          >
            <CalendarPanelContent
              viewMonth={viewMonth}
              viewYear={viewYear}
              shiftMonth={shiftMonth}
              cells={cells}
              value={value}
              today={today}
              min={min}
              max={max}
              pickDate={pickDate}
              onChange={onChange}
              onClose={() => setOpen(false)}
            />
          </div>,
          document.body
        )}

      {showHint && (
        <p className="text-xs text-slate-500 mt-1.5">Pick a date from the calendar</p>
      )}
    </div>
  );
}