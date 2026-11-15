import 'fake-indexeddb/auto';
import { it, expect } from 'vitest';
import { SaveStore } from '../src/platform/storage';
import { envelope } from '../src/state/save';
import { newGame, changeSettings } from '../src/sim/game';
let counter=0;
function store(){return new SaveStore(`test-${counter++}`);}
async function inject(name:string,key:string,value:unknown){
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('slots','readwrite');tx.objectStore('slots').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
}
it('writes in order and keeps the prior valid generation',async()=>{
  const s=store();expect((await s.load()).kind).toBe('empty');
  const a=envelope(newGame(1),1),b=envelope(changeSettings(newGame(2),{muted:true}),2);
  await Promise.all([s.save(a),s.save(b)]);const loaded=await s.load();expect(loaded.kind).toBe('loaded');expect('save'in loaded&&loaded.save).toEqual(b);
  await inject(s.name,'current',{broken:true});const recovered=await s.load();expect(recovered.kind).toBe('recovered');expect('save'in recovered&&recovered.save).toEqual(a);await s.close();
});
it('aborts an interrupted transaction without losing either valid generation',async()=>{
  const s=store(),a=envelope(newGame(1),1),b=envelope(newGame(2),2);await s.save(a);await s.save(b);
  s.failNext=true;await expect(s.save(envelope(newGame(3),3))).rejects.toThrow();const loaded=await s.load();expect('save'in loaded&&loaded.save).toEqual(b);
  await inject(s.name,'current',null);const recovered=await s.load();expect('save'in recovered&&recovered.save).toEqual(a);await s.close();
});
it('preserves a pre-import backup across later normal saves',async()=>{
  const s=store(),a=envelope(newGame(1),1);await s.save(a);await s.save(envelope(newGame(2),2),true);await s.save(envelope(newGame(3),3));expect(await s.getImportBackup()).toEqual(a);await s.close();
});
it('keeps corrupt data blocked and never silently resets it',async()=>{
  const s=store();await s.load();await inject(s.name,'current',{bad:1});await inject(s.name,'previous',{bad:2});expect((await s.load()).kind).toBe('blocked');expect((await s.load()).kind).toBe('blocked');await s.close();
});
it('a later good save still succeeds after a failed write',async()=>{
  const s=store();s.failNext=true;await expect(s.save(envelope(newGame(1),1))).rejects.toThrow();await s.save(envelope(newGame(2),2));expect((await s.load()).kind).toBe('loaded');await s.close();
});
