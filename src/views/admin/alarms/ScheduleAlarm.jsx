import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminGroups } from "../../../services/groups";
import { scheduleAlarm } from "../../../services/alarms";
import StatusSelect from "../../../components/ui/StatusSelect";
import TimePicker12h from "../../../components/ui/TimePicker12h";
import DatePickerField, { getTodayStr } from "../../../components/ui/DatePickerField";
import { previewSound } from "../../../components/alarm-popup/AlarmPopup";

const SOUND_OPTIONS = [
  {
    value: "beep",
    label: "Classic Beep",
    description: "Single sharp beep, repeating",
    icon: "📣",
  },
  {
    value: "siren",
    label: "Siren",
    description: "Rising & falling wail",
    icon: "🚨",
  },
  {
    value: "urgent",
    label: "Triple Beep",
    description: "Three rapid alert beeps",
    icon: "⚠️",
  },
  {
    value: "chime",
    label: "Chime",
    description: "Soft descending tones",
    icon: "🔔",
  },
];

const newTimeRow = () => ({
  id: crypto.randomUUID(),
  time: "07:00",
  status: "active",
});

const newDateBlock = () => ({
  id: crypto.randomUUID(),
  date: getTodayStr(),
  status: "active",
  times: [newTimeRow()],
});

export default function ScheduleAlarm() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [soundType, setSoundType] = useState("siren");
  const [dateBlocks, setDateBlocks] = useState([newDateBlock()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminGroups().then((res) => setGroups(res?.data || []));
  }, []);

  const updateDateBlock = (index, field, value) => {
    setDateBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  const updateTimeRow = (dateIndex, timeIndex, field, value) => {
    setDateBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== dateIndex) return b;
        const times = b.times.map((t, ti) =>
          ti === timeIndex ? { ...t, [field]: value } : t
        );
        return { ...b, times };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const schedules = dateBlocks.map((b) => ({
        date: b.date,
        status: b.status,
        times: b.times.map((t) => ({
          time: t.time,
          status: t.status,
        })),
      }));

      await scheduleAlarm({
        groupId,
        title,
        description,
        schedules,
        repeatType: "none",
        soundType,
      });
      navigate("/admin/alarms");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Schedule Alarm</h2>
        <p className="text-slate-400 text-sm mt-1">
          Pick date from calendar · 12-hour time · Green = active, Red = inactive
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
              required
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Alarm Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
              placeholder="Enter alarm title"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all h-20 resize-none"
            placeholder="Enter alarm description (optional)"
          />
        </div>

        {/* Sound picker */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">Alarm Sound</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SOUND_OPTIONS.map((opt) => {
              const active = soundType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSoundType(opt.value)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                    active
                      ? "border-red-500 bg-red-950/40 shadow-lg shadow-red-900/20"
                      : "border-slate-700 bg-slate-900 hover:border-slate-500"
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                  )}
                  <span className="text-2xl">{opt.icon}</span>
                  <span className={`text-xs font-semibold ${active ? "text-red-400" : "text-slate-300"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">{opt.description}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); previewSound(opt.value); }}
                    className="mt-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  >
                    ▶ Preview
                  </button>
                </button>
              );
            })}
          </div>
        </div>

        {dateBlocks.map((block, dateIndex) => (
          <div
            key={block.id}
            className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-sm font-medium text-slate-400 mb-2">Select date</label>
                <DatePickerField
                  value={block.date}
                  onChange={(v) => updateDateBlock(dateIndex, "date", v)}
                  min={getTodayStr()}
                  required
                />
              </div>
              <div className="min-w-[160px]">
                <label className="block text-sm font-medium text-slate-400 mb-2">Date status</label>
                <StatusSelect
                  value={block.status}
                  onChange={(v) => updateDateBlock(dateIndex, "status", v)}
                />
              </div>
              {dateBlocks.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setDateBlocks((p) => p.filter((_, i) => i !== dateIndex))
                  }
                  className="text-red-400 text-sm py-2 self-end hover:text-red-300 transition-colors"
                >
                  Remove date
                </button>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Alarm times (12-hour)</h4>
              <div className="space-y-3">
                {block.times.map((timeRow, timeIndex) => (
                  <div key={timeRow.id} className="flex flex-col sm:flex-row gap-3 items-start">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-400 mb-1">Time</label>
                      <TimePicker12h
                        value={timeRow.time}
                        onChange={(v) => updateTimeRow(dateIndex, timeIndex, "time", v)}
                      />
                    </div>
                    <div className="min-w-[140px]">
                      <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                      <StatusSelect
                        value={timeRow.status}
                        onChange={(v) => updateTimeRow(dateIndex, timeIndex, "status", v)}
                      />
                    </div>
                    {block.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDateBlocks((prev) =>
                            prev.map((b, i) =>
                              i === dateIndex
                                ? {
                                    ...b,
                                    times:
                                      b.times.length > 1
                                        ? b.times.filter((_, ti) => ti !== timeIndex)
                                        : b.times,
                                  }
                                : b
                            )
                          )
                        }
                        className="text-red-400 text-xs mt-6 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setDateBlocks((prev) =>
                    prev.map((b, i) =>
                      i === dateIndex ? { ...b, times: [...b.times, newTimeRow()] } : b
                    )
                  )
                }
                className="mt-3 text-sm px-3 py-1.5 rounded-lg border border-dashed border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400 transition-all"
              >
                + Add time
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setDateBlocks((p) => [...p, newDateBlock()])}
          className="w-full sm:w-auto text-sm px-4 py-2 rounded-lg border border-dashed border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400 transition-all"
        >
          + Add another date
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold text-white disabled:opacity-50 hover:shadow-lg hover:shadow-red-900/30 transition-all"
          >
            {loading ? "Saving..." : "Schedule Alarm"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/alarms")}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
