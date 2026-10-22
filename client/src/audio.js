// Sound: synthesised effects, ambience and music (Web Audio, no files needed)
// plus English voice lines through the browser's speech engine.
// Optional: drop recorded voice files in /assets/voice/ with a manifest.json
// ({ "text of the line": "file.mp3" }) and they are used instead of the
// speech engine.

import { settings, saveSettings } from './store.js';

let ctx = null;
let master, musicBus, sfxBus, ambBus;
let noiseBuf = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  ambBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  ambBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyVolumes();
  preloadSfx();
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

export function applyVolumes() {
  if (!ctx) return;
  const v = settings.vol;
  master.gain.value = settings.mute ? 0 : v.master;
  musicBus.gain.value = v.music * 0.7;
  sfxBus.gain.value = v.sfx;
  ambBus.gain.value = v.amb;
}

export function toggleMute() {
  settings.mute = !settings.mute;
  saveSettings();
  applyVolumes();
  if (settings.mute) stopSpeech();
  return settings.mute;
}

// ---------------------------------------------------------------- effects
function env(g, t, a, peak, d, end = 0.0001) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(end, t + a + d);
}

function tone(freq, dur, { type = 'square', vol = 0.15, slide = 0, delay = 0, bus = sfxBus, attack = 0.005 } = {}) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  env(g, t, attack, vol, dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + attack + dur + 0.05);
}

function noise(dur, { vol = 0.2, filter = 'lowpass', freq = 1200, q = 1, delay = 0, bus = sfxBus, attack = 0.005, sweep = 0 } = {}) {
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, attack, vol, dur);
  src.connect(f).connect(g).connect(bus);
  src.start(t, Math.random());
  src.stop(t + attack + dur + 0.05);
}

const SFX = {
  step: () => noise(0.05, { vol: 0.05, freq: 900 + Math.random() * 400, filter: 'bandpass', q: 2 }),
  blip: () => tone(660 + Math.random() * 60, 0.03, { vol: 0.04, type: 'square' }),
  click: () => tone(1200, 0.02, { vol: 0.06, type: 'square' }),
  key: () => tone(900 + Math.random() * 200, 0.02, { vol: 0.05, type: 'triangle' }),
  ui: () => { tone(520, 0.05, { vol: 0.08 }); tone(780, 0.06, { vol: 0.06, delay: 0.05 }); },
  open: () => { tone(400, 0.08, { vol: 0.08, type: 'triangle' }); tone(600, 0.1, { vol: 0.08, type: 'triangle', delay: 0.06 }); },
  close: () => { tone(600, 0.06, { vol: 0.07, type: 'triangle' }); tone(400, 0.08, { vol: 0.07, type: 'triangle', delay: 0.05 }); },
  pickup: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { vol: 0.1, type: 'square', delay: i * 0.07 })); },
  success: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { vol: 0.1, type: 'triangle', delay: i * 0.09 })); },
  fail: () => { tone(220, 0.25, { vol: 0.12, type: 'sawtooth', slide: 0.6 }); tone(160, 0.3, { vol: 0.1, type: 'square', slide: 0.5, delay: 0.12 }); },
  wrong: () => tone(140, 0.12, { vol: 0.1, type: 'square' }),
  spark: () => { for (let i = 0; i < 5; i++) noise(0.05, { vol: 0.15, freq: 3000 + Math.random() * 3000, filter: 'highpass', delay: i * 0.06 }); },
  radio: () => { noise(0.25, { vol: 0.08, filter: 'bandpass', freq: 2200, q: 3 }); tone(1400, 0.05, { vol: 0.05, delay: 0.25 }); },
  msg: () => { tone(880, 0.06, { vol: 0.07, type: 'sine' }); tone(1320, 0.08, { vol: 0.06, type: 'sine', delay: 0.07 }); },
  door: () => { noise(0.6, { vol: 0.2, freq: 300, sweep: 0.5 }); tone(90, 0.6, { vol: 0.15, type: 'sawtooth', slide: 0.7 }); },
  thud: () => { tone(80, 0.25, { vol: 0.25, type: 'sine', slide: 0.5 }); noise(0.15, { vol: 0.15, freq: 400 }); },
  splash: () => noise(0.5, { vol: 0.15, freq: 1500, sweep: 0.3, attack: 0.02 }),
  trap: () => { noise(0.15, { vol: 0.2, freq: 2500, filter: 'highpass' }); tone(300, 0.3, { vol: 0.12, type: 'sawtooth', slide: 0.4 }); },
  zap: () => { tone(1800, 0.15, { vol: 0.1, type: 'sawtooth', slide: 0.2 }); noise(0.1, { vol: 0.1, freq: 4000, filter: 'highpass' }); },
  hit: () => { tone(120, 0.2, { vol: 0.2, type: 'square', slide: 0.5 }); noise(0.2, { vol: 0.15, freq: 800 }); },
  thunder: () => { noise(1.6, { vol: 0.35, freq: 400, sweep: 0.3, attack: 0.02 }); noise(0.3, { vol: 0.2, freq: 3000, filter: 'highpass' }); },
  hum: () => { tone(60, 1.2, { vol: 0.12, type: 'sawtooth', attack: 0.3 }); tone(120, 1.2, { vol: 0.05, type: 'square', attack: 0.3 }); },
  bird: () => { const f = 2400 + Math.random() * 800; tone(f, 0.08, { vol: 0.03, type: 'sine', slide: 1.3 }); tone(f * 1.1, 0.08, { vol: 0.03, type: 'sine', slide: 0.8, delay: 0.12 }); },
  squawk: () => { tone(900, 0.12, { vol: 0.08, type: 'sawtooth', slide: 1.4 }); tone(1100, 0.1, { vol: 0.07, type: 'sawtooth', slide: 0.7, delay: 0.12 }); },
  heart: () => { tone(300, 0.1, { vol: 0.15, type: 'square', slide: 0.6 }); tone(200, 0.2, { vol: 0.12, type: 'square', slide: 0.6, delay: 0.1 }); },
  whoosh: () => noise(0.4, { vol: 0.12, filter: 'bandpass', freq: 600, sweep: 4, q: 2, attack: 0.1 }),
  lift: () => { tone(200, 0.15, { vol: 0.1, type: 'triangle', slide: 1.5 }); },
};

