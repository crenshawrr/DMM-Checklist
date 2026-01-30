export function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}
