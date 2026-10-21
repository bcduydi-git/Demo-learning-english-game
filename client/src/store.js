// Per-player settings and local saves (this browser only).

const KEY_SETTINGS = 'beacon.settings';
const KEY_TOKEN = 'beacon.token';
const KEY_LAST = 'beacon.last';
const KEY_SAVE = 'beacon.save.';

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

export const DEFAULT_SETTINGS = {
  name: '',
  sub: 'always', // English subtitles: always | after (after listening) | tap
  vi: 'tap', // Vietnamese meaning: always | tap | off
  rate: 0.9, // voice speed
  boss: 'normal', // relaxed | normal | hard
  vol: { master: 0.8, music: 0.45, sfx: 0.8, voice: 1, amb: 0.6 },
  mute: false,
  voiceName: '',
  mic: true, // show the "speak" button where speech input is supported
};

export const settings = (() => {
  const s = read(KEY_SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...s, vol: { ...DEFAULT_SETTINGS.vol, ...(s.vol || {}) } };
})();

export function saveSettings() {
  write(KEY_SETTINGS, settings);
}

export function token() {
  let t = read(KEY_TOKEN, null);
  if (!t) {
    t = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
    write(KEY_TOKEN, t);
  }
  return t;
}

export function lastSession() {
  return read(KEY_LAST, null);
}
export function setLastSession(v) {
  write(KEY_LAST, v);
}
export function clearLastSession() {
  try { localStorage.removeItem(KEY_LAST); } catch { /* ignore */ }
}

export function loadSave(room) {
  return room ? read(KEY_SAVE + room, null) : null;
}
export function writeSave(room, state) {
  if (!room || !state) return;
  const { players, ...rest } = state;
  write(KEY_SAVE + room, {
    savedAt: Date.now(),
    state: { ...rest, players: { p1: { name: players.p1.name }, p2: { name: players.p2.name } } },
  });
}
