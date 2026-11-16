import { BALANCE, profile, type Phase, type ProfileId } from '../content/balance';

export type ClockContext = { now: number; phase: Phase };
export type Point = { x: number; y: number };
export type EncounterStatus = 'waiting' | 'bite' | 'fight' | 'landing' | 'reveal' | 'escaped';
export type Catch = {
  id: string; profileId: ProfileId; length: number; phase: Phase; timestamp: number;
  disposition: 'pending' | 'kept' | 'released';
};
export type Encounter = {
  id: string; profileId: ProfileId; length: number; phase: Phase; timestamp: number;
  status: EncounterStatus; remaining: number; elapsed: number;
  tension: number; progress: number; danger: number; slack: number;
  point: Point; oversized: boolean;
};
export type GameState = {
  rng: number; nextId: number; casts: number; revision: number;
  catches: Catch[]; encounter: Encounter | null; paused: boolean;
  settings: { autoHook: boolean; muted: boolean; reducedMotion: boolean; seenIntro: boolean; fishingTips: boolean };
  message: string;
};

export function newGame(seed: number): GameState {
  return { rng: seed >>> 0, nextId: 1, casts: 0, revision: 0, catches: [], encounter: null, paused: false,
    settings: { autoHook: false, muted: false, reducedMotion: false, seenIntro: false, fishingTips: true }, message: '' };
}

// Mulberry32: explicit state makes gameplay independent of animation randomness.
export function random(seed: number): [number, number] {
  const state = (seed + 0x6D2B79F5) >>> 0;
  let t = Math.imul(state ^ (state >>> 15), state | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, state];
}

export function sampleProfile(u: number): ProfileId {
  let threshold = 0;
  const total = BALANCE.profiles.reduce((sum, p) => sum + p.share, 0);
  for (const p of BALANCE.profiles) { threshold += p.share / total; if (u < threshold) return p.id; }
  return 'strong';
}

export function sampleLength(id: ProfileId, u: number): number {
  const { min: a, mode: c, max: b } = profile(id);
  const split = (c - a) / (b - a);
  const value = u < split ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
  return Math.round(value * 10) / 10;
}

export function grade(id: ProfileId, length: number): string {
  const { min: a, mode: c, max: b } = profile(id);
  const p = length <= c ? (length - a) ** 2 / ((b - a) * (c - a)) : 1 - (b - length) ** 2 / ((b - a) * (b - c));
  return p < .25 ? 'Small' : p < .75 ? 'Average' : p < .95 ? 'Large' : p < .995 ? 'Trophy' : 'Record grade';
}

export function phaseAtHour(hour: number): Phase {
  return hour >= 5 && hour < 7 ? 'dawn' : hour >= 7 && hour < 18 ? 'day' : hour >= 18 && hour < 20 ? 'dusk' : 'night';
}

export function validPoint(p: Point): boolean {
  const a = BALANCE.castArea;
  return Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= a.left && p.x <= a.right && p.y >= a.top && p.y <= a.bottom;
}

export function cast(state: GameState, point: Point, clock: ClockContext, forced?: ProfileId | 'oversized'): GameState {
  if (state.encounter || state.paused || !validPoint(point)) return state;
  const [selection, r1] = random(state.rng);
  const [size, r2] = random(r1);
  const [wait, r3] = random(r2);
  const id = forced === 'oversized' ? 'strong' : forced ?? sampleProfile(selection);
  return { ...state, rng: r3, casts: state.casts + 1, nextId: state.nextId + 1, revision: state.revision + 1,
    message: '',
    encounter: {
      id: `catch-${state.rng.toString(16)}-${state.nextId}`, profileId: id, length: sampleLength(id, size),
      phase: clock.phase, timestamp: clock.now, status: 'waiting', remaining: BALANCE.waitMin + wait * (BALANCE.waitMax - BALANCE.waitMin),
      elapsed: 0, tension: .35, progress: 0, danger: 0, slack: 0, point, oversized: forced === 'oversized',
    },
  };
}

export function hook(state: GameState): GameState {
  if (state.paused || state.encounter?.status !== 'bite') return state;
  return { ...state, revision: state.revision + 1, encounter: { ...state.encounter,
    status: 'fight', elapsed: 0, remaining: 0 } };
}

