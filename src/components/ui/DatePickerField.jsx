const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-600 text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 cursor-pointer [color-scheme:dark]";

export default function DatePickerField({
  value,
  onChange,
  required,
  min,
  max,
  showHint = true,
  className = "",
  id,
}) {
  return (
    <div className={className}>
      <input
        id={id}
        type="date"
        value={value || ""}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={inputClass}
      />
      {showHint && (
        <p className="text-xs text-slate-500 mt-1">Tap to open calendar picker</p>
      )}
    </div>
  );
}

export { getTodayStr };
