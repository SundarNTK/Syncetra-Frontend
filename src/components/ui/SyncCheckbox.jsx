/** Futuristic checkbox — use instead of raw type="checkbox" inputs */
export default function SyncCheckbox({ className = "", ...props }) {
  return <input type="checkbox" className={`sync-checkbox ${className}`.trim()} {...props} />;
}
