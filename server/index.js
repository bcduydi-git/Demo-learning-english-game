// Beacon Isle game server.
// - Serves the built game (dist/) over HTTP.
// - Runs co-op rooms over WebSocket (/ws). The server owns the shared game
//   state (shared/logic.js); clients send actions and render the state.
// - Rooms are kept in memory and written to data/rooms.json so a restart on
//   your own computer keeps progress. Players' browsers also keep a copy, so a
//   free host that wipes its disk can still resume a session.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createState, restoreState, applyAction, tick, SLOTS, other } from '../shared/logic.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');
const PORT = Number(process.env.PORT) || 8080;
const ROOM_TTL_MS = 14 * 24 * 3600 * 1000;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const rooms = new Map();

function log(...args) {
  console.log(new Date().toISOString().slice(11, 19), ...args);
}

// ---------- persistence ----------
function loadRooms() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const now = Date.now();
    for (const r of raw) {
      if (now - (r.lastActive || 0) > ROOM_TTL_MS) continue;
      const state = restoreState(r.state, r.code);
      rooms.set(r.code, { code: r.code, state, tokens: r.tokens || {}, sockets: {}, dirty: false, lastActive: r.lastActive });
    }
    log(`loaded ${rooms.size} room(s) from ${DATA_FILE}`);
  } catch {
    // first start: nothing saved yet
  }
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const out = [];
    for (const r of rooms.values()) out.push({ code: r.code, state: r.state, tokens: r.tokens, lastActive: r.lastActive });
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(out));
      fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
    } catch (e) {
      log('save failed', e.message);
    }
  }, 3000);
}

// ---------- rooms ----------
function newCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
}

function cleanCode(c) {
  return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg, exceptSlot) {
  for (const s of SLOTS) if (s !== exceptSlot) send(room.sockets[s], msg);
}

function pushState(room) {
  room.lastActive = Date.now();
  room.dirty = true;
  broadcast(room, { t: 'state', state: room.state });
  scheduleSave();
}

function pushEvents(room, ev) {
  if (ev && ev.length) broadcast(room, { t: 'ev', ev });
}

function attach(room, slot, ws, token, name) {
  const old = room.sockets[slot];
  if (old && old !== ws) {
    send(old, { t: 'err', code: 'replaced', msg: 'Bạn đã mở game ở một tab/máy khác.' });
    old._room = null;
    try { old.close(); } catch { /* ignore */ }
  }
  room.sockets[slot] = ws;
  room.tokens[slot] = token;
  ws._room = room;
  ws._slot = slot;
  const p = room.state.players[slot];
  p.connected = true;
  if (name) p.name = String(name).slice(0, 16);
  send(ws, { t: 'welcome', slot, room: room.code, state: room.state });
  pushState(room);
  log(`room ${room.code}: ${slot} (${p.name}) joined`);
}

function handleHello(ws, m) {
  const token = String(m.token || '').slice(0, 64);
  if (!token) return send(ws, { t: 'err', code: 'bad', msg: 'Thiếu mã định danh.' });
  const name = String(m.name || '').trim().slice(0, 16);
  const code = cleanCode(m.room);

  if (m.mode === 'create') {
    const slot = m.slot === 'p2' ? 'p2' : 'p1';
    let useCode = code && !rooms.has(code) ? code : newCode();
    const state = m.save ? restoreState(m.save, useCode) : createState(useCode);
    state.room = useCode;
    const room = { code: useCode, state, tokens: {}, sockets: {}, dirty: true, lastActive: Date.now() };
    for (const s of SLOTS) state.players[s].connected = false;
    rooms.set(useCode, room);
    return attach(room, slot, ws, token, name);
  }

  // join / resume
  let room = rooms.get(code);
  if (!room) {
    if (m.save && code) {
      // The server forgot this room (restart / free host sleeping):
      // rebuild it from the player's own saved copy.
      const state = restoreState(m.save, code);
      room = { code, state, tokens: {}, sockets: {}, dirty: true, lastActive: Date.now() };
      for (const s of SLOTS) state.players[s].connected = false;
      if (m.slot && SLOTS.includes(m.slot)) room.tokens[m.slot] = token;
      rooms.set(code, room);
      log(`room ${code}: restored from a player's save`);
    } else {
      return send(ws, { t: 'err', code: 'no_room', msg: `Không tìm thấy phòng "${code}". Kiểm tra lại mã.` });
    }
  }

  let slot = SLOTS.find((s) => room.tokens[s] === token);
  if (!slot) {
    const free = SLOTS.filter((s) => !room.tokens[s]);
    const wanted = SLOTS.includes(m.slot) ? m.slot : null;
    if (wanted && free.includes(wanted)) slot = wanted;
    else if (free.length) slot = free[0];
    else {
      const offline = SLOTS.filter((s) => !room.state.players[s].connected);
      if (!offline.length) return send(ws, { t: 'err', code: 'full', msg: 'Phòng đã đủ 2 người.' });
      const target = wanted && offline.includes(wanted) ? wanted : offline[0];
      if (!m.takeover) {
        return send(ws, {
          t: 'err', code: 'takeover', slot: target, name: room.state.players[target].name,
          msg: `Chỗ của "${room.state.players[target].name || target}" đang trống. Nếu đó là bạn (đổi máy/trình duyệt), bấm "Vào chỗ này".`,
        });
      }
      slot = target;
    }
  }
  attach(room, slot, ws, token, name || room.state.players[slot].name);
}