// Recorded effects from the CC0 Ninja Adventure pack (assets/audio/sfx/*.mp3).
// Anything not listed here, or not loaded yet, uses the synthesised version.
const SFX_FILES = {
  pickup: 'pickup', success: 'success', ui: 'ui', open: 'open', close: 'close', wrong: 'wrong',
  fail: 'fail', door: 'secret', hum: 'power', zap: 'magic', hit: 'hit', heart: 'hit', click: 'ui', lift: 'power2',
};
const SFX_GAIN = { ui: 0.45, open: 0.5, close: 0.5, click: 0.35, wrong: 0.6, zap: 0.55, hit: 0.6, heart: 0.7 };
const buffers = {};
const loading = {};

function loadBuffer(url) {
  if (buffers[url] || loading[url]) return;
  loading[url] = fetch(url)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((b) => ctx.decodeAudioData(b))
    .then((buf) => { buffers[url] = buf; return buf; })
    .catch(() => null);
}

function preloadSfx() {
  for (const f of new Set(Object.values(SFX_FILES))) loadBuffer(`assets/audio/sfx/${f}.mp3`);
}

function playBuffer(buf, bus, gain = 1, loop = false) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = loop;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(bus);
  src.start();
  return { src, g };
}

export function sfx(name) {
  if (!ensure()) return;
  const file = SFX_FILES[name];
  const buf = file && buffers[`assets/audio/sfx/${file}.mp3`];
  try {
    if (buf) playBuffer(buf, sfxBus, SFX_GAIN[name] ?? 0.8);
    else if (SFX[name]) SFX[name]();
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------- ambience
let ambNodes = [];
let ambMode = null;
let birdTimer = null;

export function ambience(mode) {
  if (!ensure() || mode === ambMode) return;
  ambMode = mode;
  for (const n of ambNodes) { try { n.stop(); } catch { /* ignore */ } }
  ambNodes = [];
  clearInterval(birdTimer);
  if (!mode) return;
  // waves: filtered noise with slow swell
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = mode === 'storm' ? 900 : 500;
  const g = ctx.createGain();
  g.gain.value = mode === 'storm' ? 0.18 : mode === 'indoor' ? 0.035 : 0.1;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = mode === 'storm' ? 0.23 : 0.12;
  const lfoG = ctx.createGain();
  lfoG.gain.value = mode === 'storm' ? 0.1 : 0.07;
  lfo.connect(lfoG).connect(g.gain);
  src.connect(f).connect(g).connect(ambBus);
  src.start();
  lfo.start();
  ambNodes.push(src, lfo);
  if (mode === 'storm' || mode === 'wind') {
    const w = ctx.createBufferSource();
    w.buffer = noiseBuf;
    w.loop = true;
    const bf = ctx.createBiquadFilter();
    bf.type = 'bandpass';
    bf.frequency.value = 700;
    bf.Q.value = 4;
    const wl = ctx.createOscillator();
    wl.frequency.value = 0.17;
    const wlg = ctx.createGain();
    wlg.gain.value = 400;
    wl.connect(wlg).connect(bf.frequency);
    const wg = ctx.createGain();
    wg.gain.value = mode === 'storm' ? 0.12 : 0.05;
    w.connect(bf).connect(wg).connect(ambBus);
    w.start();
    wl.start();
    ambNodes.push(w, wl);
  }
  if (mode === 'island') birdTimer = setInterval(() => { if (Math.random() < 0.35) sfx('bird'); }, 2500);
}

// ---------------------------------------------------------------- music
// A tiny step sequencer. Each song: tempo, chord roots, scale, patterns.
const SONGS = {
  island: { bpm: 84, chords: [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]], lead: [0, 2, 4, 2, 7, 4, 2, 0, 4, 7, 9, 7, 4, 2, 4, -1], scale: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], wave: 'triangle' },
  woods: { bpm: 72, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], lead: [4, -1, 2, -1, 0, -1, 2, 4, -1, 5, 4, -1, 2, -1, -1, -1], scale: [0, 2, 3, 5, 7, 8, 10, 12], wave: 'sine' },
  boss: { bpm: 138, chords: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]], lead: [0, 0, 7, 0, 5, 0, 3, 2, 0, 0, 7, 0, 8, 7, 5, 3], scale: [0, 2, 3, 5, 7, 8, 10, 12, 14], wave: 'square', bass: true },
  night: { bpm: 66, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], lead: [7, -1, 4, -1, 2, -1, 4, -1, 9, -1, 7, -1, 4, -1, -1, -1], scale: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], wave: 'sine' },
  victory: { bpm: 110, chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], lead: [0, 2, 4, 7, 4, 7, 9, 7, 5, 4, 2, 4, 7, 9, 11, 12], scale: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], wave: 'triangle' },
};

