import SearchableSelect from "./SearchableSelect";

const STATUS_OPTIONS = [
  { value: "active", label: "● Active" },
  { value: "inactive", label: "● Inactive" },
];

export default function StatusSelect({ value, onChange, className = "" }) {
  const isActive = value === "active";

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={STATUS_OPTIONS}
      searchable={false}
      searchThreshold={99}
      placeholder="Select status"
      className={className}
      buttonClassName={`font-semibold ${
        isActive
          ? "border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
          : "border-red-500/35 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.06)]"
      }`}
    />
  );
}
