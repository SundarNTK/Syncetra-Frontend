/**
 * Full-width shell for admin "master" list pages (Trips, Groups, Members, etc.)
 */
export default function MasterPageShell({ title, description, action, children, className = "" }) {
  return (
    <div className={`master-page w-full max-w-none space-y-4 sm:space-y-5 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            {title && <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>}
            {description && <p className="text-slate-400 text-sm mt-0.5">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function MasterList({ children, className = "" }) {
  return <ul className={`w-full space-y-3 ${className}`}>{children}</ul>;
}

export function MasterListItem({ children, className = "" }) {
  return (
    <li className={`w-full bg-slate-800 rounded-xl overflow-hidden flex ${className}`}>
      {children}
    </li>
  );
}

export function MasterListEmpty({ icon = "📋", message, children }) {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
      <span className="text-5xl opacity-30">{icon}</span>
      {message && <p className="text-slate-400 text-sm">{message}</p>}
      {children}
    </div>
  );
}
