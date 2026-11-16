import assert from 'node:assert/strict';
import { BALANCE } from '../src/content/balance';
import { newGame } from '../src/sim/game';
import { envelope, parseSave } from '../src/state/save';
assert.equal(BALANCE.profiles.reduce((sum,p)=>sum+p.share,0),100);
assert.equal(new Set(BALANCE.profiles.map(p=>p.id)).size,3);
for(const p of BALANCE.profiles){assert(p.min<p.mode&&p.mode<p.max);assert(p.share>0);assert(/^#[0-9a-f]{6}$/i.test(p.color));assert(p.gain>0&&p.pull>0);assert(0<p.safeLow&&p.safeLow<.35&&.35<p.safeHigh&&p.safeHigh<1);}
assert(BALANCE.waitMin>=5&&BALANCE.waitMax<=20);assert(BALANCE.hookWindow>=2);
assert.deepEqual(parseSave(envelope(newGame(1),100)).payload,newGame(1));
console.log('M0 profiles, balance values, and save schema validated.');

