import DatePickerField from "./DatePickerField";
import TimePicker12h from "./TimePicker12h";
import DateTimePicker12h from "./DateTimePicker12h";

const fieldTypes = {
  date: DatePickerField,
  time: TimePicker12h,
  datetime: DateTimePicker12h,
};

export default function ChildTable({
  title,
  columns,
  rows,
  onAddRow,
  onRemoveRow,
  onChange,
  addLabel = "+ Add row",
}) {
  const renderField = (col, row, rowIndex) => {
    const value = row[col.key] ?? "";
    const handleChange = (val) => onChange(rowIndex, col.key, val);

    if (col.render) {
      return col.render(row, rowIndex, handleChange);
    }

    const type = col.type || "text";
    const Field = fieldTypes[type];

    if (Field) {
      return (
        <Field
          value={value}
          onChange={handleChange}
          required={col.required}
          min={col.min}
          max={col.max}
          showHint={false}
        />
      );
    }

    return (
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        type={type === "number" ? "number" : "text"}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100"
        placeholder={col.placeholder}
      />
    );
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/80 bg-slate-800/80">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <button
          type="button"
          onClick={onAddRow}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-medium transition"
        >
          {addLabel}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700/60">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 w-16" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  No rows yet. Click &quot;{addLabel}&quot; to add.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 align-top min-w-[140px]">
                      {renderField(col, row, rowIndex)}
                    </td>
                  ))}
                  <td className="px-4 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(rowIndex)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
