// audio.js — original WebAudio synth: no audio files, every sound made here.
// One clear job: chop thocks, wok sizzles, order dings, serve chimes.

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null, delay = 0) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Short filtered-noise burst: the chop thock.
  chop() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const dur = 0.09;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    this.tone(180, 0.07, 'triangle', 0.2, 90);
  }

  sizzleStart() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || this.sizzleNodes) return;
    const dur = 2;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    this.sizzleNodes = { src, gain };
  }

  sizzleStop() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.src.stop(); } catch (e) { /* already stopped */ }
    this.sizzleNodes = null;
  }

  ding() { this.tone(880, 0.18, 'sine', 0.18); this.tone(1318, 0.28, 'sine', 0.12, null, 0.09); }
  pickup() { this.tone(520, 0.08, 'triangle', 0.14, 700); }
  place() { this.tone(340, 0.09, 'triangle', 0.15, 260); }
  serve() {
    this.tone(523, 0.14, 'sine', 0.18);
    this.tone(659, 0.14, 'sine', 0.18, null, 0.1);
    this.tone(784, 0.3, 'sine', 0.2, null, 0.2);
  }
  fail() { this.tone(220, 0.25, 'sawtooth', 0.1, 140); }
  tick() { this.tone(1200, 0.05, 'square', 0.05); }
  start() {
    this.tone(392, 0.12, 'triangle', 0.16);
    this.tone(523, 0.12, 'triangle', 0.16, null, 0.1);
    this.tone(659, 0.22, 'triangle', 0.18, null, 0.2);
  }
}
