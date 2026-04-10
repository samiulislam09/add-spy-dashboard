import { formatISO } from "date-fns";

export function nowIso(): string {
  return formatISO(new Date());
}

export function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
