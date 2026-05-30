export function TripStatBox({ label, value, icon, accent = "indigo" }) {
  const accents = {
    indigo: "border-indigo-500/25 bg-indigo-950/20",
    emerald: "border-emerald-500/25 bg-emerald-950/20",
    amber: "border-amber-500/25 bg-amber-950/20",
    sky: "border-sky-500/25 bg-sky-950/20",
    slate: "border-slate-600/50 bg-slate-800/40",
  };

  return (
    <div
      className={`rounded-xl px-3 py-2.5 border ${accents[accent] || accents.slate}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {icon ? `${icon} ` : ""}
        {label}
      </p>
      <p className="text-sm sm:text-base font-bold text-white mt-1 truncate">{value}</p>
    </div>
  );
}

export function TripDateRangeBoxes({ startDate, endDate, className = "" }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <TripStatBox label="Start Date" value={startDate} icon="📅" accent="sky" />
      <TripStatBox label="End Date" value={endDate} icon="🏁" accent="emerald" />
    </div>
  );
}
