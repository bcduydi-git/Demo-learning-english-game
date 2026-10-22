// WebSocket connection to the game server, with automatic reconnect.

import { token, writeSave, loadSave, setLastSession } from './store.js';

export class Net {
  constructor() {
    this.ws = null;
    this.handlers = {};
    this.room = null;
    this.slot = null;
    this.state = null;
    this.status = 'idle'; // idle | connecting | online | offline
    this.wantOnline = false;
    this.retry = 0;
    this.hello = null;
    this.ping = 0;
  }

  on(type, fn) {
    (this.handlers[type] || (this.handlers[type] = [])).push(fn);
  }
  emit(type, ...args) {
    for (const fn of this.handlers[type] || []) fn(...args);
  }

  url() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  // mode: create | join ; opts: { name, slot, room, save, takeover }
  connect(mode, opts) {
    this.wantOnline = true;
    this.hello = { t: 'hello', mode, token: token(), ...opts };
    this.open();
  }

  open() {
    if (this.ws) {
      this.ws.onclose = null;
      try { this.ws.close(); } catch { /* ignore */ }
    }
    this.setStatus('connecting');
    const ws = new WebSocket(this.url());
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      const hello = { ...this.hello };
      if (hello.mode === 'join' && hello.room && !hello.save) hello.save = this.withSave(hello.room);
      ws.send(JSON.stringify(hello));
    };
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      this.handle(m);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.setStatus('offline');
      if (this.wantOnline) {
        const delay = Math.min(8000, 500 * 2 ** this.retry++);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.open(), delay);
      }
    };
  }

  setStatus(s) {
    this.status = s;
    this.emit('status', s);
  }

  handle(m) {
    switch (m.t) {
      case 'welcome':
        this.room = m.room;
        this.slot = m.slot;
        this.state = m.state;
        // after the first welcome, reconnects always go back to this room
        this.hello = { t: 'hello', mode: 'join', token: token(), room: m.room, slot: m.slot, name: this.hello.name };
        setLastSession({ room: m.room, slot: m.slot, at: Date.now() });
        writeSave(m.room, m.state);
        this.setStatus('online');
        this.emit('welcome', m);
        this.emit('state', m.state);
        break;
      case 'state':
        this.state = m.state;
        writeSave(this.room, m.state);
        this.emit('state', m.state);
        break;
      case 'ev':
        for (const e of m.ev) this.emit('ev', e);
        break;
      case 'pos':
        this.emit('pos', m.slot, m.p);
        break;
      case 'lane':
        this.emit('lane', m.slot, m.d);
        break;
      case 'pong':
        this.ping = Date.now() - m.at;
        break;
      case 'err':
        if (m.code === 'no_room' || m.code === 'full' || m.code === 'replaced' || m.code === 'takeover') {
          this.wantOnline = false;
        }
        this.emit('error', m);
        break;
      default:
        break;
    }
  }

  // Attach the local save when (re)joining so the server can rebuild a
  // room it forgot (restart or a free host that went to sleep).
  withSave(room) {
    const s = loadSave(room);
    return s ? s.state : undefined;
  }

  send(msg) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  act(a) {
    return this.send({ t: 'act', a });
  }

  pos(p) {
    this.send({ t: 'pos', p });
  }

  lane(d) {
    this.send({ t: 'lane', d });
  }

  close() {
    this.wantOnline = false;
    clearTimeout(this.timer);
    if (this.ws) {
      this.ws.onclose = null;
      try { this.ws.close(); } catch { /* ignore */ }
    }
    this.ws = null;
    this.setStatus('idle');
  }
}

export const net = new Net();
