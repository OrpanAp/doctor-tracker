function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDateOnly(value, endOfDay = false) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = endOfDay
    ? new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return date;
}

function buildDateRange(dateFrom, dateTo) {
  const range = {};
  if (dateFrom) {
    const start = parseDateOnly(dateFrom);
    if (!start) return { filter: null, error: "Invalid start date; use YYYY-MM-DD" };
    range.$gte = start;
  }
  if (dateTo) {
    const end = parseDateOnly(dateTo, true);
    if (!end) return { filter: null, error: "Invalid end date; use YYYY-MM-DD" };
    range.$lte = end;
  }
  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    return { filter: null, error: "Start date must be on or before end date" };
  }
  return { filter: Object.keys(range).length ? range : null, error: null };
}

module.exports = { escapeRegex, buildDateRange };
