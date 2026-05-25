// ISO 8601 week helpers. Monday is day 1, week 1 is the week containing Jan 4.
// Used to bucket weekly-rollup posts onto the correct week regardless of when
// they were published (a Monday-morning post about "last week" needs to land
// in last week's bucket, not this week's).

function toUTCDate(dateStr) {
  // dateStr is "YYYY-MM-DD"; build a UTC midnight Date so day-of-week math
  // is timezone-independent.
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function isoWeekKey(dateStr) {
  const d = toUTCDate(dateStr);
  // ISO trick: shift date to the Thursday of the same week, then count weeks
  // from Jan 1 of *that* year. Day-of-week: Mon=1..Sun=7 (we use 7 for Sunday).
  const day = d.getUTCDay() || 7; // Sun (0) -> 7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${year}-W${pad2(week)}`;
}

export function isoWeekRange(weekKey) {
  // Reverse: from "YYYY-Www", return the Monday and Sunday dates as strings.
  const [yStr, wStr] = weekKey.split("-W");
  const year = Number(yStr);
  const week = Number(wStr);
  // ISO week 1 contains Jan 4. Find that Monday, add (week-1)*7 days.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (dt) =>
    `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
  return { start: fmt(monday), end: fmt(sunday) };
}

export function isoWeekLabel(weekKey) {
  const week = Number(weekKey.split("-W")[1]);
  const { start, end } = isoWeekRange(weekKey);
  const md = (iso) => {
    const [, m, d] = iso.split("-").map(Number);
    return `${m}/${d}`;
  };
  return `第 ${week} 週 · ${md(start)}–${md(end)}`;
}