let song = null;
let songName = null;
let step = 0;
let nextTime = 0;
let seqTimer = null;

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

function schedule() {
  if (!song) return;
  const spb = 60 / song.bpm / 2; // eighth notes
  while (nextTime < ctx.currentTime + 0.25) {
    const bar = Math.floor(step / 16) % song.chords.length;
    const chord = song.chords[bar];
    const s = step % 16;
    const t = nextTime;
    if (s === 0) {
      for (const n of chord) padNote(mtof(n - 12), t, spb * 15, song.wave === 'square' ? 0.025 : 0.035);
    }
    if (song.bass && s % 2 === 0) bassNote(mtof(chord[0] - 24), t, spb * 0.9);
    const li = song.lead[s];
    if (li >= 0 && (step >> 4) % 2 === 1) {
      const root = chord[0];
      const deg = song.scale[li % song.scale.length];
      leadNote(mtof(root + deg), t, spb * 1.6, song.wave);
    } else if (s % 4 === 2 && !song.bass) {
      leadNote(mtof(chord[(s / 2) % chord.length] + 12), t, spb, 'sine', 0.025);
    }
    nextTime += spb;
    step++;
  }
}

function padNote(f, t, dur, vol) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.1);
}
function leadNote(f, t, dur, type, vol = 0.05) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(type === 'square' ? vol * 0.5 : vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function bassNote(f, t, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.value = f;
  const fl = ctx.createBiquadFilter();
  fl.type = 'lowpass';
  fl.frequency.value = 500;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Music: CC0 tracks from the Ninja Adventure pack, cross-faded. If a file
// cannot be loaded, the small built-in sequencer plays instead.
let track = null;

function stopTrack(fade = 1.2) {
  if (!track) return;
  const t = track;
  track = null;
  try {
    t.g.gain.setValueAtTime(t.g.gain.value, ctx.currentTime);
    t.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
    t.src.stop(ctx.currentTime + fade + 0.05);
  } catch { /* ignore */ }
}

export function music(name) {
  if (!ensure() || name === songName) return;
  songName = name;
  stopTrack();
  clearInterval(seqTimer);
  song = null;
  if (!name) return;
  const url = `assets/audio/music/${name}.mp3`;
  loadBuffer(url);
  Promise.resolve(loading[url]).then((buf) => {
    if (songName !== name) return;
    if (buf) {
      track = playBuffer(buf, musicBus, 0.0001, true);
      track.g.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);
      return;
    }
    song = SONGS[name] || SONGS.island;
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    seqTimer = setInterval(schedule, 100);
  });
}

// ---------------------------------------------------------------- voice
const VOICE_STYLE = {
  p1: { pitch: 1.15, rate: 1, pref: ['female', 'zira', 'aria', 'jenny', 'samantha', 'google us english', 'libby', 'sonia'] },
  p2: { pitch: 0.95, rate: 1, pref: ['guy', 'david', 'ryan', 'daniel', 'google uk english male', 'alex', 'male'] },
  pip: { pitch: 1.9, rate: 1.08, pref: ['google us english', 'samantha', 'zira', 'aria'] },
  keeper: { pitch: 0.95, rate: 0.92, pref: ['sonia', 'libby', 'google uk english female', 'hazel', 'susan', 'female', 'karen', 'moira'] },
  captain: { pitch: 1.0, rate: 0.98, pref: ['jenny', 'michelle', 'aria', 'google us english', 'female', 'samantha'] },
  storm: { pitch: 0.2, rate: 0.82, pref: ['guy', 'david', 'daniel', 'male'] },
  narr: { pitch: 1, rate: 1, pref: [] },
  radio: { pitch: 1, rate: 1, pref: [] },
};

let voices = [];
let manifest = null;
let currentAudio = null;
const synth = window.speechSynthesis || null;

function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
}
if (synth) {
  loadVoices();
  synth.onvoiceschanged = loadVoices;
}

