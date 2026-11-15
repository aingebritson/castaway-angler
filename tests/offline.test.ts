import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
import { serviceWorker } from '../scripts/service-worker';

function worker(build='A',shared=new Map<string,Map<string,Response>>()){
  const handlers:Record<string,(event:any)=>void>={};
  let offline=false;
  const origin='https://example.test',base='/castaway-angler/';
  const key=(r:any)=>typeof r==='string'?new URL(r,origin).href:r.url;
  const wrap=(entries:Map<string,Response>)=>({
    match:async(r:any)=>entries.get(key(r))?.clone(),
    put:async(r:any,response:Response)=>{entries.set(key(r),response.clone());},
    addAll:async(requests:Request[])=>{for(const r of requests)entries.set(key(r),await fetcher(r));},
  });
  const caches={
    open:async(name:string)=>{if(!shared.has(name))shared.set(name,new Map());return wrap(shared.get(name)!);},
    keys:async()=>[...shared.keys()],delete:async(name:string)=>shared.delete(name),
    match:async(r:any)=>{for(const entries of shared.values()){const result=entries.get(key(r));if(result)return result.clone();}},
  };
  const fetcher=async(r:any)=>{if(offline)throw new Error('Network unavailable');return new Response(`${build}:${key(r)}`,{headers:{'content-type':key(r).endsWith('.js')?'text/javascript':'text/html'}});};
  const skipWaiting=vi.fn(),claim=vi.fn();
  runInNewContext(serviceWorker(build,['index.html',`assets/${build}.js`]),{
    URL,Request,Response,caches,fetch:fetcher,
    self:{location:new URL(origin+base+'sw.js'),clients:{claim},skipWaiting,addEventListener:(name:string,fn:any)=>handlers[name]=fn},
  });
  return {shared,skipWaiting,claim,setOffline:()=>{offline=true;},
    async event(name:string){let done:Promise<unknown>=Promise.resolve();handlers[name]({waitUntil:(p:any)=>done=p});await done;},
    async request(path:string,mode='navigate'){let response:Promise<Response>|undefined;handlers.fetch({request:{url:origin+path,mode,method:'GET'},respondWith:(p:any)=>response=p});return await response;},
    activate:()=>handlers.message({data:{type:'ACTIVATE_UPDATE'}}),
  };
}
it('precaches the project subpath and launches its shell and assets without a network',async()=>{
  const w=worker();await w.event('install');w.setOffline();
  expect(await (await w.request('/castaway-angler/?debug=1'))!.text()).toContain('A:https://example.test/castaway-angler/index.html');
  expect(await (await w.request('/castaway-angler/assets/A.js','cors'))!.text()).toContain('A:');
  expect(await w.request('/different-project/')).toBeUndefined();
});
it('stages an update, preserves old hashed assets, and leaves unrelated caches alone',async()=>{
  const a=worker();await a.event('install');a.shared.set('another-app',new Map());
  const b=worker('B',a.shared);await b.event('install');expect(b.skipWaiting).not.toHaveBeenCalled();
  b.activate();expect(b.skipWaiting).toHaveBeenCalledOnce();await b.event('activate');b.setOffline();
  expect(await (await b.request('/castaway-angler/assets/A.js','cors'))!.text()).toContain('A:');
  expect(await (await b.request('/castaway-angler/'))!.text()).toContain('B:');expect(b.shared.has('another-app')).toBe(true);
});
it('uses a fresh online shell for an explicit navigation, then retains it offline',async()=>{
  const w=worker();await w.event('install');
  const response=await w.request('/castaway-angler/');expect(await response!.text()).toBe('A:https://example.test/castaway-angler/');
  w.setOffline();expect(await (await w.request('/castaway-angler/'))!.text()).toBe('A:https://example.test/castaway-angler/');
});
