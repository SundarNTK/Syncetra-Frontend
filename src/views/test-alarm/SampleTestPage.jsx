import { useState } from "react";
import { Link } from "react-router-dom";
import { sampleTestTrigger } from "../../services/publicTest";
import { isDevEnv } from "../../config";

export default function SampleTestPage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [alertMessage, setAlertMessage] = useState("This is a test alarm. Please open the app.");
  const [title, setTitle] = useState("Test Alarm");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrigger = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await sampleTestTrigger({
        mobileNumber,
        title,
        description: alertMessage,
      });
      setResult(res?.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-slate-950 to-slate-900" />

      <Link
        to="/login"
        className="fixed top-4 left-4 z-50 px-4 py-2 rounded-xl bg-slate-800/90 border border-slate-600 text-sm hover:bg-slate-700"
      >
        ← Back to Login
      </Link>

      <div className="relative max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-3">
            SAMPLE TEST SCRIPT
          </span>
          <h1 className="text-3xl font-black text-red-400">Alarm Test by Mobile</h1>
          <p className="text-slate-400 text-sm mt-2">
            Triggers FCM + fullscreen alarm for member in group
          </p>
          {isDevEnv() && (
            <p className="text-xs text-green-400 mt-2">DEV mode — no admin login required</p>
          )}
        </div>

        <form
          onSubmit={handleTrigger}
          className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-2xl"
        >
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Member mobile number *
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
              className="w-full mt-2 px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-600 focus:border-red-500 text-lg font-mono"
              placeholder="9876543210"
              required
              minLength={10}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Alarm title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-950 border border-slate-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Alert message (shown on phone)
            </label>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-950 border border-slate-600 h-24"
              placeholder="Reach the van in 10 minutes!"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-600 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-lg shadow-lg shadow-red-900/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition"
          >
            {loading ? "Sending alarm..." : "🔔 TRIGGER TEST ALARM"}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-5 rounded-2xl bg-green-950/40 border-2 border-green-500 space-y-3 animate-slide-up">
            <p className="text-green-400 font-bold text-lg">Alarm sent!</p>
            <p className="text-sm">
              <span className="text-slate-400">Stop code:</span>{" "}
              <span className="text-3xl font-mono font-bold text-amber-300">
                {result.stopCode}
              </span>
            </p>
            <p className="text-sm text-slate-300">
              <strong>Message:</strong> {result.alertMessage}
            </p>
            <p className="text-sm">Group: {result.groupName}</p>
            <p className="text-sm">
              Member: {result.targetUser?.name} · {result.targetUser?.mobileNumber}
            </p>
            <p
              className={`text-sm font-semibold ${
                result.targetUser?.hasFcmToken ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.hint}
            </p>
          </div>
        )}

        <div className="mt-8 text-xs text-slate-500 space-y-1">
          <p>1. Member must exist in a group (admin adds name + email + mobile)</p>
          <p>2. Member logs in on phone as User + allows notifications</p>
          <p>3. Then use this page to trigger test alarm</p>
        </div>
      </div>
    </div>
  );
}
