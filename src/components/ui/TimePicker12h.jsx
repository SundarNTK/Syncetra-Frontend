import { SYNC_NATIVE_SELECT } from "./formControlStyles";

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

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const timeSelectCls = `${SYNC_NATIVE_SELECT} min-w-[4.25rem] py-2`;

export default function TimePicker12h({ value, onChange }) {
  const { hour12, minute, ampm } = parse24h(value);

  const update = (h, m, ap) => {
    onChange(to24h(h, m, ap));
  };

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <select
        value={hour12}
        onChange={(e) => update(e.target.value, minute, ampm)}
        className={timeSelectCls}
        aria-label="Hour"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-cyan-400/60 font-bold text-lg leading-none">:</span>
      <select
        value={minute}
        onChange={(e) => update(hour12, e.target.value, ampm)}
        className={timeSelectCls}
        aria-label="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={ampm}
        onChange={(e) => update(hour12, minute, e.target.value)}
        className={`${timeSelectCls} min-w-[4.75rem] font-semibold ${
          ampm === "AM"
            ? "border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.08)]"
            : "border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.08)]"
        }`}
        aria-label="AM or PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
