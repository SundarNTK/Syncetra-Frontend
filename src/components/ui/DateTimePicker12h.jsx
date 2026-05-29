import DatePickerField from "./DatePickerField";
import TimePicker12h from "./TimePicker12h";
import { combineDateAndTime, splitDateTime } from "../../utils/dateTimeUtils";

export default function DateTimePicker12h({
  value,
  onChange,
  dateMin,
  dateMax,
  showHint = true,
}) {
  const { date, time } = splitDateTime(value);

  const updateDate = (nextDate) => {
    onChange(combineDateAndTime(nextDate, time));
  };

  const updateTime = (nextTime) => {
    onChange(combineDateAndTime(date, nextTime));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
        <DatePickerField
          value={date}
          onChange={updateDate}
          min={dateMin}
          max={dateMax}
          showHint={false}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Time (12-hour)</label>
        <TimePicker12h value={time} onChange={updateTime} />
      </div>
      {showHint && (
        <p className="text-xs text-slate-500">Pick date from calendar and time in 12-hour format</p>
      )}
    </div>
  );
}

export { combineDateAndTime, splitDateTime };
