export default function StatusSelect({ value, onChange, className = "" }) {
  const isActive = value === "active";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 rounded-xl border-2 font-semibold text-sm transition-colors cursor-pointer ${
        isActive
          ? "bg-green-600/25 border-green-500 text-green-300"
          : "bg-red-600/25 border-red-500 text-red-300"
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
