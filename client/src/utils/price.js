// Pricing helpers shared by the item pages.
// chargeDays uses JS weekday numbers: 0 = Sunday ... 6 = Saturday.
export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function formatPrice(n) {
  const v = Number(n) || 0;
  return `Rs ${v.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

// Mirrors the server calculation so the borrower sees the price before sending a request.
export function computePrice(start, end, pricePerDay, chargeDays) {
  const rate = Number(pricePerDay) || 0;
  if (!start || !end) return { chargeableDays: 0, total: 0 };
  const allowed = new Set((chargeDays && chargeDays.length ? chargeDays : ALL_DAYS).map(Number));
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  let chargeableDays = 0;
  for (const d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
    if (allowed.has(d.getUTCDay())) chargeableDays += 1;
  }
  return { chargeableDays, total: Math.round(chargeableDays * rate * 100) / 100 };
}

// "Every day", "Weekends only", "Mon, Wed, Fri" ...
export function describeChargeDays(chargeDays) {
  const days = [...new Set((chargeDays && chargeDays.length ? chargeDays : ALL_DAYS).map(Number))];
  if (days.length === 7) return 'every day';
  const sorted = WEEKDAYS.filter((d) => days.includes(d.value));
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'weekends only';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'weekdays only';
  return sorted.map((d) => d.label).join(', ');
}
