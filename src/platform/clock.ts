import { phaseAtHour, type ClockContext } from '../sim/game';
import type { Phase } from '../content/balance';
export function clock(override?: Phase): ClockContext {
  const date = new Date();
  return { now: date.getTime(), phase: override ?? phaseAtHour(date.getHours()) };
}
export function timeLabel() { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date()); }
export function freshSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

