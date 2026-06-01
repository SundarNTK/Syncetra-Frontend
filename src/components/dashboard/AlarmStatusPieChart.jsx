import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { alarmPieData, alarmLegendRows } from "../../utils/alarmChartUtils";

function ChartTooltip({ active, payload, isPlaceholder }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const name = entry.name || entry.payload?.name || "";
  const value = entry.value ?? 0;
  const color = entry.payload?.color || "#64748b";

  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        background: "rgba(15, 23, 42, 0.96)",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      }}
    >
      <p className="text-slate-300 font-medium flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        {isPlaceholder ? "No alarms recorded" : `${name} : ${value}`}
      </p>
    </div>
  );
}

export default function AlarmStatusPieChart({ statusChart, innerRadius = 45, outerRadius = 70 }) {
  const { data, isPlaceholder } = alarmPieData(statusChart);
  const legend = alarmLegendRows(statusChart);

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={isPlaceholder ? 0 : 4}
              stroke="none"
            >
              {data.map((e, i) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              content={<ChartTooltip isPlaceholder={isPlaceholder} />}
            />
          </PieChart>
        </ResponsiveContainer>
        {isPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold text-slate-500">No alarms</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-1">
        {legend.map((s) => (
          <span key={s.name} className="text-xs flex items-center gap-1.5 text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
            />
            {s.name}: <span className="text-white font-semibold">{s.value}</span>
          </span>
        ))}
      </div>
    </>
  );
}
