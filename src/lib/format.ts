import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';

/**
 * Journal-flavored relative date.
 * "Today", "Yesterday", "3 days ago", "last May", "May 2024".
 */
export function relativeDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';

  const days = differenceInCalendarDays(now, d);
  if (days > 0 && days < 7) return `${days} days ago`;
  if (days >= 7 && days < 28) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? 'last week' : `${weeks} weeks ago`;
  }

  const months = differenceInCalendarMonths(now, d);
  if (months >= 1 && months <= 11 && isThisYear(d)) {
    return `${format(d, 'MMMM')}`;
  }
  if (months >= 1 && months <= 13) {
    return `last ${format(d, 'MMMM')}`;
  }
  return format(d, 'MMM yyyy');
}

/** Full, unambiguous date for detail screens. */
export function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'EEEE, MMMM d, yyyy');
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'MMM d, yyyy');
}
