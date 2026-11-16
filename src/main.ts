import './style.css';
import { BALANCE, profile, type Phase, type ProfileId } from './content/balance';
import { newGame, cast, hook, step, pause, resume, cancel, dispose, changeSettings, records, grade, validPoint, type GameState, type Point } from './sim/game';
import { envelope, parseSave, type SaveEnvelope } from './state/save';
import { SaveStore } from './platform/storage';
import { clock, freshSeed, timeLabel } from './platform/clock';
import { GameAudio } from './platform/audio';
import { OfflineManager } from './platform/offline';
import { createShore } from './scenes/shore';
import { icon, fishArt } from './ui/art';

const debug = new URLSearchParams(location.search).get('debug') === '1';
const base = import.meta.env.BASE_URL;
const storageName = `castaway-angler:${base}:${debug ? 'test' : 'play'}`;
const store = new SaveStore(storageName);
const audio = new GameAudio();
let state = newGame(freshSeed());
let phaseOverride: Phase | undefined;
let aim: Point | null = null;
let aimingStart: Point | null = null;
let holding = false, busy = false, writeEnabled = true;
let saveStatus = 'Loading your shore…', notice = '', failure = false;
let modalType = '', importPreview: SaveEnvelope | null = null;
let lastCheckpoint = 0, lastRevision = -1, lastStatus = '', nibbleId = '';
let focusReturn: HTMLElement | null = null;
let pendingSaves = 0;
const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `<main class="game-shell" aria-label="Castaway Angler fishing game">
  <div id="scene" aria-hidden="true"></div>
  <div class="scene-vignette"></div>
  <header class="masthead"><div class="brand-mark">${icon('sail',29)}</div><div class="wordmark">Castaway <span>ANGLER</span></div><span class="prototype">${debug ? 'TEST BENCH' : 'FIRST TIDE'}</span></header>
  <section class="place-hud" aria-label="Fishing location"><div><p class="eyebrow">CASTAWAY ISLAND</p><h1>Rocky Point</h1><p class="place-caption">A little shore. A world to discover.</p></div><div class="time-chip"><span id="phase-icon"></span><span id="phase-label"></span><small id="local-time"></small></div></section>
  <div class="zone-label">THE SHALLOWS <span>·</span> <span id="water-label">quiet water</span></div>
  <div id="aim-tip" hidden>Pull back, then let go</div>
  <section class="play-panel" aria-label="Fishing controls">
    <div class="panel-top"><span class="eyebrow" id="action-kicker">YOUR NEXT DISCOVERY</span><button id="cancel-cast" class="text-button" hidden>Reel in</button></div>
    <h2 id="action-title">See what the tide brings.</h2><p id="action-hint">Hold the button, pull down, and release to cast.</p>
    <div id="fight-meter" hidden><div class="meter-label"><span id="tension-label">Easy does it</span><span id="distance-label"></span></div><div class="tension-track"><span id="tension-needle"></span></div><div class="distance-track"><span id="distance-fill"></span></div></div>
    <button id="primary" class="primary cast-button">${icon('hook')}<span id="primary-label">Pull back to cast</span><span class="button-flourish">↓</span></button>
    <p class="rig-line">${icon('hook',14)} Old pole <span>·</span> Unlimited test bait</p>
  </section>
  <nav class="bottom-nav" aria-label="Game menu"><button id="collection-button">${icon('book')}<span>Collection</span><b id="collection-count">0 / 3</b></button><span class="nav-divider"></span><button id="settings-button">${icon('gear')}<span>Settings</span></button></nav>
  <div class="save-line"><span id="save-dot"></span><span id="save-status" role="status">Loading your shore…</span></div>
  <section id="pause-card" class="pause-card" hidden aria-label="Game paused"><div class="pause-icon">${icon('pause',25)}</div><h2>Take your time.</h2><p>Everything waits for you.</p><button id="resume-button" class="primary">Resume fishing ${icon('arrow',19)}</button></section>
  <section id="reveal-card" class="reveal-card" hidden aria-label="Your catch"></section>
  <div id="toast" class="toast" role="status" hidden></div>
  <div class="landscape-note"><span>${icon('sail',36)}</span><h2>A better view upright.</h2><p>Turn your phone to portrait.<br>Your fishing is paused.</p></div>
</main>
<dialog id="modal" aria-labelledby="modal-title"><div class="sheet-header"><div><p class="eyebrow" id="modal-kicker">CASTAWAY ANGLER</p><h2 id="modal-title"></h2></div><button id="close-modal" class="icon-button" aria-label="Close menu">${icon('close')}</button></div><div id="modal-content"></div></dialog>
<p class="desktop-caption">A little island. A quiet cast.</p>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const shell = document.querySelector<HTMLElement>('.game-shell')!;
const dialog = $<HTMLDialogElement>('modal');
const primary = $<HTMLButtonElement>('primary');
const playPanel = document.querySelector<HTMLElement>('.play-panel')!;
const offline = new OfflineManager(() => { if (modalType === 'settings') renderSettings(); });
const esc = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const setText = (id: string, value: string) => { if ($(id).textContent !== value) $(id).textContent = value; };

function toast(message: string, important = false) {
  notice = message; $('toast').textContent = message; $('toast').hidden = false;
  if (!important) window.setTimeout(() => { if (notice === message) { notice = ''; $('toast').hidden = true; } }, 5500);
}

async function persist(force = false) {
  if (!writeEnabled) return false;
  if (!force && state.revision === lastRevision) return !failure;
  const snapshot = envelope(state, clock().now);
  lastRevision = state.revision; pendingSaves++; saveStatus = 'Saving…'; renderSave();
  try {
    await store.save(snapshot);
    failure = false;
    saveStatus = 'Saved on this device';
    return true;
  } catch {
    failure = true;
    saveStatus = 'Not saved · export a backup';
    toast('Your progress is in this session only. Open Settings to export a backup.', true);
    return false;
  } finally { pendingSaves--; renderSave(); }
}
function renderSave() {
  setText('save-status', pendingSaves ? 'Saving…' : saveStatus);
  $('save-dot').classList.toggle('unsaved', failure || !writeEnabled);
}
function changed(next: GameState) { state = next; void persist(); render(); }

function clearInput() { holding = false; aim = null; aimingStart = null; }
function interrupt() {
  clearInput(); state = pause(state); audio.suspend(); void persist(true); render();
}
function openModal(type: string, title: string) {
  clearInput(); state = pause(state); void persist();
  focusReturn = document.activeElement as HTMLElement;
  modalType = type; setText('modal-title', title);
  if (!dialog.open) dialog.showModal();
  render();
}
function closeModal() {
  modalType = ''; dialog.close(); importPreview = null; render();
  focusReturn?.focus();
}

function renderCollection() {
  const found = BALANCE.profiles.filter(p => records(state, p.id).count > 0).length;
  openModal('collection', 'Your first tide');
  $('modal-content').innerHTML = `<p class="sheet-lede">Every catch tells a story. Released fish count, too.</p>
    <div class="collection-summary"><div><strong>${state.catches.length}</strong><span>catches</span></div><div><strong>${state.catches.filter(c=>c.disposition==='kept').length}</strong><span>kept</span></div><div><strong>${found}<small> / 3</small></strong><span>discovered</span></div></div>
    <div class="collection-list">${BALANCE.profiles.map(p=>{
      const r=records(state,p.id);
      return `<article class="specimen-row ${r.count?'':'unknown'}"><div class="specimen-thumb">${fishArt(r.count?p.color:'#bbbfb0', !r.count)}</div><div><p class="eyebrow">${r.count?'DISCOVERED':'STILL OUT THERE'}</p><h3>${r.count?p.name:'Undiscovered test fish'}</h3><p>${r.count?`${r.count} caught · ${r.kept} kept`:'Another cast, another possibility.'}</p></div>${r.count?`<div class="best"><strong>${r.best.toFixed(1)}</strong><span>cm best</span></div>`:''}</article>`;
    }).join('')}</div><p class="fine-print">Three fictional profiles for our first fishing prototype. Real species will arrive with the island.</p>`;
}

function renderSettings() {
  const setting=(key: keyof GameState['settings'], title: string, text: string)=>`<label class="setting-row"><span><strong>${title}</strong><small>${text}</small></span><input type="checkbox" data-setting="${key}" ${state.settings[key]?'checked':''}><span class="switch" aria-hidden="true"></span></label>`;
  $('modal-content').innerHTML = `<p class="sheet-lede">Make yourself comfortable.</p>
    <div class="settings-list">${setting('fishingTips','Fishing tips','Show guidance. Hides after your first catch.')}${setting('autoHook','Automatic hook','Sets the hook for you. You still reel in.')}${setting('muted','Quiet water','Turn off fishing sounds.')}${setting('reducedMotion','Gentler motion','Keep the water still.')}</div>
    <section class="settings-section"><h3>Your progress</h3><p>Saved on this device. Keep a file backup to bring your catches with you.</p><div class="button-pair"><button class="secondary" id="export-save">Export save ${icon('arrow',17)}</button><button class="secondary" id="import-save">Import save</button></div><input id="import-file" type="file" accept=".json,application/json" hidden><button class="text-button" id="restore-import">Restore pre-import backup</button>${failure||!writeEnabled?'<button class="secondary" id="retry-save">Try saving this session</button>':''}</section>
    <section class="settings-section"><h3>Take the island with you</h3><p>On iPhone, open this page in Safari. Tap Share, then Add to Home Screen.</p><span class="offline-status">${offline.ready?'● Ready for offline fishing':import.meta.env.DEV?'Local development preview':'Preparing offline fishing…'}</span>${offline.waiting?`<button class="secondary" id="apply-update" ${state.encounter?'disabled':''}>${state.encounter?'Finish your cast to update':'Install ready update'}</button>`:''}</section>
    <p class="fine-print">Island time follows your phone. Dawn 5–7, day 7–18, dusk 18–20, night 20–5. Every test fish is available all day.</p>
    ${debug?`<section class="settings-section test-tools"><h3>Test bench</h3><p>A separate save. Your regular catches are safe.</p><div class="test-buttons">${['small','medium','strong','oversized'].map(id=>`<button class="secondary" data-force="${id}">Test ${id}</button>`).join('')}</div><label class="field-label">Scene phase<select id="test-phase"><option value="">Phone time</option>${['dawn','day','dusk','night'].map(p=>`<option ${phaseOverride===p?'selected':''}>${p}</option>`).join('')}</select></label><label class="field-label">Seed for next cast<input id="test-seed" type="number" min="0" max="4294967295" value="${state.rng}"></label><button id="set-seed" class="text-button">Set seed</button><button id="fail-save" class="text-button">Simulate one failed save</button><button id="reset-test" class="text-button">Clear test save</button></section>`:''}
    <div class="settings-footer"><span>M0 · ${esc(__BUILD_ID__)}</span><button class="text-button" id="test-mode">${debug?'Return to regular fishing':'Open test bench'}</button></div>`;
  dialog.querySelectorAll<HTMLInputElement>('[data-setting]').forEach(input=>input.onchange=()=>{
    const key=input.dataset.setting as keyof GameState['settings']; changed(changeSettings(state,{[key]:input.checked})); audio.muted=state.settings.muted;
    if(!state.settings.muted) void audio.unlock();
  });
  $('export-save').onclick=exportSave;
  $('import-save').onclick=()=>$<HTMLInputElement>('import-file').click();
  $<HTMLInputElement>('import-file').onchange=async event=>{
    const file=(event.target as HTMLInputElement).files?.[0]; if(!file)return;
    try { if(file.size>16_000_000)throw new Error('This file is too large for an M0 save.'); showImport(parseSave(await file.text())); }
    catch(error) { showError(error instanceof Error?error.message:'This file could not be read.'); }
  };
  $('restore-import').onclick=async()=>{
    try { const backup=await store.getImportBackup(); if(backup)showImport(backup); else showError('No pre-import backup is stored on this device yet.'); } catch { showError('The backup could not be read.'); }
  };
  if($('retry-save')) $('retry-save').onclick=async()=>{writeEnabled=true;await persist(true);renderSettings();};
  if($('apply-update')) $('apply-update').onclick=async()=>{
    if(state.encounter||busy)return; busy=true;
    if(await persist(true)){await store.flush();offline.activate();}busy=false;
  };
  $('test-mode').onclick=async()=>{await persist(true);const url=new URL(location.href);debug?url.searchParams.delete('debug'):url.searchParams.set('debug','1');location.href=url.toString();};
  if(debug) {
    dialog.querySelectorAll<HTMLButtonElement>('[data-force]').forEach(button=>button.onclick=()=>{
      if(state.encounter?.status==='reveal'){showError('Keep or release your pending test catch first.');return;}
      state=cancel(resume(state));state=cast(state,{x:.52,y:.58},clock(phaseOverride),button.dataset.force as ProfileId|'oversized');
      state={...state,encounter:{...state.encounter!,remaining:.5},revision:state.revision+1};state=pause(state);void persist();closeModal();render();
    });
    $<HTMLSelectElement>('test-phase').onchange=event=>{phaseOverride=((event.target as HTMLSelectElement).value||undefined) as Phase|undefined;render();};
    $('set-seed').onclick=()=>{const value=Number($<HTMLInputElement>('test-seed').value);if(Number.isInteger(value)&&value>=0&&value<=4294967295){state={...state,rng:value,revision:state.revision+1};void persist();toast('Seed set for the next test cast.');}};
    $('fail-save').onclick=async()=>{store.failNext=true;await persist(true);renderSettings();};
    $('reset-test').onclick=()=>{openModal('confirm-reset','Clear test catches?');$('modal-content').innerHTML='<p class="sheet-lede">Only this test-bench save will be replaced. Regular fishing is untouched.</p><button class="primary" id="confirm-reset">Clear test save</button>';$('confirm-reset').onclick=()=>{state=newGame(12345);lastRevision=-1;void persist(true);closeModal();render();};};
  }
}
function showError(message:string) {
  const previous=dialog.querySelector('.inline-error');previous?.remove();
  const p=document.createElement('p');p.className='inline-error';p.setAttribute('role','alert');p.textContent=message;$('modal-content').prepend(p);
}
function exportSave() {
  const file=new Blob([JSON.stringify(envelope(state,clock().now),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(file), a=document.createElement('a');a.href=url;a.download=`castaway-angler-${debug?'test-':''}${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showImport(save:SaveEnvelope) {
  importPreview=save;modalType='import';setText('modal-title','Bring back your catches');
  $('modal-content').innerHTML=`<p class="sheet-lede">This replaces your current ${debug?'test ':''}session. A valid local copy is kept as a pre-import backup.</p><div class="import-comparison"><div><span>Current session</span><strong>${state.catches.length} catches</strong></div><span>→</span><div><span>Selected save</span><strong>${save.payload.catches.length} catches</strong></div></div><p class="fine-print">${save.payload.catches.filter(c=>c.disposition==='kept').length} kept · ${save.payload.encounter?'An encounter will resume paused.':'Ready for a new cast.'}</p><button class="primary" id="confirm-import">Replace with this save</button><button class="secondary full" id="cancel-import">Keep my current session</button>`;
  $('confirm-import').onclick=async()=>{
    if(!importPreview||busy)return;busy=true;const imported=importPreview;
    try {
      const payload=pause(imported.payload);
      await store.save(envelope(payload,clock().now),true);
      state=payload;writeEnabled=true;failure=false;lastRevision=state.revision;saveStatus='Saved on this device';audio.muted=state.settings.muted;
      closeModal();render();toast('Save restored. Welcome back to the shore.');
    }catch{showError('The replacement could not be saved. Your current session is unchanged.');}
    finally{busy=false;}
  };
  $('cancel-import').onclick=()=>{importPreview=null;modalType='settings';setText('modal-title','Settle in');renderSettings();};
}

function renderReveal() {
  const e=state.encounter!;
  const previous=state.catches.filter(c=>c.id!==e.id&&c.profileId===e.profileId);
  const isNew=previous.length===0,isBest=isNew||e.length>Math.max(...previous.map(c=>c.length));
  const p=profile(e.profileId);
  $('reveal-card').innerHTML=`<p class="eyebrow">${isNew?'A NEW DISCOVERY':isBest?'A NEW PERSONAL BEST':'A MOMENT TO KEEP'}</p><h2>${p.nickname}</h2>${fishArt(p.color)}<h3>${p.name}</h3><div class="catch-measure"><strong>${e.length.toFixed(1)}</strong><span>cm</span><span class="grade-badge">${grade(e.profileId,e.length)}</span></div><p class="reveal-note">${isBest?'Your best for this profile. ':''}Keep it or let it go.<br>Your discovery is remembered either way.</p><div class="button-pair"><button id="release-catch" class="secondary">Release</button><button id="keep-catch" class="primary">Keep catch ${icon('check',17)}</button></div><p class="fine-print">Fictional test profile · M0</p>`;
  const id=e.id;
  $('keep-catch').onclick=()=>changed(dispose(state,id,'kept'));
  $('release-catch').onclick=()=>changed(dispose(state,id,'released'));
}
let revealId='';
function render() {
  const e=state.encounter, status=e?.status??'ready', phase=clock(phaseOverride).phase;
  if(status!=='fight')holding=false;
  shell.dataset.phase=phase;shell.dataset.status=status;
  setText('phase-label',phase.charAt(0).toUpperCase()+phase.slice(1));setText('local-time',timeLabel());
  if($('phase-icon').dataset.phase!==phase){$('phase-icon').innerHTML=icon(phase==='night'?'moon':'sun',19);$('phase-icon').dataset.phase=phase;}
  setText('collection-count',`${BALANCE.profiles.filter(p=>records(state,p.id).count>0).length} / 3`);
  $('aim-tip').hidden=!aim||!state.settings.fishingTips;$('pause-card').hidden=!state.paused||dialog.open;
  $('reveal-card').hidden=status!=='reveal'||state.paused||dialog.open;
  if(status==='reveal'&&revealId!==e!.id){revealId=e!.id;renderReveal();}
  if(status!=='reveal')revealId='';
  playPanel.hidden=status==='reveal'||state.paused;
  $('cancel-cast').hidden=!e||['reveal','escaped'].includes(status);
  playPanel.classList.toggle('compact',!state.settings.fishingTips);
  $('action-kicker').hidden=!state.settings.fishingTips;
  $('action-title').hidden=!state.settings.fishingTips;
  $('action-hint').hidden=!state.settings.fishingTips&&status!=='escaped';
  playPanel.querySelector<HTMLElement>('.panel-top')!.hidden=!state.settings.fishingTips&&$('cancel-cast').hidden;
  playPanel.querySelector<HTMLElement>('.rig-line')!.hidden=!state.settings.fishingTips;
  $('fight-meter').hidden=status!=='fight';
  primary.disabled=busy||state.paused||['landing','escaped'].includes(status);
  primary.classList.toggle('biting',status==='bite');primary.classList.toggle('reeling',holding&&status==='fight');
  const copy:Record<string,[string,string,string,string]>={
    ready:['YOUR NEXT DISCOVERY','See what the tide brings.',state.message||'Hold the button, pull down, and release to cast.','Pull back to cast'],
    waiting:['A LITTLE PATIENCE',e&&e.remaining<2.2?'Something is curious…':'Let the water do its thing.',e&&e.remaining<2.2?'A nibble. Wait for the float to dip.':'Watch your float. There’s no hurry.','Waiting for a bite…'],
    bite:['THERE IT IS!','A bite. Make it yours.','Tap to set the hook.','Set the hook'],
    fight:[e?.oversized?'SOMETHING MUCH BIGGER':'EASY DOES IT',e?.oversized?'One for a stronger rod.':'A little give. A little take.',e?.oversized?'Enjoy the glimpse. Your tackle is safe.':'Hold to reel. Release to give a little line.',holding?'Reeling… let go to ease':'Hold to reel'],
    landing:['COMING ASHORE','Look what you found.','Bringing your catch in gently…','Landing your catch…'],
    escaped:['UNTIL NEXT TIME','The one that got away.',state.message,'Back to the blue…'],
    reveal:['','','',''],
  };
  const c=copy[status];setText('action-kicker',c[0]);setText('action-title',c[1]);setText('action-hint',c[2]);setText('primary-label',c[3]);
  if(status==='fight'&&e){
    const fish=profile(e.profileId);
    const label=e.tension>=fish.safeHigh?'Too tight · release!':e.tension<=fish.safeLow?'Too loose · reel!':e.tension>fish.safeHigh-(fish.safeHigh-fish.safeLow)*.22?'A strong pull · ease off':'Steady line';
    setText('tension-label',label);setText('distance-label',`${Math.round(e.progress*100)}% ashore`);
    $('fight-meter').style.setProperty('--safe-low',`${fish.safeLow*100}%`);
    $('fight-meter').style.setProperty('--safe-high',`${fish.safeHigh*100}%`);
    $('tension-needle').style.left=`${e.tension*100}%`;$('distance-fill').style.width=`${e.progress*100}%`;
    $('fight-meter').classList.toggle('danger',e.danger>0||e.slack>0);
  }
  if(status!==lastStatus){
    if(status==='bite')audio.cue('bite');if(status==='landing')audio.cue('land');lastStatus=status;
  }
  if(e?.status==='waiting'&&e.remaining<2.2&&nibbleId!==e.id){nibbleId=e.id;audio.cue('nibble');}
  renderSave();
}

function beginPointer(event: PointerEvent) {
  if(dialog.open||state.paused||busy||event.button>0)return;
  void audio.unlock();audio.muted=state.settings.muted;
  const target=event.currentTarget as HTMLElement;
  if(!state.encounter){
    aimingStart={x:event.clientX,y:event.clientY};aim={x:.5,y:.7};target.setPointerCapture(event.pointerId);
  }else if(state.encounter.status==='bite'){const next=hook(state);changed(next);holding=next.encounter?.status==='fight';target.setPointerCapture(event.pointerId);}
  else if(state.encounter.status==='fight'){holding=true;target.setPointerCapture(event.pointerId);}
  render();
}
function movePointer(event: PointerEvent) {
  if(!aimingStart)return;
  const box=shell.getBoundingClientRect();
  aim={x:.5-(event.clientX-aimingStart.x)/box.width*.9,y:.7-(event.clientY-aimingStart.y)/box.height*1.7};render();
}
function endPointer(event: PointerEvent) {
  holding=false;
  if(aim&&aimingStart){
    const distance=Math.hypot(event.clientX-aimingStart.x,event.clientY-aimingStart.y);
    if(distance>=10&&validPoint(aim)){state=cast(state,aim,clock(phaseOverride));audio.cue('cast');void persist();}
    else toast(distance<10?'Pull down a little, then release.':'Aim for the marked shallows. Your bait is safe.');
  }
  aim=null;aimingStart=null;render();
}

for(const target of [primary,$('scene')]){
  target.addEventListener('pointerdown',beginPointer);target.addEventListener('pointermove',movePointer);
  target.addEventListener('pointerup',endPointer);target.addEventListener('pointercancel',interrupt);
}
primary.addEventListener('keydown',event=>{
  if(![' ','Enter'].includes(event.key)||event.repeat||dialog.open||state.paused)return;
  event.preventDefault();void audio.unlock();
  if(!state.encounter)changed(cast(state,{x:.5,y:.6},clock(phaseOverride)));
  else if(state.encounter.status==='bite')changed(hook(state));
  if(state.encounter?.status==='fight')holding=true;
});
primary.addEventListener('keyup',()=>{holding=false;});
$('collection-button').onclick=renderCollection;
$('settings-button').onclick=()=>{openModal('settings','Settle in');renderSettings();};
$('close-modal').onclick=closeModal;dialog.addEventListener('cancel',event=>{event.preventDefault();closeModal();});
$('resume-button').onclick=()=>{void audio.unlock();changed(resume(state));};
$('cancel-cast').onclick=()=>{clearInput();changed(cancel(state));};
document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
window.addEventListener('blur',interrupt);window.addEventListener('pagehide',interrupt);
window.addEventListener('orientationchange',interrupt);
window.addEventListener('online',()=>{if(modalType==='settings')renderSettings();});

async function start() {
  const loaded=await store.load();
  if(loaded.kind==='loaded'||loaded.kind==='recovered'){
    state=pause(loaded.save.payload);
    if(loaded.kind==='recovered')toast('Recovered your previous valid save. Your latest saved catches are here.',true);
  }else if(loaded.kind==='blocked'||loaded.kind==='unavailable'){
    writeEnabled=false;failure=true;saveStatus='Not saved · export a backup';
    if(loaded.kind==='blocked'){
      openModal('recovery','Let’s recover your shore');
      $('modal-content').innerHTML=`<p class="sheet-lede">${esc(loaded.message)}</p><button id="recovery-import" class="primary">Import a backup</button><button id="recovery-new" class="secondary full">Begin a new game instead</button>`;
      $('recovery-import').onclick=()=>{modalType='settings';setText('modal-title','Settle in');renderSettings();};
      $('recovery-new').onclick=()=>{
        $('modal-content').innerHTML='<p class="sheet-lede">Starting fresh replaces the unreadable local save. Continue only if you do not want to recover it.</p><button id="confirm-new-game" class="primary">Replace it and start fresh</button>';
        $('confirm-new-game').onclick=async()=>{state=newGame(freshSeed());writeEnabled=true;await persist(true);closeModal();render();};
      };
    }else toast(loaded.message,true);
  }
  audio.muted=state.settings.muted;
  createShore($('scene'),()=>({state,phase:clock(phaseOverride).phase,aim,valid:aim?validPoint(aim):true,holding}));
  if(writeEnabled)void persist(true);
  void offline.start();
  if(navigator.storage?.persist)void navigator.storage.persist().catch(()=>false);
  let previous=performance.now(),accumulator=0;
  const frame=(now:number)=>{
    const elapsed=Math.min(.1,Math.max(0,(now-previous)/1000));previous=now;
    if(!document.hidden&&!dialog.open&&!state.paused){
      accumulator+=elapsed;
      while(accumulator>=BALANCE.fixedStep){state=step(state,BALANCE.fixedStep,holding,clock(phaseOverride).now);accumulator-=BALANCE.fixedStep;}
      if(state.encounter&&state.encounter.status!=='reveal'){
        lastCheckpoint+=elapsed;
        if(lastCheckpoint>=BALANCE.checkpointSeconds){lastCheckpoint=0;void persist(true);}
      }
      if(state.revision!==lastRevision)void persist();
    }else accumulator=0;
    render();requestAnimationFrame(frame);
  };
  render();requestAnimationFrame(frame);
}
void start().catch(error=>{
  $('action-title').textContent='The shore needs a moment.';
  $('action-hint').textContent='Please reload. Your saved data has not been cleared.';
  console.error(error);
});
