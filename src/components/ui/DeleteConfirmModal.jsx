import { useEffect } from "react";

const IconTrash = () => (
  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/**
 * Shared confirmation dialog for delete / remove / cancel actions on master records.
 */
export default function DeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  loading = false,
  title = "Confirm deletion",
  message = "Shall we proceed to delete this record?",
  recordLabel = "",
  confirmLabel = "Yes, proceed",
  cancelLabel = "Cancel",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
      onClick={() => !loading && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      <div
        className="bg-slate-900 border border-red-900/50 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
            <IconTrash />
          </div>
          <div className="min-w-0">
            <h3 id="delete-confirm-title" className="text-white font-semibold text-base">
              {title}
            </h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
            {recordLabel ? (
              <p className="text-sm text-slate-200 mt-2 font-medium truncate" title={recordLabel}>
                {recordLabel}
              </p>
            ) : null}
            <p className="text-xs text-slate-500 mt-2">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
