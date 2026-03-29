import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
  isYesterday,
  parseISO,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';

export function groupEntriesByWeek<T extends { created_at: string }>(
  entries: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const date = parseISO(entry.created_at);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const key = format(weekStart, 'yyyy-MM-dd');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return groups;
}

export function formatWeekRangeHeader(weekStartKey: string): string {
  const start = parseISO(weekStartKey + 'T00:00:00');
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
}

export function formatDisplayDate(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm a');
}

export function formatDateHeader(isoString: string): string {
  const date = parseISO(isoString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}

export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
    end: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
  };
}

export function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
  };
}

export function getDaysInCurrentWeek(): Date[] {
  const now = new Date();
  return eachDayOfInterval({
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  });
}

export function formatDayLabel(date: Date): string {
  return format(date, 'EEE');
}

export function isSameDayAs(isoString: string, date: Date): boolean {
  return isSameDay(parseISO(isoString), date);
}

export function groupEntriesByDay<T extends { created_at: string }>(
  entries: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const dateKey = entry.created_at.split('T')[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(entry);
  }
  return groups;
}

export function formatShortDate(isoString: string): string {
  return format(parseISO(isoString), 'MMM d');
}
