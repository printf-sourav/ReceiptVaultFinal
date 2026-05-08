const alertCounters: Map<string, number> = new Map();

function getCounterKey(userPhone: string): string {
  const hour = new Date().getHours();
  return `${userPhone}:${hour}`;
}

export function isWithinQuietHours(prefs: { quiet_hours_start: string; quiet_hours_end: string }): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = prefs.quiet_hours_start.split(":").map(Number);
  const [endH, endM] = prefs.quiet_hours_end.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function canSendAlert(userPhone: string, maxPerHour: number): boolean {
  const key = getCounterKey(userPhone);
  const count = alertCounters.get(key) || 0;
  if (count >= maxPerHour) return false;
  alertCounters.set(key, count + 1);
  return true;
}
