/**
 * Centered success / error popup for master create, edit, and update actions.
 */
export default function ActionPopup({
  open = false,
  message = "",
  type = "success",
  title,
  onClose,
}) {
  if (!open || !message) return null;

  const isSuccess = type === "success";
  const heading = title || (isSuccess ? "Success" : "Something went wrong");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl px-6 py-8 text-center
          ${isSuccess
            ? "bg-slate-900 border-emerald-700/60"
            : "bg-slate-900 border-red-700/60"
          }`}
        role="alertdialog"
        aria-labelledby="action-popup-title"
        aria-describedby="action-popup-message"
      >
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold
            ${isSuccess ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}
        >
          {isSuccess ? "✓" : "✕"}
        </div>
        <p
          id="action-popup-title"
          className={`text-xs uppercase tracking-widest font-semibold mb-2 ${isSuccess ? "text-emerald-400/80" : "text-red-400/80"}`}
        >
          {heading}
        </p>
        <p
          id="action-popup-message"
          className={`text-sm font-medium leading-relaxed ${isSuccess ? "text-emerald-100" : "text-red-200"}`}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors
            ${isSuccess
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
