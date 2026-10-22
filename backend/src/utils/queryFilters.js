function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDateRange(dateFrom, dateTo) {
  const range = {};
  if (dateFrom) {
    const start = new Date(dateFrom);
    if (Number.isNaN(start.getTime())) return { filter: null, error: "Invalid start date" };
    start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (dateTo) {
    const end = new Date(dateTo);
    if (Number.isNaN(end.getTime())) return { filter: null, error: "Invalid end date" };
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    return { filter: null, error: "Start date must be on or before end date" };
  }
  return { filter: Object.keys(range).length ? range : null, error: null };
}

module.exports = { escapeRegex, buildDateRange };
