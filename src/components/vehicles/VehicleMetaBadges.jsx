const metaBadgeCls =
  "inline-flex items-center gap-1.5 min-w-0 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg " +
  "bg-slate-800/90 border border-slate-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

/** Plate (🪪) + seat (💺) chips for vehicle card and detail views */
export default function VehicleMetaBadges({ vehicle, className = "" }) {
  if (!vehicle?.plateNumber && !vehicle?.totalSeats) return null;

  return (
    <div className={`flex flex-wrap items-stretch gap-2 w-full ${className}`}>
      {vehicle.plateNumber && (
        <span className={`${metaBadgeCls} flex-1 sm:flex-none sm:max-w-[min(100%,14rem)]`}>
          <span className="text-sm sm:text-base shrink-0 leading-none" aria-hidden>
            🪪
          </span>
          <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-200 truncate min-w-0">
            {vehicle.plateNumber}
          </span>
        </span>
      )}
      {vehicle.totalSeats > 0 && (
        <span className={`${metaBadgeCls} shrink-0`}>
          <span className="text-sm sm:text-base shrink-0 leading-none" aria-hidden>
            💺
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 whitespace-nowrap">
            {vehicle.totalSeats} seat{Number(vehicle.totalSeats) !== 1 ? "s" : ""}
          </span>
        </span>
      )}
    </div>
  );
}
