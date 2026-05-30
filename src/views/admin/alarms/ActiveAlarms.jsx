import { useEffect, useState } from "react";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import {
  getActiveAdminAlarms,
  getStopCode,
  cancelAlarm,
  triggerEmergency,
} from "../../../services/alarms";
import { getAdminGroups } from "../../../services/groups";
import MasterPageShell, { MasterList, MasterListItem } from "../../../components/layout/MasterPageShell";
import AlarmTargetFields, {
  alarmTargetLabel,
  buildAlarmTargetPayload,
} from "../../../components/alarms/AlarmTargetFields";

const emptyEmergency = () => ({
  groupId: "",
  title: "",
  targetType: "group_all",
  targetMemberIds: [],
});

export default function ActiveAlarms() {
  const [alarms, setAlarms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [codes, setCodes] = useState({});
  const [emergency, setEmergency] = useState(emptyEmergency);
  const [submitting, setSubmitting] = useState(false);
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  const load = async () => {
    const [a, g] = await Promise.all([getActiveAdminAlarms(), getAdminGroups()]);
    setAlarms(a?.data || []);
    setGroups(g?.data || []);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const revealCode = async (id) => {
    try {
      const res = await getStopCode(id);
      setCodes((prev) => ({ ...prev, [id]: res?.data?.stopCode }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = (id) => {
    const alarm = alarms.find((a) => a._id === id);
    confirmDelete({
      title: "Confirm cancellation",
      message: "Shall we proceed to cancel this alarm?",
      confirmLabel: "Yes, proceed",
      recordLabel: alarm?.title || alarm?.alarmType,
      onConfirm: async () => {
        await cancelAlarm(id);
        load();
      },
    });
  };

  const handleEmergency = async (e) => {
    e.preventDefault();
    if (emergency.targetType === "selected" && !emergency.targetMemberIds.length) {
      alert("Select at least one member for particular-member alerts.");
      return;
    }

    setSubmitting(true);
    try {
      await triggerEmergency({
        groupId: emergency.groupId,
        title: emergency.title || "EMERGENCY ALERT",
        description: "Immediate group alert",
        ...buildAlarmTargetPayload(emergency),
      });
      setEmergency(emptyEmergency());
      load();
    } catch (err) {
      alert(err.message || "Could not trigger alarm");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MasterPageShell title="Active Alarms">
      <form
        onSubmit={handleEmergency}
        className="mb-6 p-4 bg-red-950 border border-red-600 rounded-xl space-y-3"
      >
        <h3 className="font-semibold text-red-400">Emergency Instant Alarm</h3>

        <AlarmTargetFields
          groups={groups}
          groupId={emergency.groupId}
          targetType={emergency.targetType}
          targetMemberIds={emergency.targetMemberIds}
          onGroupIdChange={(groupId) => setEmergency((prev) => ({ ...prev, groupId }))}
          onTargetTypeChange={(targetType) =>
            setEmergency((prev) => ({ ...prev, targetType, targetMemberIds: [] }))
          }
          onTargetMemberIdsChange={(targetMemberIds) =>
            setEmergency((prev) => ({ ...prev, targetMemberIds }))
          }
          variant="alarm"
        />

        <input
          value={emergency.title}
          onChange={(e) => setEmergency({ ...emergency, title: e.target.value })}
          placeholder="Alert title"
          className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Triggering…" : "TRIGGER NOW"}
        </button>
      </form>

      {alarms.length === 0 ? (
        <p className="text-slate-400">No active alarms.</p>
      ) : (
        <MasterList>
          {alarms.map((a) => (
            <MasterListItem key={a._id} className="master-list-item flex-col bg-red-900/30 border border-red-600">
              <div className="p-4 w-full">
                <h3 className="font-bold text-base sm:text-lg">{a.title}</h3>
                <p className="text-sm text-slate-300">{a.description}</p>
                <p className="text-xs text-slate-400 mt-1">Status: {a.status}</p>
                <p className="text-xs text-slate-400">
                  Recipients: {alarmTargetLabel(a.targetType)}
                  {a.targetType === "selected" && a.targetMemberIds?.length
                    ? ` (${a.targetMemberIds.length} selected)`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => revealCode(a._id)}
                    className="text-sm px-3 py-2 bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Reveal Stop Code
                  </button>
                  <button
                    onClick={() => handleCancel(a._id)}
                    className="text-sm px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {codes[a._id] && (
                  <p className="mt-2 text-2xl sm:text-3xl font-mono font-bold tracking-widest text-amber-300 break-all">
                    {codes[a._id]}
                  </p>
                )}
              </div>
            </MasterListItem>
          ))}
        </MasterList>
      )}
      {deleteModal}
    </MasterPageShell>
  );
}