fetch('assets/voice/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { manifest = m; }).catch(() => {});

export function englishVoices() {
  loadVoices();
  return voices;
}

export function hasSpeech() {
  return !!synth;
}

function pickVoice(style) {
  if (!voices.length) loadVoices();
  if (!voices.length) return null;
  if (settings.voiceName && style !== 'p1' && style !== 'p2' && style !== 'keeper' && style !== 'captain') {
    const v = voices.find((x) => x.name === settings.voiceName);
    if (v) return v;
  }
  const prefs = (VOICE_STYLE[style] || VOICE_STYLE.narr).pref;
  const score = (v) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|online|neural|premium|enhanced/.test(n)) s += 5;
    if (/^en-us/i.test(v.lang)) s += 1;
    prefs.forEach((p, i) => { if (n.includes(p)) s += 10 - i * 0.5; });
    if (settings.voiceName && v.name === settings.voiceName) s += 3;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

export function stopSpeech() {
  if (synth) synth.cancel();
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
}

let speakId = 0;
// Speak an English line. Resolves when finished (or immediately if no voice).
export function speak(text, style = 'narr', { rate = 1 } = {}) {
  stopSpeech();
  const id = ++speakId;
  const vol = settings.mute ? 0 : settings.vol.master * settings.vol.voice;
  return new Promise((resolve) => {
    if (!text || vol <= 0) return resolve();
    const file = manifest && manifest[text];
    if (file) {
      const a = new Audio('assets/voice/' + file);
      a.volume = Math.min(1, vol);
      a.playbackRate = settings.rate * rate;
      currentAudio = a;
      a.onended = a.onerror = () => resolve();
      a.play().catch(() => resolve());
      return;
    }
    if (!synth) return resolve();
    const u = new SpeechSynthesisUtterance(text.replace(/\.\.\./g, ', '));
    const st = VOICE_STYLE[style] || VOICE_STYLE.narr;
    const v = pickVoice(style);
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-US';
    u.pitch = st.pitch;
    u.rate = Math.max(0.5, Math.min(1.6, st.rate * settings.rate * rate));
    u.volume = Math.min(1, vol);
    let done = false;
    const fin = () => { if (!done) { done = true; resolve(); } };
    u.onend = fin;
    u.onerror = fin;
    // safety: some browsers never fire onend
    setTimeout(fin, 1500 + text.length * 120 / u.rate);
    synth.speak(u);
    if (id !== speakId) fin();
  });
}

// ---------------------------------------------------------------- speech input
// Optional. The transcript is shown to the player to check/edit before
// sending. It is never used to score pronunciation.
export function speechInputSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listenOnce() {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject(new Error('unsupported'));
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    let got = false;
    r.onresult = (e) => { got = true; resolve(e.results[0][0].transcript); };
    r.onerror = (e) => reject(new Error(e.error || 'error'));
    r.onend = () => { if (!got) reject(new Error('no-speech')); };
    try { r.start(); } catch (e) { reject(e); }
    setTimeout(() => { try { r.stop(); } catch { /* ignore */ } }, 7000);
  });
}
