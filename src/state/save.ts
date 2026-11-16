import { z } from 'zod';
import { profile } from '../content/balance';
import { type GameState, validPoint } from '../sim/game';

export const APP_ID = 'castaway-angler';
export const SAVE_VERSION = 3;
export const CONTENT_VERSION = 'm0-test-v1';
const uint = z.number().int().min(0).max(4294967295);
const positiveTime = z.number().finite().min(0).max(8640000000000000);
const profileId = z.enum(['small', 'medium', 'strong']);
const phase = z.enum(['dawn', 'day', 'dusk', 'night']);
const recordFields = { id: z.string().min(1).max(100), profileId, length: z.number().finite(), phase, timestamp: positiveTime };
const catchSchema = z.object({ ...recordFields, disposition: z.enum(['pending', 'kept', 'released']) }).strict();
const encounterSchema = z.object({ ...recordFields,
  status: z.enum(['waiting', 'bite', 'fight', 'landing', 'reveal', 'escaped']),
  remaining: z.number().min(0).max(60), elapsed: z.number().min(0).max(1000000),
  tension: z.number().min(0).max(1), progress: z.number().min(0).max(1), danger: z.number().min(0).max(10), slack: z.number().min(0).max(10),
  point: z.object({ x: z.number(), y: z.number() }).refine(validPoint, 'Invalid cast location'), oversized: z.boolean(),
}).strict();
export const stateSchema = z.object({
  rng: uint, nextId: z.number().int().positive(), casts: z.number().int().nonnegative(), revision: z.number().int().nonnegative(),
  catches: z.array(catchSchema).max(100000), encounter: encounterSchema.nullable(), paused: z.boolean(),
  settings: z.object({ autoHook: z.boolean(), muted: z.boolean(), reducedMotion: z.boolean(), seenIntro: z.boolean(), fishingTips: z.boolean() }).strict(),
  message: z.string().max(400),
}).strict().superRefine((s, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (new Set(s.catches.map(c => c.id)).size !== s.catches.length) issue('Duplicate catch IDs');
  if (s.nextId <= s.casts) issue('Invalid encounter sequence');
  for (const c of [...s.catches, ...(s.encounter ? [s.encounter] : [])]) {
    const p = profile(c.profileId);
    if (c.length < p.min || c.length > p.max) issue('Fish length is outside its profile');
  }
  const pending = s.catches.filter(c => c.disposition === 'pending');
  if (s.encounter?.status === 'reveal') {
    const e = s.encounter;
    if (pending.length !== 1 || pending[0].id !== e.id || pending[0].profileId !== e.profileId || pending[0].length !== e.length || pending[0].phase !== e.phase) issue('Reveal does not match its catch');
  } else if (pending.length) issue('Catch is pending without a reveal');
  if (s.encounter && s.encounter.status !== 'reveal' && s.catches.some(c => c.id === s.encounter!.id)) issue('Encounter already recorded');
  if (!s.encounter && s.paused) issue('Paused without an encounter');
});

const envelopeSchema = z.object({ appId: z.literal(APP_ID), schemaVersion: z.literal(SAVE_VERSION),
  contentVersion: z.literal(CONTENT_VERSION), exportedAt: positiveTime, payload: stateSchema }).strict();
export type SaveEnvelope = z.infer<typeof envelopeSchema>;

export function envelope(state: GameState, now: number): SaveEnvelope {
  return envelopeSchema.parse({ appId: APP_ID, schemaVersion: SAVE_VERSION, contentVersion: CONTENT_VERSION, exportedAt: now, payload: state });
}

export function parseSave(value: unknown): SaveEnvelope {
  let source: any = value;
  if (typeof source === 'string') {
    if (source.length > 16_000_000) throw new Error('This file is too large for an M0 save.');
    try { source = JSON.parse(source); } catch { throw new Error('This file is not valid JSON. Your current game is unchanged.'); }
  }
  if (!source || source.appId !== APP_ID) throw new Error('This is not a Castaway Angler save.');
  if (source.schemaVersion > SAVE_VERSION) throw new Error('This save needs a newer version of the game.');
  if (source.contentVersion !== CONTENT_VERSION) throw new Error('This save belongs to different game content. No catches were removed.');
  if (source.schemaVersion === 1) {
    source = { ...source, schemaVersion: 2, payload: { ...source.payload,
      settings: { ...source.payload?.settings, reducedMotion: source.payload?.settings?.reducedMotion ?? false } } };
  }
  if (source.schemaVersion === 2) {
    // Older builds marked the intro seen on casting. The new tutorial ends on a catch.
    const hasCaught = Array.isArray(source.payload?.catches) && source.payload.catches.length > 0;
    source = { ...source, schemaVersion: 3, payload: { ...source.payload,
      settings: { ...source.payload?.settings, seenIntro: hasCaught, fishingTips: !hasCaught } } };
  }
  const parsed = envelopeSchema.safeParse(source);
  if (!parsed.success) throw new Error(`Save validation failed: ${parsed.error.issues[0]?.message ?? 'invalid data'}. Your current game is unchanged.`);
  return parsed.data;
}

