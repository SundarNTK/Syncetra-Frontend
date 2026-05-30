import { useEffect, useMemo, useState } from "react";
import { getGroupById } from "../../services/groups";
import { getTripMembers } from "../../services/trips";
import MemberMultiSelect from "../ui/MemberMultiSelect";
import SearchableSelect from "../ui/SearchableSelect";

export const ALARM_TARGET_OPTIONS = [
  { value: "group_all", label: "All group members" },
  { value: "trip_all", label: "All trip members" },
  { value: "selected", label: "Particular members" },
];

export function alarmTargetLabel(targetType) {
  const opt = ALARM_TARGET_OPTIONS.find((o) => o.value === targetType);
  return opt?.label || "All group members";
}

/**
 * Recipient targeting for alarms: group all, trip all, or multiselect members.
 */
export default function AlarmTargetFields({
  groups = [],
  groupId,
  targetType,
  targetMemberIds = [],
  onGroupIdChange,
  onTargetTypeChange,
  onTargetMemberIdsChange,
  selectClassName = "",
  variant = "default",
  labelClassName = "text-sm text-slate-400",
}) {
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const selectedGroup = useMemo(
    () => groups.find((g) => String(g._id) === String(groupId)),
    [groups, groupId]
  );

  const tripLinked = !!selectedGroup?.tripId;
  const tripDisabled = targetType === "trip_all" && !tripLinked;

  useEffect(() => {
    if (!groupId) {
      setMemberOptions([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoadingMembers(true);
      try {
        if (selectedGroup?.tripId) {
          const res = await getTripMembers(selectedGroup.tripId, true);
          const list = (res?.data || []).map((m) => ({
            _id: m._id || m.id,
            name: m.name,
            email: m.email,
            mobileNumber: m.mobileNumber,
          }));
          if (!cancelled) setMemberOptions(list);
          return;
        }

        const res = await getGroupById(groupId);
        const list = (res?.data?.memberDetails || []).map((m) => ({
          _id: m._id || m.id,
          name: m.name,
          email: m.email,
          mobileNumber: m.mobileNumber,
        }));
        if (!cancelled) setMemberOptions(list);
      } catch {
        if (!cancelled) setMemberOptions([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [groupId, selectedGroup?.tripId]);

  useEffect(() => {
    if (targetType === "trip_all" && !tripLinked && groupId) {
      onTargetTypeChange("group_all");
    }
  }, [targetType, tripLinked, groupId, onTargetTypeChange]);

  useEffect(() => {
    if (targetType !== "selected") onTargetMemberIdsChange([]);
  }, [targetType, groupId, onTargetMemberIdsChange]);

  const groupOptions = useMemo(
    () =>
      groups.map((g) => ({
        value: g._id,
        label: g.groupName,
        sublabel: g.tripId ? "Trip linked" : undefined,
      })),
    [groups]
  );

  const targetOptions = useMemo(
    () =>
      ALARM_TARGET_OPTIONS.map((opt) => ({
        ...opt,
        disabled: opt.value === "trip_all" && !tripLinked,
        sublabel:
          opt.value === "trip_all" && !tripLinked ? "Link group to a trip first" : undefined,
      })),
    [tripLinked]
  );

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClassName}>Group</label>
        <SearchableSelect
          value={groupId}
          onChange={onGroupIdChange}
          options={[{ value: "", label: "Select group" }, ...groupOptions]}
          placeholder="Select group"
          searchPlaceholder="Search groups…"
          required
          variant={variant}
          buttonClassName={selectClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>Send alert to</label>
        <SearchableSelect
          value={targetType}
          onChange={onTargetTypeChange}
          options={targetOptions}
          placeholder="Choose recipients"
          searchPlaceholder="Search options…"
          disabled={!groupId}
          searchable={false}
          variant={variant}
          buttonClassName={selectClassName}
        />
        {tripDisabled && (
          <p className="text-xs text-amber-400 mt-1">
            Link this group to a trip to alert all trip members.
          </p>
        )}
        {targetType === "group_all" && groupId && (
          <p className="text-xs text-slate-500 mt-1">
            Every member in the selected group will receive the alert.
          </p>
        )}
        {targetType === "trip_all" && tripLinked && (
          <p className="text-xs text-slate-500 mt-1">
            All members across groups linked to this trip will receive the alert.
          </p>
        )}
      </div>

      {targetType === "selected" && (
        <div>
          <label className={labelClassName}>Select members</label>
          <MemberMultiSelect
            options={memberOptions}
            value={targetMemberIds}
            onChange={onTargetMemberIdsChange}
            disabled={!groupId || loadingMembers}
            emptyMeansAll={false}
            requireSelection
            placeholder="Select one or more members"
            emptyHint={
              loadingMembers
                ? "Loading members…"
                : "No members found. Add members to the group or trip first."
            }
          />
        </div>
      )}
    </div>
  );
}

export function buildAlarmTargetPayload({ targetType, targetMemberIds }) {
  const payload = { targetType: targetType || "group_all" };
  if (targetType === "selected" && targetMemberIds?.length) {
    payload.targetMemberIds = targetMemberIds.map(String);
  }
  return payload;
}
