function resolveAssignedNames(task, members = []) {
  const fromAssigned = (task?.assignedTo || []).map((u) => {
    if (typeof u === "object") return u.name || u.email || null;
    const m = members.find((x) => String(x.id || x._id) === String(u));
    return m?.name || m?.email || null;
  }).filter(Boolean);

  if (fromAssigned.length) return fromAssigned;

  return (task?.acknowledgments || []).map((a) => {
    const user = a.userId;
    if (typeof user === "object") return user?.name || user?.email || null;
    return null;
  }).filter(Boolean);
}

export default function AssignedMemberChips({ task, members = [] }) {
  const names = resolveAssignedNames(task, members);
  if (!names.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold shrink-0">
        Assigned
      </span>
      {names.map((name, i) => (
        <span key={`${name}-${i}`} className="task-member-chip">
          {name}
        </span>
      ))}
    </div>
  );
}
