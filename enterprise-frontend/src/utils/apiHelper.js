export function extractData(res) {
  if (!res) return [];

  // axios response
  if (res.data) {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  }

  // direct array
  if (Array.isArray(res)) return res;

  return [];
}

export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}