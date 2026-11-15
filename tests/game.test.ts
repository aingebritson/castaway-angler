import { describe, it, expect } from 'vitest';
import { BALANCE, type ProfileId } from '../src/content/balance';
import { newGame, cast, step, hook, pause, resume, cancel, dispose, records, phaseAtHour, random, sampleProfile, sampleLength, grade, changeSettings, type GameState } from '../src/sim/game';
import { envelope, parseSave } from '../src/state/save';
const at={now:1794744000000,phase:'day' as const};
const point={x:.5,y:.6};
function advance(s:GameState,seconds:number,holding=false){for(let i=0;i<Math.round(seconds*60);i++)s=step(s,1/60,holding,at.now);return s;}
function bitten(id:ProfileId|'oversized'){
  let s=cast(newGame(42),point,at,id);while(s.encounter?.status==='waiting')s=step(s,1/60,false,at.now);return s;
}
function landed(id:ProfileId='small'){
  let s=hook(bitten(id));let time=0;
  while(s.encounter?.status!=='reveal'&&time<60){s=step(s,1/60,s.encounter!.tension<.67,at.now);time+=1/60;}
  return {s,time};
}
describe('fishing rules',()=>{
  it('reproduces a cast with saved randomness, clock, and input',()=>{
    const a=cast(newGame(99),point,at),b=cast(parseSave(envelope(newGame(99),at.now)).payload,point,at);
    expect(a).toEqual(b);expect(a.encounter!.remaining).toBeGreaterThanOrEqual(5);expect(a.encounter!.remaining).toBeLessThanOrEqual(20);
    expect(cast(a,point,at)).toBe(a);expect(cast(newGame(99),{x:0,y:0},at).casts).toBe(0);
  });
  it('samples all three profiles near the intended shares and within size bounds',()=>{
    let seed=342;const counts={small:0,medium:0,strong:0};
    for(let i=0;i<10000;i++){const [u,r]=random(seed);const id=sampleProfile(u);counts[id]++;const [v,r2]=random(r);seed=r2;const size=sampleLength(id,v);const p=BALANCE.profiles.find(p=>p.id===id)!;expect(size).toBeGreaterThanOrEqual(p.min);expect(size).toBeLessThanOrEqual(p.max);}
    for(const p of BALANCE.profiles)expect(Math.abs(counts[p.id]/100-p.share)).toBeLessThan(2);
  });
  it('lands small fish automatically and ordinary fights in their target bands',()=>{
    const small=landed();expect(small.time).toBeLessThan(3);
    const medium=landed('medium'),strong=landed('strong');
    expect(medium.s.encounter?.status).toBe('reveal');expect(medium.time).toBeGreaterThan(5);expect(medium.time).toBeLessThan(17);
    expect(strong.s.encounter?.status).toBe('reveal');expect(strong.time).toBeGreaterThan(15);expect(strong.time).toBeLessThan(28);
  });
  it('missed bites and excessive tension/slack lose a fish without a catch or a tackle cost',()=>{
    let missed=advance(bitten('medium'),5.1);expect(missed.catches).toHaveLength(0);expect(missed.encounter).toBeNull();
    const tight=advance(hook(bitten('strong')),11,true);expect(tight.catches).toHaveLength(0);expect(tight.message).toContain('tackle is safe');
    const slack=advance(hook(bitten('medium')),8,false);expect(slack.catches).toHaveLength(0);expect(slack.message).toContain('slack');
  });
  it('a brief release reduces tension and does not lose the fish',()=>{
    let s=advance(hook(bitten('medium')),1,true);const tension=s.encounter!.tension;
    s=advance(s,.5,false);expect(s.encounter!.tension).toBeLessThan(tension);expect(s.encounter?.status).toBe('fight');
  });
  it('oversized encounters resolve within eight seconds and can be cancelled',()=>{
    let s=hook(bitten('oversized'));s=advance(s,6.1,true);expect(['escaped',undefined]).toContain(s.encounter?.status);expect(s.catches).toHaveLength(0);
    expect(cancel(hook(bitten('oversized'))).encounter).toBeNull();
  });
  it.each(['waiting','bite','fight','reveal'] as const)('pause freezes %s even across a large clock jump',status=>{
    let s=status==='waiting'?cast(newGame(42),point,at,'medium'):status==='bite'?bitten('medium'):status==='fight'?hook(bitten('medium')):landed().s;
    s=pause(s);expect(step(s,9999,true,at.now+999999999)).toBe(s);
    const loaded=pause(parseSave(envelope(s,at.now)).payload);expect(loaded.encounter).toEqual(s.encounter);expect(resume(loaded).paused).toBe(false);
  });
  it('manual and automatic hooks preserve the same fish identity and size',()=>{
    let s=bitten('small');const manual=hook(s);const auto=step(changeSettings(s,{autoHook:true}),1/60,false,at.now);
    expect(auto.encounter).toMatchObject({id:manual.encounter!.id,profileId:'small',length:manual.encounter!.length,status:'landing'});
  });
  it('records a landing once and makes Keep/Release idempotent',()=>{
    const {s}=landed();expect(s.catches).toHaveLength(1);expect(advance(s,20).catches).toHaveLength(1);
    const kept=dispose(s,s.encounter!.id,'kept');expect(dispose(kept,s.encounter!.id,'kept')).toBe(kept);
    expect(records(kept,'small').kept).toBe(1);const released=dispose(s,s.encounter!.id,'released');expect(records(released,'small').count).toBe(1);expect(records(released,'small').kept).toBe(0);
    expect(cancel(s)).toBe(s);
  });
  it('grades against the fixed profile and handles all island phase boundaries',()=>{
    expect(grade('small',5)).toBe('Small');expect(grade('small',12)).toBe('Record grade');
    expect([4,5,7,18,20,23].map(phaseAtHour)).toEqual(['night','dawn','day','dusk','night','night']);
  });
});
describe('save validation and migration',()=>{
  it('round trips a pending reveal and rejects duplicate/missing records',()=>{
    const save=envelope(landed().s,at.now);expect(parseSave(JSON.stringify(save))).toEqual(save);
    const duplicate=structuredClone(save);duplicate.payload.catches.push(duplicate.payload.catches[0]);expect(()=>parseSave(duplicate)).toThrow();
    const missing=structuredClone(save);missing.payload.catches=[];expect(()=>parseSave(missing)).toThrow();
  });
  it('migrates the supported v1 fixture while rejecting unsupported/future/wrong content',()=>{
    const save:any=envelope(newGame(1),at.now);save.schemaVersion=1;delete save.payload.settings.reducedMotion;
    const migrated=parseSave(save);expect(migrated.schemaVersion).toBe(2);expect(migrated.payload.settings.reducedMotion).toBe(false);
    expect(()=>parseSave({...save,schemaVersion:99})).toThrow('newer');expect(()=>parseSave({...save,contentVersion:'future-region'})).toThrow('different');
    expect(()=>parseSave('{bad')).toThrow('JSON');expect(()=>parseSave({...save,appId:'other'})).toThrow('not a Castaway');
  });
  it('rejects invalid references, out-of-range lengths, and malformed inventory state',()=>{
    const save:any=envelope(landed().s,at.now);save.payload.catches[0].profileId='unknown';expect(()=>parseSave(save)).toThrow();
    const size:any=envelope(landed().s,at.now);size.payload.catches[0].length=999;expect(()=>parseSave(size)).toThrow();
  });
});

