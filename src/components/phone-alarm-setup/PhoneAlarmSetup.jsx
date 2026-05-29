import { useCallback, useEffect, useState } from "react";
import { registerDeviceForPush } from "../../utils/fcm";
import { useAppSelector } from "../../hooks";

export default function PhoneAlarmSetup() {
  const userInfo = useAppSelector((s) => s.user.userInfo);
  const role = userInfo?.user?.role;
  const token = userInfo?.token;
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSetup = useCallback(async () => {
    setLoading(true);
    const result = await registerDeviceForPush(null, token);
    setStatus(result);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (role === "user") {
      runSetup();
    }
  }, [role, runSetup]);

  if (role !== "user") return null;

  const ready = status?.ok;
  const needsHttps =
    typeof window !== "undefined" &&
    window.location.protocol === "http:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        ready
          ? "border-green-600/50 bg-green-950/30"
          : "border-amber-600/50 bg-amber-950/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Phone alarm setup</h3>
          <p className="text-sm text-slate-400 mt-1">
            Admin sees <strong>Ready</strong> only after this device registers for push.
          </p>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            ready
              ? "bg-green-600/30 text-green-400"
              : "bg-amber-600/30 text-amber-300"
          }`}
        >
          {ready ? "Ready on this phone" : "Not registered yet"}
        </span>
      </div>

      {needsHttps && (
        <p className="mt-3 text-sm text-amber-200">
          You opened the app over <strong>HTTP</strong>. Mobile push needs{" "}
          <strong>HTTPS</strong>. On your PC run <code className="text-xs">pnpm dev</code>{" "}
          and open{" "}
          <strong>
            https://{window.location.hostname}:5173
          </strong>{" "}
          (accept the security warning on your phone).
        </p>
      )}

      {status && !status.ok && (
        <p className="mt-3 text-sm text-red-300">{status.message}</p>
      )}

      {status?.ok && (
        <p className="mt-3 text-sm text-green-300">
          This phone is linked. Ask admin to refresh View members — status should show{" "}
          <strong>Ready</strong>.
        </p>
      )}

      <ul className="mt-4 text-sm text-slate-300 space-y-1 list-disc list-inside">
        <li>Use Chrome on Android (best support)</li>
        <li>Tap <strong>Allow</strong> when asked for notifications</li>
        <li>If blocked: browser Settings → Site settings → Notifications → Allow</li>
        <li>Stay signed in as <strong>User</strong> (not Admin)</li>
      </ul>

      <button
        type="button"
        onClick={runSetup}
        disabled={loading}
        className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Checking…" : "Enable phone alarms again"}
      </button>
    </div>
  );
}
