import { useEffect, useState } from "react";
import SearchableSelect from "./SearchableSelect";
import { SYNC_SELECT_TRIGGER } from "./formControlStyles";

/** Converts 24h "HH:mm" to { hour12, minute, ampm } */
export const parse24h = (time24) => {
  if (!time24) return { hour12: "7", minute: "00", ampm: "AM" };
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return {
    hour12: String(hour12),
    minute: String(m).padStart(2, "0"),
    ampm,
  };
};

/** Converts 12h parts to 24h "HH:mm" */
export const to24h = (hour12, minute, ampm) => {
  let h = parseInt(hour12, 10) % 12;
  if (ampm === "PM") h += 12;
  if (ampm === "AM" && parseInt(hour12, 10) === 12) h = 0;
  if (ampm === "PM" && parseInt(hour12, 10) === 12) h = 12;
  return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const AMPM_OPTIONS = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

const compactSelect = "min-w-[4.25rem] py-2";
const numFieldCls = `${SYNC_SELECT_TRIGGER} w-[4.5rem] min-w-[4.5rem] py-2 text-center`;

export default function TimePicker12h({ value, onChange }) {
  const { hour12, minute, ampm } = parse24h(value);

  // Free-typing drafts — clamped/padded only on blur or Enter, so the field
  // doesn't fight the user while they're still typing a number.
  const [hourDraft, setHourDraft] = useState(hour12);
  const [minuteDraft, setMinuteDraft] = useState(minute);

  useEffect(() => { setHourDraft(hour12); }, [hour12]);
  useEffect(() => { setMinuteDraft(minute); }, [minute]);

  const update = (h, m, ap) => onChange(to24h(h, m, ap));

  const commitHour = (raw) => {
    let h = parseInt(raw, 10);
    if (!Number.isFinite(h)) h = parseInt(hour12, 10);
    h = Math.min(12, Math.max(1, h));
    setHourDraft(String(h));
    update(String(h), minute, ampm);
  };

  const commitMinute = (raw) => {
    let m = parseInt(raw, 10);
    if (!Number.isFinite(m)) m = parseInt(minute, 10);
    m = Math.min(59, Math.max(0, m));
    const padded = String(m).padStart(2, "0");
    setMinuteDraft(padded);
    update(hour12, padded, ampm);
  };

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={12}
        value={hourDraft}
        onChange={(e) => setHourDraft(e.target.value)}
        onBlur={(e) => commitHour(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitHour(e.target.value); } }}
        aria-label="Hour"
        className={numFieldCls}
      />
      <span className="text-cyan-400/60 font-bold text-lg leading-none">:</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={59}
        value={minuteDraft}
        onChange={(e) => setMinuteDraft(e.target.value)}
        onBlur={(e) => commitMinute(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitMinute(e.target.value); } }}
        aria-label="Minute"
        className={numFieldCls}
      />
      <SearchableSelect
        value={ampm}
        onChange={(v) => update(hour12, minute, v)}
        options={AMPM_OPTIONS}
        searchable={false}
        searchThreshold={99}
        className="w-auto shrink-0"
        buttonClassName={`${compactSelect} min-w-[4.75rem] font-semibold ${
          ampm === "AM"
            ? "border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.08)]"
            : "border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.08)]"
        }`}
        aria-label="AM or PM"
      />
    </div>
  );
}
