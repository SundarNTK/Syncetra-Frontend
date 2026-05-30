import { SYNC_NATIVE_SELECT } from "./formControlStyles";

export default function StatusSelect({ value, onChange, className = "" }) {
  const isActive = value === "active";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${SYNC_NATIVE_SELECT} font-semibold ${
        isActive
          ? "border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
          : "border-red-500/35 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.06)]"
      } ${className}`}
    >
      <option value="active" className="bg-slate-900 text-green-400">
        ● Active
      </option>
      <option value="inactive" className="bg-slate-900 text-red-400">
        ● Inactive
      </option>
    </select>
  );
}
