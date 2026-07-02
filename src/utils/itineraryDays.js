import { toDateInputValue } from "./dateTimeUtils";

/**
 * Groups itinerary points into Day 1..N buckets anchored to the trip's startDate.
 * Falls back to the earliest visitDate among the items when the trip has no
 * startDate/endDate set yet, so the tabs still make sense for unplanned trips.
 * Points with no visitDate, or a visitDate outside the trip's date range,
 * land in `unscheduled`.
 */
export const groupItineraryByDay = (items, trip) => {
  const dated = items.filter((i) => i.visitDate);
  const undated = items.filter((i) => !i.visitDate);

  let anchorKey = trip?.startDate ? toDateInputValue(trip.startDate) : "";
  if (!anchorKey) {
    const sortedDates = dated.map((i) => toDateInputValue(i.visitDate)).filter(Boolean).sort();
    anchorKey = sortedDates[0] || "";
  }

  if (!anchorKey) {
    return { days: [], unscheduled: [...undated, ...dated] };
  }

  const anchor = new Date(`${anchorKey}T00:00:00`);
  const dayNoFor = (dateKey) => {
    if (!dateKey) return null;
    const diff = Math.round((new Date(`${dateKey}T00:00:00`) - anchor) / 86400000);
    return diff + 1;
  };

  let dayCount = 1;
  if (trip?.startDate && trip?.endDate) {
    const endKey = toDateInputValue(trip.endDate);
    const diff = Math.round((new Date(`${endKey}T00:00:00`) - anchor) / 86400000);
    dayCount = Math.max(dayCount, diff + 1);
  }
  for (const item of dated) {
    const n = dayNoFor(toDateInputValue(item.visitDate));
    if (n && n > dayCount) dayCount = n;
  }

  const days = [];
  for (let n = 1; n <= dayCount; n++) {
    const date = new Date(anchor.getTime() + (n - 1) * 86400000);
    days.push({ dayNo: n, date, dateKey: toDateInputValue(date), items: [] });
  }
  const dayByNo = new Map(days.map((d) => [d.dayNo, d]));

  const outOfRange = [];
  for (const item of dated) {
    const n = dayNoFor(toDateInputValue(item.visitDate));
    const bucket = n != null ? dayByNo.get(n) : null;
    if (bucket) bucket.items.push(item);
    else outOfRange.push(item);
  }

  for (const d of days) {
    d.items.sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
  }

  return { days, unscheduled: [...undated, ...outOfRange] };
};
