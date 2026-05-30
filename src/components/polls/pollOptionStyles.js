/** Distinct glow class per poll option index (cycles 0–7). */
export function pollOptionGlowClass(index) {
  return `poll-opt-glow poll-opt-glow--${Number(index) % 8}`;
}
