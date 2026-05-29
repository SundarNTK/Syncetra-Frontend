import { useEffect, useState } from "react";
import { getAdminGroups } from "../../../services/groups";
import { testTriggerAlarm } from "../../../services/alarms";

export default function TestAlarm() {
  const [groups, setGroups] = useState([]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("Test Alarm");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminGroups().then((res) => setGroups(res?.data || []));
  }, []);

  const handleTrigger = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await testTriggerAlarm({
        mobileNumber,
        groupId: groupId || undefined,
        title,
        description: "Admin test trigger — check member phone now",
      });
      setResult(res?.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-red-400">Test Alarm Trigger</h2>
        <p className="text-slate-400 text-sm mt-2">
          Rings all members in the group (FCM + Socket). Member phone must be logged in as{" "}
          <strong>User</strong> with notifications allowed.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-600/50 bg-amber-950/30 p-4 text-sm text-amber-200/90 space-y-2">
        <p className="font-semibold">Before testing:</p>
        <ol className="list-decimal list-inside space-y-1 text-amber-200/80">
          <li>Member added in group with correct email + mobile</li>
          <li>Member logged in on phone (User tab, not Admin)</li>
          <li>Member allowed browser notifications</li>
          <li>Gmail configured if you expect invite email when adding member</li>
        </ol>
        <p className="text-xs">
          Adding a member does <strong>not</strong> ring the phone — only login OTP goes to email.
          Alarms use <strong>FCM push</strong>, not SMS.
        </p>
      </div>

      <form onSubmit={handleTrigger} className="space-y-4 bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
        <div>
          <label className="text-sm text-slate-400">Member mobile number *</label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-600"
            placeholder="9876543210"
            required
            minLength={10}
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Group (optional)</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-600"
          >
            <option value="">Auto — first group containing this mobile</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.groupName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400">Alarm title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-600"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-lg animate-pulse disabled:opacity-50"
        >
          {loading ? "Triggering..." : "TRIGGER TEST ALARM NOW"}
        </button>
      </form>

      {result && (
        <div className="rounded-2xl border border-green-600/50 bg-green-950/30 p-5 space-y-3 text-sm">
          <p className="text-green-400 font-bold text-lg">Alarm triggered</p>
          <p>
            Stop code (share with group):{" "}
            <span className="text-3xl font-mono font-bold text-amber-300">
              {result.stopCode}
            </span>
          </p>
          <p>Group: {result.groupName}</p>
          <p>
            Member: {result.targetUser?.name} · {result.targetUser?.email} ·{" "}
            {result.targetUser?.mobileNumber}
          </p>
          <p>
            FCM token on device:{" "}
            <span
              className={
                result.targetUser?.hasFcmToken ? "text-green-400" : "text-red-400"
              }
            >
              {result.targetUser?.hasFcmToken ? "Yes" : "No — login on phone first"}
            </span>
          </p>
          <p className="text-slate-400">{result.hint}</p>
        </div>
      )}
    </div>
  );
}