function handleMessage(ws, m) {
  if (m.t === 'hello') return handleHello(ws, m);
  if (m.t === 'ping') return send(ws, { t: 'pong', at: m.at });
  const room = ws._room;
  if (!room) return;
  const slot = ws._slot;
  if (m.t === 'act' && m.a && typeof m.a.type === 'string') {
    const ev = applyAction(room.state, slot, m.a, Date.now());
    pushState(room);
    pushEvents(room, ev);
  } else if (m.t === 'pos' && m.p) {
    room.state.pos[slot] = m.p;
    room.dirty = true;
    send(room.sockets[other(slot)], { t: 'pos', slot, p: m.p });
  } else if (m.t === 'lane') {
    // boss lane preview for the partner (not part of the saved state)
    send(room.sockets[other(slot)], { t: 'lane', slot, d: m.d });
  }
}

// ---------- http ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    return res.end(`ok ${rooms.size} rooms`);
  }
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(DIST, p));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    const target = !err && st.isFile() ? file : path.join(DIST, 'index.html');
    fs.readFile(target, (e2, buf) => {
      if (e2) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end('Chưa có bản build. Chạy "npm run build" trước.');
      }
      const ext = path.extname(target).toLowerCase();
      const cache = target.includes(`${path.sep}assets${path.sep}`) && /-[A-Za-z0-9_-]{8}\./.test(target)
        ? 'public, max-age=31536000, immutable' : 'no-cache';
      res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': cache });
      res.end(buf);
    });
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 });
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data) => {
    let m;
    try { m = JSON.parse(data); } catch { return; }
    try { handleMessage(ws, m); } catch (e) { log('error', e.stack || e); }
  });
  ws.on('close', () => {
    const room = ws._room;
    if (!room || room.sockets[ws._slot] !== ws) return;
    room.sockets[ws._slot] = null;
    room.state.players[ws._slot].connected = false;
    log(`room ${room.code}: ${ws._slot} left`);
    pushState(room);
  });
});

// keep connections alive behind proxies; drop dead ones
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch { /* ignore */ }
  }
}, 25000);

// time-driven game rules (boss final timer, rescue boat)
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.5, (now - lastTick) / 1000);
  lastTick = now;
  for (const room of rooms.values()) {
    const st = room.state;
    if (st.stage !== 'boss' && st.stage !== 'finale') continue;
    if (!SLOTS.some((s) => st.players[s].connected)) continue;
    const { ev, changed } = tick(st, dt, now);
    if (changed) {
      room.dirty = true;
      broadcast(room, { t: 'state', state: st });
    }
    pushEvents(room, ev);
    if (ev.length) scheduleSave();
  }
}, 100);

loadRooms();
server.listen(PORT, () => log(`Beacon Isle server on http://localhost:${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    if (saveTimer) clearTimeout(saveTimer);
    const out = [...rooms.values()].map((r) => ({ code: r.code, state: r.state, tokens: r.tokens, lastActive: r.lastActive }));
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DATA_FILE, JSON.stringify(out)); } catch { /* ignore */ }
    process.exit(0);
  });
}
