export function tripPhase(trip) {
  const now = Date.now();
  const start = trip?.startDate ? new Date(trip.startDate).getTime() : null;
  const end = trip?.endDate ? new Date(trip.endDate).getTime() : null;
  if (!start) return "upcoming";
  if (now < start) return "upcoming";
  if (!end || now <= end) return "active";
  return "completed";
}

export function phaseBadge(phase) {
  if (phase === "active") return "bg-emerald-600/30 text-emerald-300 border-emerald-500/50";
  if (phase === "upcoming") return "bg-sky-600/30 text-sky-300 border-sky-500/50";
  return "bg-yellow-900/40 text-yellow-300 border-yellow-600/50";
}

export function fmtTripDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtTripDateShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}
