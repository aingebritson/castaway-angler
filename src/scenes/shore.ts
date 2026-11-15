import Phaser from 'phaser';
import type { GameState, Point } from '../sim/game';
import type { Phase } from '../content/balance';

export type ShoreView = { state: GameState; phase: Phase; aim: Point | null; valid: boolean; holding: boolean };
const palettes = {
  dawn: { sky: 0xe9c5ac, skyBottom: 0xf2debc, water: 0x568f8c, deep: 0x244f59, far: 0x8ca29c, land: 0x415f59, light: 0xffedb9 },
  day: { sky: 0xb9d5cd, skyBottom: 0xe6e1c1, water: 0x539d98, deep: 0x285c65, far: 0x8db2a3, land: 0x496d5b, light: 0xffe5a1 },
  dusk: { sky: 0xcea38b, skyBottom: 0xf0c898, water: 0x56888a, deep: 0x294e5b, far: 0x9eaaa0, land: 0x48665c, light: 0xffe1a0 },
  night: { sky: 0x172f44, skyBottom: 0x53767a, water: 0x38747b, deep: 0x153e50, far: 0x527a7b, land: 0x2d514d, light: 0xffe7b0 },
};

export class Shore extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics;
  private motion!: Phaser.GameObjects.Graphics;
  private front!: Phaser.GameObjects.Graphics;
  private tackle!: Phaser.GameObjects.Graphics;
  private backdropKey = '';
  private activeTime = 0;
  constructor(private read: () => ShoreView) { super('shore'); }
  create() { this.bg = this.add.graphics(); this.motion = this.add.graphics(); this.front = this.add.graphics(); this.tackle = this.add.graphics(); }
  private polygon(g: Phaser.GameObjects.Graphics, points: number[][], color: number, alpha = 1) {
    const w = this.scale.width, h = this.scale.height;
    g.fillStyle(color, alpha).fillPoints(points.map(([x,y]) => new Phaser.Math.Vector2(x*w,y*h)), true);
  }
  private background(phase: Phase) {
    const w = this.scale.width, h = this.scale.height, p = palettes[phase], g = this.bg, f = this.front;
    g.clear(); f.clear();
    g.fillGradientStyle(p.sky, p.sky, p.skyBottom, p.skyBottom).fillRect(0, 0, w, h * .46);
    g.fillStyle(p.light, .045).fillCircle(w*.74,h*.258,w*.17);
    g.fillStyle(p.light, .07).fillCircle(w*.74,h*.258,w*.125);
    g.fillStyle(p.light, .95).fillCircle(w*.74,h*.258,w*.066);
    if (phase === 'night') {
      g.fillStyle(p.sky,1).fillCircle(w*.762,h*.244,w*.059);
      for (let i=0;i<21;i++) g.fillStyle(0xfff2d1, .2 + (i%4)*.13).fillCircle(((i*71+31)%400)/400*w, (.17+((i*13)%120)/1000)*h, i%3===0?1.3:.7);
    } else {
      g.fillStyle(0xfff5dc,.18).fillEllipse(w*.22,h*.24,w*.35,h*.016);
      g.fillStyle(0xfff5dc,.18).fillEllipse(w*.56,h*.197,w*.23,h*.009);
    }
    this.polygon(g, [[0,.36],[.1,.31],[.2,.326],[.29,.304],[.39,.335],[.49,.349],[.63,.352],[.7,.34],[.78,.35],[.9,.333],[1,.36],[1,.43],[0,.43]],p.far);
    g.fillGradientStyle(p.water,p.water,p.deep,p.deep).fillRect(0,h*.37,w,h*.63);
    g.lineStyle(1,0xeddfb9,.28).lineBetween(0,h*.375,w,h*.375);
    // A distant headland and a few layered palms; all placeholder vectors.
    this.polygon(g,[[0,.345],[.06,.337],[.13,.365],[.19,.369],[.23,.389],[.15,.41],[0,.426]],p.land);
    const palm=(x:number,y:number,s:number)=>{
      g.lineStyle(4*s,0x3b574c).beginPath().moveTo(x,y).lineTo(x+5*s,y-40*s).lineTo(x+13*s,y-66*s).strokePath();
      const cx=x+13*s,cy=y-66*s;
      for (let j=0;j<7;j++) {
        const angle=-Math.PI + j*Math.PI/6;
        const dx=Math.cos(angle)*30*s,dy=Math.sin(angle)*14*s;
        g.fillStyle(j%2?0x496b54:0x395c4d).fillTriangle(cx,cy,cx+dx,cy+dy+11*s,cx+dx*.65,cy+dy-5*s);
      }
    };
    palm(w*.075,h*.37,w/430); palm(w*.13,h*.375,w/530);
    this.polygon(f,[[0,.82],[.06,.8],[.115,.825],[.18,.842],[.205,.91],[.3,.94],[.4,1],[0,1]],0x5a655b);
    this.polygon(f,[[0,.845],[.085,.823],[.15,.849],[.125,.901],[0,.94]],0x7b8270);
    this.polygon(f,[[0,.92],[.11,.903],[.2,.929],[.29,1],[0,1]],0x9a9576);
    this.polygon(f,[[.78,1],[.81,.94],[.89,.92],[.94,.867],[1,.855],[1,1]],0x64736a);
    this.polygon(f,[[.9,.937],[.96,.891],[1,.902],[1,1],[.85,1]],0x92917b);
    f.lineStyle(1.5,0xd7d1a5,.22).lineBetween(0,h*.848,w*.078,h*.831).lineBetween(w*.89,h*.937,w*.955,h*.906);
    // Foreground sea grass.
    for(let i=0;i<9;i++) {
      const x=w*(.015+i*.012), y=h*.916;
      f.lineStyle(2,0x374e42,.8).lineBetween(x,y,x+Math.sin(i)*8,y-(18+i%3*12));
    }
  }
  update(_time: number, delta: number) {
    if (!this.bg) return;
    const v=this.read(), w=this.scale.width,h=this.scale.height;
    const key=`${w}:${h}:${v.phase}`;
    if(key!==this.backdropKey){this.background(v.phase);this.backdropKey=key;}
    if(!v.state.paused && !v.state.settings.reducedMotion) this.activeTime+=Math.min(delta,50)/1000;
    const t=this.activeTime, g=this.motion, line=this.tackle;
    g.clear();line.clear();
    for(let i=0;i<28;i++) {
      const y=(.39+i*.017)*h;
      const x=(((i*83)%430)/430*w+Math.sin(t*.23+i)*12);
      const width=(.02+(i%5)*.012)*w;
      g.lineStyle(i%4===0?1.6:1,0xc6e0cd,.07+(i%3)*.025).lineBetween(x,y,x+width,y);
    }
    for(let i=0;i<13;i++) {
      const y=(.39+i*.012)*h, span=(9+i*2)*(w/430);
      g.lineStyle(2,0xffdf9c,.07).lineBetween(w*.74-span+Math.sin(t+i)*4,y,w*.74+span,y);
    }
    const e=v.state.encounter;
    const point=v.aim ?? (e && !['reveal','escaped'].includes(e.status) ? e.point : null);
    if(point) {
      const x=point.x*w, y=point.y*h;
      if(v.aim) {
        line.lineStyle(1.5,v.valid?0xffedbd:0xef9b82,.55).beginPath().moveTo(w*.5,h*.91).lineTo(x,y).strokePath();
        line.lineStyle(1.6,v.valid?0xffedbd:0xef9b82,.9).strokeEllipse(x,y,34,15);
        line.lineBetween(x-6,y,x+6,y).lineBetween(x,y-4,x,y+4);
      } else if(e) {
        const bite=e.status==='bite', fighting=e.status==='fight';
        const shake=fighting?Math.sin(t*10)*4:bite?Math.sin(t*12)*2:Math.sin(t*2)*1.3;
        const bx=x+shake,by=y+(bite?4:Math.sin(t*2)*2);
        line.lineStyle(1,0xf6ead0,.55).beginPath().moveTo(w*.52,h*.96).lineTo(bx,by).strokePath();
        const ripple=(t*.8)%1;
        line.lineStyle(1,bite?0xffe4a0:0xd7eee1,(1-ripple)*.5).strokeEllipse(bx,by+7,14+ripple*32,5+ripple*13);
        line.fillStyle(0x162f36,.25).fillEllipse(bx+2,by+10,13,4);
        line.lineStyle(1.4,0xf7e6bb,1).lineBetween(bx,by-10,bx,by+8);
        line.fillStyle(bite?0xffd47e:0xe8a47e).fillEllipse(bx,by-1,bite?9:7,11);
        line.fillStyle(0xf7e5b9).fillEllipse(bx,by+3,7,5);
        if(bite) {line.lineStyle(2,0xffe5a6,.8).strokeCircle(bx,by-2,18+Math.sin(t*8)*3);}
      }
    }
  }
}

export function createShore(parent: HTMLElement, read: () => ShoreView) {
  return new Phaser.Game({ type: Phaser.AUTO, parent, backgroundColor: '#285c65',
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    render: { antialias: true, powerPreference: 'low-power' },
    fps: { target: 60, forceSetTimeOut: false }, audio: { noAudio: true }, scene: new Shore(read),
    banner: false,
  });
}
