/** YYYY-MM-DD in local timezone */
export const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** HH:mm (24h) in local timezone */
export const toTimeInputValue = (value) => {
  if (!value) return "07:00";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "07:00";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const combineDateAndTime = (date, time24) => {
  if (!date || !time24) return "";
  const [h, m] = time24.split(":");
  const local = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  if (Number.isNaN(local.getTime())) return "";
  return local.toISOString();
};

export const splitDateTime = (value) => ({
  date: toDateInputValue(value),
  time: toTimeInputValue(value),
});

export const formatTime12hDisplay = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export const formatDateTimeDisplay = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
};
