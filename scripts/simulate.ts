import { random, sampleProfile, sampleLength } from '../src/sim/game';
import { BALANCE } from '../src/content/balance';
let seed=20261115;
const totals={small:0,medium:0,strong:0};
for(let i=0;i<10000;i++){
  const [u,next]=random(seed);seed=next;const id=sampleProfile(u);totals[id]++;
  const [size,next2]=random(seed);seed=next2;sampleLength(id,size);
}
console.table(BALANCE.profiles.map(p=>({profile:p.id,catches:totals[p.id],share:`${(totals[p.id]/100).toFixed(2)}%`,target:`${p.share}%`}))); 
for(const p of BALANCE.profiles)if(Math.abs(totals[p.id]/100-p.share)>2)throw new Error('Distribution outside tolerance');
console.log('10,000 seeded selections passed the ±2 percentage-point tolerance.');

