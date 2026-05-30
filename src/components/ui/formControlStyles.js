/** Shared futuristic form control styles — dropdowns, dates, native selects */

export const SYNC_SELECT_LAYOUT =
  "w-full flex flex-row items-center gap-2.5 text-left min-h-[2.75rem]";

export const SYNC_SELECT_TRIGGER =
  "px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 " +
  "bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 " +
  "border border-cyan-500/25 text-slate-100 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(6,182,212,0.06)] " +
  "hover:border-cyan-400/45 hover:shadow-[0_0_16px_rgba(6,182,212,0.08)] " +
  "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

export const SYNC_SELECT_TRIGGER_OPEN =
  "border-cyan-400/55 ring-2 ring-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.12)]";

export const SYNC_SELECT_PANEL =
  "absolute z-50 mt-1.5 left-0 min-w-full w-max max-w-[min(calc(100vw-1.5rem),36rem)] rounded-xl overflow-hidden " +
  "bg-slate-950/95 backdrop-blur-xl border border-cyan-500/20 " +
  "shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(6,182,212,0.06)]";

export const SYNC_SELECT_SEARCH =
  "w-full min-w-[10rem] box-border px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 " +
  "bg-slate-900/80 border border-cyan-500/20 " +
  "focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20";

export const SYNC_SELECT_OPTION =
  "w-full flex items-start gap-2.5 px-3 py-2.5 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const SYNC_SELECT_OPTION_ACTIVE = "bg-cyan-950/45 text-cyan-200";
export const SYNC_SELECT_OPTION_IDLE = "text-slate-200 hover:bg-slate-800/70";

export const SYNC_SELECT_ICON = "text-base leading-none shrink-0 w-6 text-center mt-0.5";

/** Closed trigger — ellipsis ok when narrow */
export const SYNC_SELECT_TRIGGER_LABEL = "flex-1 min-w-0 truncate text-left";

/** Open list — show full text, wrap if needed */
export const SYNC_SELECT_OPTION_LABEL = "flex-1 min-w-0 text-left whitespace-normal break-words leading-snug";

export const SYNC_SELECT_LABEL = SYNC_SELECT_TRIGGER_LABEL;

export const SYNC_SELECT_CHEVRON =
  "w-4 h-4 shrink-0 text-cyan-400/80 pointer-events-none ml-auto transition-transform duration-200";

/** Alarm / danger contexts */
export const SYNC_SELECT_TRIGGER_ALARM =
  "border-red-500/30 hover:border-red-400/45 focus:ring-red-500/20 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(239,68,68,0.08)]";

export const SYNC_SELECT_TRIGGER_ALARM_OPEN =
  "border-red-400/55 ring-2 ring-red-500/25 shadow-[0_0_20px_rgba(239,68,68,0.12)]";

export const SYNC_DATE_INPUT =
  "sync-date-input w-full min-h-[2.75rem] px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-100 " +
  "bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 " +
  "border border-cyan-500/25 cursor-pointer transition-all duration-200 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] " +
  "hover:border-cyan-400/45 focus:border-cyan-400/55 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 " +
  "[color-scheme:dark]";

export const SYNC_NATIVE_SELECT =
  "sync-native-select w-full min-h-[2.75rem] px-3.5 py-2.5 pr-10 rounded-xl text-sm font-medium text-slate-100 " +
  "bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 " +
  "border border-cyan-500/25 cursor-pointer transition-all duration-200 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] " +
  "hover:border-cyan-400/45 focus:border-cyan-400/55 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";
