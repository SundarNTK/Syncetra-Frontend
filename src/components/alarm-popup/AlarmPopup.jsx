import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../hooks";
import { CLEAR_ACTIVE_ALARM } from "../../store/userSlice";
import { stopAlarm } from "../../services/alarms";

// ─── Sound patterns ───────────────────────────────────────────────────────────
// Each entry: { play(ctx) → void, interval: ms between repeats }
const SOUNDS = {
  beep: {
    play(ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = 880;
      // 1.0 = Web Audio API maximum — does not exceed device volume, but uses all of it.
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    },
    interval: 1100,
  },

  siren: {
    play(ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      gain.gain.value = 1.0;
      // sweep up then down
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1300, ctx.currentTime + 0.55);
      osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 1.1);
      osc.start();
      osc.stop(ctx.currentTime + 1.1);
    },
    interval: 1150,
  },

  urgent: {
    play(ctx) {
      // three sharp beeps: 0ms · 220ms · 440ms
      [0, 0.22, 0.44].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.value = 1050;
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.start(t);
        osc.stop(t + 0.16);
      });
    },
    interval: 1400,
  },

  chime: {
    play(ctx) {
      // descending musical tones: A5 → F5 → C5
      [880, 698, 523].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.28;
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    },
    interval: 2000,
  },
};

export function previewSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const pattern = SOUNDS[type] || SOUNDS.beep;
    pattern.play(ctx);
  } catch {
    /* ignore */
  }
}

// ─── AlarmPopup ───────────────────────────────────────────────────────────────
export default function AlarmPopup({ alarm, onStopped }) {
  const dispatch = useAppDispatch();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const pattern = SOUNDS[alarm?.soundType] || SOUNDS.siren;

    // One AudioContext per alarm instance — reused across ticks to avoid the
    // browser's 6-context-per-page limit and prevent resource leaks.
    // AudioContext must be created inside a user-gesture handler OR resumed here.
    // AlarmPopup only mounts after a user-gesture (notification tap or socket
    // event after prior interaction), so creation is permitted.
    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Resume handles the case where the context starts in "suspended" state
      // on browsers that require a prior gesture before allowing audio.
      if (ctx.state === "suspended") ctx.resume();
    } catch {
      ctx = null;
    }

    const playOnce = () => {
      if (!ctx) return;
      try {
        // Resume on every tick — some browsers re-suspend after inactivity.
        if (ctx.state === "suspended") ctx.resume();
        pattern.play(ctx);
      } catch {
        /* ignore */
      }
    };

    playOnce();
    intervalRef.current = setInterval(playOnce, pattern.interval);

    if ("vibrate" in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    return () => {
      document.body.style.overflow = "";
      clearInterval(intervalRef.current);
      ctx?.close();
    };
  }, [alarm?.soundType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const alarmId = alarm.alarmId || alarm._id || alarm.id;
      if (!alarmId) {
        throw new Error("Alarm id missing. Close the app and open the alarm again.");
      }
      await stopAlarm(alarmId, code);
      clearInterval(intervalRef.current);
      dispatch(CLEAR_ACTIVE_ALARM());
      onStopped?.();
    } catch (err) {
      setError(err.message || "Incorrect code");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-red-700 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🚨</div>
        <h2 className="text-3xl font-black uppercase tracking-wide text-white">
          {alarm.title}
        </h2>
        {alarm.description && (
          <p className="text-white/90 mt-2 text-lg">{alarm.description}</p>
        )}
        <p className="text-white/80 mt-4 text-sm">
          Enter the 4-digit code from your group admin to stop this alarm
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full text-center text-4xl font-mono tracking-[0.5em] py-4 rounded-xl bg-white text-red-700"
          placeholder="••••"
          autoFocus
          autoComplete="off"
        />
        {error && (
          <p className="text-white bg-black/30 rounded mt-3 py-2 text-center text-sm">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={code.length !== 4 || loading}
          className="w-full mt-4 py-4 rounded-xl bg-slate-900 text-white font-bold text-lg disabled:opacity-50"
        >
          {loading ? "Checking..." : "STOP ALARM"}
        </button>
      </form>
    </div>
  );
}
