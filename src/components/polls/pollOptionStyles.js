/** Distinct glow class per poll option index (cycles 0–7). */
export function pollOptionGlowClass(index) {
  return `poll-opt-glow poll-opt-glow--${Number(index) % 8}`;
}

/** Per-option accent color — matches the glow color for that index. */
export const OPT_COLORS = [
  "#22d3ee", // 0 cyan
  "#d946ef", // 1 fuchsia
  "#f59e0b", // 2 amber
  "#34d399", // 3 emerald
  "#fb7185", // 4 rose
  "#818cf8", // 5 indigo
  "#fb923c", // 6 orange
  "#38bdf8", // 7 sky
];

/** Animated gradient background for the option title/header row. */
export function pollOptionHeaderStyle(index) {
  const c = OPT_COLORS[Number(index) % 8];
  return {
    background: `linear-gradient(110deg, ${c}28 0%, ${c}10 35%, rgba(2,6,23,0.92) 65%, rgba(15,23,42,0.6) 100%)`,
    backgroundSize: "200% 100%",
    animation: "pollOptHeaderShimmer 5s ease-in-out infinite alternate",
  };
}

/** Animated gradient text style for regular (non-leading/winner) option labels. */
export function pollOptionLabelStyle(index) {
  const c = OPT_COLORS[Number(index) % 8];
  return {
    background: `linear-gradient(90deg, ${c}dd, #f8fafc 50%, ${c}bb)`,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "pollOptLabelShimmer 3s linear infinite",
    fontWeight: 700,
    letterSpacing: "0.01em",
  };
}
