export class GameAudio {
  private context?: AudioContext;
  muted = false;
  async unlock() {
    try { this.context ??= new AudioContext(); if (this.context.state === 'suspended') await this.context.resume(); } catch { /* Visual cues remain sufficient. */ }
  }
  cue(kind: 'cast' | 'nibble' | 'bite' | 'land') {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const ctx = this.context, osc = ctx.createOscillator(), gain = ctx.createGain();
    const frequencies = { cast: 300, nibble: 480, bite: 820, land: 660 };
    osc.type = 'sine'; osc.frequency.setValueAtTime(frequencies[kind], ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(kind === 'land' ? 990 : frequencies[kind] * .65, ctx.currentTime + .18);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(.08, ctx.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .3);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .31);
  }
  suspend() { void this.context?.suspend(); }
}
