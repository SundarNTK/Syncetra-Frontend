const PLACEHOLDER_SLICE = {
  name: "No alarms",
  value: 1,
  color: "#334155",
};

/** Pie data for Recharts — uses a neutral full ring when every count is zero. */
export function alarmPieData(statusChart) {
  const rows = (statusChart || []).map((s) => ({
    name: s.name,
    value: Number(s.value) || 0,
    color: s.color || "#64748b",
  }));
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  if (total === 0) {
    return { data: [PLACEHOLDER_SLICE], isPlaceholder: true };
  }
  return { data: rows.filter((r) => r.value > 0), isPlaceholder: false };
}

/** Legend rows always reflect real counts (never the placeholder slice). */
export function alarmLegendRows(statusChart) {
  return (statusChart || []).map((s) => ({
    name: s.name,
    value: Number(s.value) || 0,
    color: s.color || "#64748b",
  }));
}
