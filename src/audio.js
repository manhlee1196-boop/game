/* ============================================================
 * Âm thanh tổng hợp bằng WebAudio (không cần file mp3)
 * ============================================================ */

export class SFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
    this._noiseBuf = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);

    // Buffer nhiễu trắng tái sử dụng
    const len = this.ctx.sampleRate * 1.5;
    this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this._noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  _now() {
    return this.ctx.currentTime;
  }

  _noise({ t0 = 0, dur = 0.3, gain = 0.3, freq = 1200, type = 'lowpass', sweep = 0 }) {
    if (!this.ctx || !this.enabled) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    if (sweep) {
      filter.frequency.setValueAtTime(freq, this._now() + t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq * sweep), this._now() + t0 + dur);
    }
    const g = this.ctx.createGain();
    const t = this._now() + t0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  _tone({ t0 = 0, dur = 0.15, gain = 0.2, freq = 440, type = 'sine', freqEnd = 0, delay = 0 }) {
    if (!this.ctx || !this.enabled) return;
    const t = this._now() + t0 + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /* ---- Các tiếng cụ thể ---- */

  cast() {
    // Tiếng roi vút (whoosh)
    this._noise({ dur: 0.32, gain: 0.22, freq: 2800, type: 'bandpass', sweep: 0.15 });
    this._tone({ dur: 0.18, gain: 0.08, freq: 520, type: 'triangle', freqEnd: 180 });
  }

  splash() {
    // Tõm nước
    this._noise({ dur: 0.45, gain: 0.4, freq: 900, type: 'lowpass', sweep: 0.25 });
    this._noise({ t0: 0.06, dur: 0.35, gain: 0.18, freq: 2400, type: 'bandpass', sweep: 0.3 });
    this._tone({ dur: 0.22, gain: 0.12, freq: 220, type: 'sine', freqEnd: 90 });
  }

  plip() {
    // Phao chạm nước nhẹ
    this._tone({ dur: 0.12, gain: 0.15, freq: 700, type: 'sine', freqEnd: 280 });
    this._noise({ dur: 0.12, gain: 0.1, freq: 1500, type: 'highpass' });
  }

  bite() {
    // Báo hiệu cắn câu — 2 tiếng beep nhanh
    this._tone({ dur: 0.09, gain: 0.25, freq: 880, type: 'square' });
    this._tone({ dur: 0.09, gain: 0.25, freq: 1174, type: 'square', delay: 0.11 });
  }

  hook() {
    // Giật câu
    this._noise({ dur: 0.18, gain: 0.25, freq: 3200, type: 'bandpass', sweep: 0.2 });
    this._tone({ dur: 0.12, gain: 0.18, freq: 340, type: 'sawtooth', freqEnd: 620 });
  }

  reelClick() {
    this._tone({ dur: 0.035, gain: 0.06, freq: 2400, type: 'square' });
  }

  lineBreak() {
    // Đứt dây
    this._tone({ dur: 0.3, gain: 0.28, freq: 1200, type: 'sawtooth', freqEnd: 120 });
    this._noise({ dur: 0.4, gain: 0.25, freq: 3000, type: 'highpass', sweep: 0.15 });
  }

  catchFish() {
    // Giai điệu vui khi câu được
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this._tone({ dur: 0.16, gain: 0.22, freq: f, type: 'triangle', delay: i * 0.11 });
      this._tone({ dur: 0.16, gain: 0.1, freq: f * 2, type: 'sine', delay: i * 0.11 });
    });
    this._noise({ dur: 0.35, gain: 0.12, freq: 5000, type: 'highpass', sweep: 0.4, t0: 0.15 });
  }

  ui() {
    this._tone({ dur: 0.07, gain: 0.12, freq: 660, type: 'triangle' });
  }
}