export function pause(state: GameState): GameState {
  return !state.encounter || state.paused ? state : { ...state, paused: true, revision: state.revision + 1 };
}
export function resume(state: GameState): GameState {
  return !state.paused ? state : { ...state, paused: false, revision: state.revision + 1 };
}
export function cancel(state: GameState): GameState {
  if (!state.encounter || state.encounter.status === 'reveal') return state;
  return { ...state, encounter: null, paused: false, revision: state.revision + 1, message: 'Line reeled in. Take another cast whenever you like.' };
}
export function changeSettings(state: GameState, settings: Partial<GameState['settings']>): GameState {
  return { ...state, settings: { ...state.settings, ...settings }, revision: state.revision + 1 };
}

function escape(state: GameState, message: string): GameState {
  return { ...state, revision: state.revision + 1, message,
    encounter: { ...state.encounter!, status: 'escaped', remaining: BALANCE.escapeMessageTime } };
}

export function step(state: GameState, dt: number, holding: boolean, now: number): GameState {
  if (state.paused || !state.encounter || dt <= 0 || !Number.isFinite(dt)) return state;
  const e = { ...state.encounter, elapsed: state.encounter.elapsed + dt };
  let next = { ...state, encounter: e };
  if (e.status === 'reveal') return state;
  if (e.status === 'waiting') {
    e.remaining = Math.max(0, e.remaining - dt);
    if (e.remaining === 0) {
      e.status = 'bite'; e.remaining = BALANCE.hookWindow; e.elapsed = 0; next.revision++;
      if (state.settings.autoHook) next = hook(next) as typeof next;
    }
  } else if (e.status === 'bite') {
    if (state.settings.autoHook) return hook(next);
    e.remaining = Math.max(0, e.remaining - dt);
    if (e.remaining === 0) return escape(next, 'A nibble and a goodbye. Your tackle is safe.');
  } else if (e.status === 'fight') {
    if (e.oversized && e.elapsed >= BALANCE.oversizedTime) return escape(next, 'One for a stronger rod. Your tackle is safe.');
    const fish = profile(e.profileId);
    const surge = Math.sin(e.elapsed * 1.6) > .5 ? .075 : 0;
    e.tension = Math.max(0, Math.min(1, e.tension + (holding ? fish.pull + surge : -.33 + surge) * dt));
    e.progress = Math.max(0, Math.min(1, e.progress + (e.oversized ? 0 : holding ? fish.gain : -.018) * dt));
    e.danger = e.tension >= fish.safeHigh ? e.danger + dt : 0;
    e.slack = e.tension <= fish.safeLow ? e.slack + dt : 0;
    if (e.danger >= BALANCE.warningTime) return escape(next, 'Too much pull—this one got away. Your tackle is safe.');
    if (e.slack >= BALANCE.warningTime) return escape(next, 'A little too much slack. Your tackle is safe.');
    if (e.progress >= 1) { e.status = 'landing'; e.remaining = BALANCE.landingTime; next.revision++; }
  } else if (e.status === 'landing') {
    e.remaining = Math.max(0, e.remaining - dt);
    if (e.remaining === 0) {
      e.status = 'reveal'; next.revision++;
      if (!state.settings.seenIntro) next.settings = { ...state.settings, seenIntro: true, fishingTips: false };
      if (!state.catches.some(c => c.id === e.id)) {
        next.catches = [...state.catches, { id: e.id, profileId: e.profileId, length: e.length,
          phase: e.phase, timestamp: now, disposition: 'pending' }];
      }
    }
  } else if (e.status === 'escaped') {
    e.remaining = Math.max(0, e.remaining - dt);
    if (e.remaining === 0) return { ...next, encounter: null, revision: next.revision + 1 };
  }
  return next;
}

export function dispose(state: GameState, id: string, disposition: 'kept' | 'released'): GameState {
  if (state.paused || state.encounter?.status !== 'reveal' || state.encounter.id !== id) return state;
  if (!state.catches.some(c => c.id === id && c.disposition === 'pending')) return state;
  return { ...state, catches: state.catches.map(c => c.id === id ? { ...c, disposition } : c), encounter: null,
    paused: false, revision: state.revision + 1, message: disposition === 'released' ? 'Back to the blue. Your discovery is remembered.' : 'A catch to remember. Ready for another?' };
}

export function records(state: GameState, id: ProfileId) {
  const catches = state.catches.filter(c => c.profileId === id);
  return { count: catches.length, kept: catches.filter(c => c.disposition === 'kept').length,
    best: catches.reduce((best, c) => Math.max(best, c.length), 0) };
}

