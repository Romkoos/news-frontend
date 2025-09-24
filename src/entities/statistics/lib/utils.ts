export function generateHourlyLabels(hours: number, locale?: string): string[] {
  const now = new Date();
  const currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0); // round to the full hour
  const labels: string[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(currentHour);
    d.setHours(currentHour.getHours() - i);
    const label = d.toLocaleTimeString(locale || undefined, { hour: '2-digit', minute: '2-digit' });
    labels.push(label);
  }
  return labels;
}

export function generateDailyLabels(days: number, locale?: string): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString(locale || undefined, { day: '2-digit', month: '2-digit' });
    labels.push(label);
  }
  return labels;
}

export function alignSeries(values: number[] | null | undefined, n: number): number[] {
  const source = Array.isArray(values) ? values.slice() : [];
  if (source.length >= n) {
    return source.slice(source.length - n);
  }
  return Array(n - source.length).fill(0).concat(source);
}
