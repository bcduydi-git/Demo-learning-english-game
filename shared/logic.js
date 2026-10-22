// Shared game rules. The server runs applyAction() as the single source of
// truth and broadcasts the resulting state; clients only render it.

import { SCENES, BOSS, CALL, BAY, DOOR_HALVES, makeGenerator, generatorSequence, parseBoatCommand } from './content.js';
import { normalize, matchPhrase } from './phrases.js';

export const SLOTS = ['p1', 'p2'];
// Who each player is drawn as (independent of the role they chose).
export const LOOKS = ['lac', 'tim'];
export const DEFAULT_LOOK = { p1: 'lac', p2: 'tim' };
export const LOOK_NAMES = { lac: 'Lắc', tim: 'Tím' };
export const other = (slot) => (slot === 'p1' ? 'p2' : 'p1');
export const SAVE_VERSION = 1;

// Give a player the look they asked for. If the partner is already playing
// that character, the newcomer gets the other one; the two never match.
export function setLook(state, slot, look) {
  if (!LOOKS.includes(look)) return;
  const o = other(slot);
  const rest = LOOKS.find((l) => l !== look);
  if (state.players[o].connected && state.players[o].look === look) {
    state.players[slot].look = rest;
    return;
  }
  state.players[slot].look = look;
  if (state.players[o].look === look) state.players[o].look = rest;
}

export function createState(room, rand = Math.random) {
  return {
    v: SAVE_VERSION,
    room,
    createdAt: Date.now(),
    stage: 'world', // world | boss | finale | credits
    players: {
      p1: { name: '', connected: false, look: DEFAULT_LOOK.p1 },
      p2: { name: '', connected: false, look: DEFAULT_LOOK.p2 },
    },
    flags: {},
    scene: null, // { id, idx, ready: { p1, p2 } }
    sceneQueue: [],
    gen: makeGenerator(rand),
    genProgress: 0,
    genFails: 0,
    radioSent: {},
    lift: { p1: 0, p2: 0 },
    enter: {},
    boss: null,
    call: null,
    boat: null,
    learn: { p1: {}, p2: {} },
    pos: { p1: null, p2: null },
    log: [],
  };
}

// Everyone who is connected must press "next" before a shared line advances,
// so neither player is left behind in the story.
function connectedSlots(state) {
  const c = SLOTS.filter((s) => state.players[s].connected);
  return c.length ? c : SLOTS;
}

function learn(state, slot, id, field) {
  if (!id) return;
  const book = state.learn[slot];
  const e = book[id] || (book[id] = { s: 0, u: 0, r: 0 });
  if (field === 's') e.s = 1;
  else e[field] += 1;
  if (field !== 's') e.s = 1;
}

function seeLine(state, line) {
  if (line && line.phrase) for (const id of line.phrase) for (const s of SLOTS) learn(state, s, id, 's');
}

export function startScene(state, id) {
  if (!SCENES[id]) return;
  if (state.scene) {
    if (state.scene.id !== id && !state.sceneQueue.includes(id)) state.sceneQueue.push(id);
    return;
  }
  state.scene = { id, idx: 0, ready: {} };
  seeLine(state, SCENES[id][0]);
}

function endScene(state, id, ev) {
  const f = state.flags;
  switch (id) {
    case 'intro': f.intro_done = true; break;
    case 'pip_meet': f.pip_met = true; break;
    case 'radio_done': break;
    case 'journal': f.journal = true; break;
    case 'fog_intro': f.fog_intro = true; break;
    case 'boss_intro':
      state.boss = newBoss(state.boss);
      break;
    case 'boss_won':
      state.stage = 'finale';
      state.call = { q: 0, tries: 0 };
      ev.push({ e: 'call_start' });
      break;
    case 'boat_intro':
      state.boat = newBoat();
      break;
    case 'ending':
      state.stage = 'credits';
      f.complete = true;
      break;
    default: break;
  }
}

function advanceScene(state, ev) {
  const sc = state.scene;
  const lines = SCENES[sc.id];
  sc.idx += 1;
  sc.ready = {};
  if (sc.idx >= lines.length) {
    const id = sc.id;
    state.scene = null;
    endScene(state, id, ev);
    const next = state.sceneQueue.shift();
    if (next) startScene(state, next);
  } else {
    seeLine(state, lines[sc.idx]);
  }
}

function newBoss(prev) {
  return {
    status: 'rules', // rules | fight | final | lost | won
    hp: BOSS.maxHp,
    lamp: BOSS.lampHearts,
    phase: 0,
    attempt: prev ? prev.attempt : 0,
    ready: {},
    diff: prev ? prev.diff : {},
    finalDone: {},
    finalEndsAt: 0,
    wave: 0, // increments every time a fight (re)starts so clients reset lanes
  };
}

const FINAL_SECONDS = { relaxed: 35, normal: 25, hard: 18 };
export const BOAT_SPEED = 0.32; // rows per second

function newBoat() {
  return {
    y: 0, // rows travelled (float)
    lane: BAY.startLane,
    target: BAY.startLane,
    moving: false,
    commander: 'p2',
    beamer: 'p1',
    beam: 0, // beam angle in degrees, 0 = straight out to sea
    bumps: 0,
    swapped: false,
    checkpoint: 0,
    t: 0,
    last: null, // last command reply shown to both
  };
}

// Drifting mast: every 10 s it sweeps across the bay from left to right
// (2 lanes wide), then is gone for 6 s. Returns the lane of its left end,
// or null while it is away.
export const MAST_CYCLE = 10;
export function mastLane(t) {
  const p = t % MAST_CYCLE;
  if (p >= 4) return null;
  return -2 + p * ((BAY.lanes + 2) / 4);
}

export function checkCallAnswer(qIndex, text) {
  const q = CALL[qIndex];
  if (!q) return false;
  const n = ' ' + normalize(text) + ' ';
  return q.keys.every((group) => group.some((k) => n.includes(' ' + k + ' ')));
}

// Apply one player action. Mutates state, returns a list of events
// ({ e: name, ... }) for the clients to play as feedback.
export function applyAction(state, slot, a, now = Date.now()) {
  const ev = [];
  const f = state.flags;
  const sc = state.scene;

  switch (a.type) {
    case 'start':
      if (!f.started) {
        f.started = true;
        startScene(state, 'intro');
      }
      break;

    case 'scene_next':
      if (sc && sc.id === a.id && sc.idx === a.idx) {
        sc.ready[slot] = true;
        if (connectedSlots(state).every((s) => sc.ready[s])) advanceScene(state, ev);
      }
      break;

    case 'scene_voice': // a player asks the game to read their line aloud for both
      if (sc && sc.id === a.id && sc.idx === a.idx) ev.push({ e: 'voice', id: a.id, idx: a.idx, by: slot });
      break;

    case 'seen':
      for (const id of a.ids || []) learn(state, slot, id, 's');
      break;

    case 'pickup': {
      const item = a.item;
      if (item === 'tools' && slot === 'p1' && !f.has_tools) { f.has_tools = true; ev.push({ e: 'got', item, by: slot }); }
      else if (item === 'radio' && slot === 'p2' && !f.has_radio) { f.has_radio = true; ev.push({ e: 'got', item, by: slot }); }
      else if (item === 'lens' && !f.lens) { f.lens = true; ev.push({ e: 'got', item, by: slot }); startScene(state, 'lens_found'); }
      else if (item === 'bottle' && !f.bottle) { f.bottle = true; }
      else if (item === 'page2' && !f.page2) { f.page2 = true; }
      if (f.has_tools && f.has_radio && !f.pip_called) {
        f.pip_called = true;
        startScene(state, 'pip_meet');
      }
      break;
    }

    case 'radio_msg': {
      const text = String(a.text || '').slice(0, 140).trim();
      if (!text) break;
      const pid = a.phraseId || matchPhrase(text);
      learn(state, slot, pid, 'u');
      const msg = { by: slot, text, pid: pid || null, at: now };
      state.log.push(msg);
      if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
      ev.push({ e: 'radio', ...msg });
      if (f.pip_met && !f.radio_done) {
        state.radioSent[slot] = true;
        if (connectedSlots(state).every((s) => state.radioSent[s])) {
          f.radio_done = true;
          startScene(state, 'radio_done');
        }
      }
      break;
    }

    case 'log_lift': {
      if (!f.radio_done || f.log_done) break;
      state.lift[slot] = now;
      const o = other(slot);
      if (state.lift[o] > 0 && Math.abs(now - state.lift[o]) <= 1500) {
        f.log_done = true;
        ev.push({ e: 'log_moved' });
        startScene(state, 'log_done');
      } else {
        ev.push({ e: 'lift', by: slot });
      }
      break;
    }

    case 'read_journal':
      if (!f.log_done) break;
      if (!f.journal && !f.journal_started) {
        f.journal_started = true;
        startScene(state, 'journal');
      }
      break;

    case 'fog_enter':
      if (!f.fog_intro && !f.fog_started) {
        f.fog_started = true;
        startScene(state, 'fog_intro');
      }
      break;

    case 'maze_trap':
      ev.push({ e: 'trap', by: slot });
      break;

    case 'lookout':
      ev.push({ e: 'lookout', by: slot, on: !!a.on });
      break;

    case 'station_play':
      if (slot === 'p2') ev.push({ e: 'station', by: slot });
      break;

    case 'gen_input': {
      if (slot !== 'p1' || f.power) break;
      const seq = generatorSequence(state.gen);
      const want = seq[state.genProgress];
      if (want && want.k === a.k && want.v === a.v) {
        state.genProgress += 1;
        ev.push({ e: 'gen_ok', step: state.genProgress, total: seq.length });
        if (state.genProgress >= seq.length) {
          f.power = true;
          ev.push({ e: 'power_on' });
          startScene(state, 'power_on');
        }
      } else {
        state.genProgress = 0;
        state.genFails += 1;
        ev.push({ e: 'gen_fail', k: a.k, v: a.v });
      }
      break;
    }

    case 'door_try': {
      if (!f.power || f.door_open) break;
      const typed = normalize(a.text);
      const want = DOOR_HALVES.answer.split(' ');
      const got = typed.split(' ');
      const words = want.map((w, i) => ({ w: got[i] || '', ok: got[i] === w }));
      const ok = typed === DOOR_HALVES.answer;
      ev.push({ e: 'door_result', ok, words, by: slot, count: want.length, text: String(a.text || '').slice(0, 80) });
      if (ok) {
        f.door_open = true;
        learn(state, slot, 'hold_on', 'u');
        learn(state, slot, 'help_is_coming', 'u');
        startScene(state, 'door_open');
      }
      break;
    }

    case 'enter': {
      if (!(f.door_open && f.lens && f.power) || state.stage !== 'world') break;
      state.enter[slot] = !!a.on;
      if (connectedSlots(state).every((s) => state.enter[s])) {
        state.stage = 'boss';
        state.enter = {};
        startScene(state, 'boss_intro');
      } else {
        ev.push({ e: 'enter_wait', by: slot, on: !!a.on });
      }
      break;
    }

    // ---- boss ----
    case 'boss_ready': {
      const b = state.boss;
      if (!b || (b.status !== 'rules')) break;
      b.ready[slot] = true;
      if (a.diff && FINAL_SECONDS[a.diff]) b.diff[slot] = a.diff;
      if (connectedSlots(state).every((s) => b.ready[s])) {
        b.status = 'fight';
        b.hp = BOSS.maxHp;
        b.lamp = BOSS.lampHearts;
        b.phase = 0;
        b.attempt += 1;
        b.wave += 1;
        b.finalDone = {};
        ev.push({ e: 'boss_go' });
      }
      break;
    }

    case 'boss_hit': {
      const b = state.boss;
      if (!b || b.status !== 'fight') break;
      const dmg = [3, 4, 4][b.phase] || 4;
      b.hp = Math.max(0, b.hp - dmg);
      ev.push({ e: 'boss_hit', by: slot, dmg });
      if (b.phase === 2 && a.recall) {
        const pid = matchPhrase(a.text || '');
        learn(state, slot, pid, 'r');
      }
      const ph = BOSS.phases[b.phase];
      if (ph && b.hp <= ph.until) {
        b.phase += 1;
        if (b.phase >= BOSS.phases.length) {
          b.status = 'final';
          b.finalDone = {};
          b.finalEndsAt = now + finalSeconds(state) * 1000;
          ev.push({ e: 'boss_final', ms: finalSeconds(state) * 1000 });
        } else {
          ev.push({ e: 'boss_phase', phase: b.phase });
        }
      }
      break;
    }

    case 'boss_leak': {
      const b = state.boss;
      if (!b || (b.status !== 'fight' && b.status !== 'final')) break;
      b.lamp -= 1;
      ev.push({ e: 'lamp_hit', by: slot });
      if (b.lamp <= 0) { b.status = 'lost'; ev.push({ e: 'boss_lost' }); }
      break;
    }

    case 'boss_final': {
      const b = state.boss;
      if (!b || b.status !== 'final') break;
      b.finalDone[slot] = true;
      ev.push({ e: 'final_part', by: slot });
      if (connectedSlots(state).every((s) => b.finalDone[s])) {
        b.status = 'won';
        b.hp = 0;
        f.boss_won = true;
        ev.push({ e: 'boss_won' });
        startScene(state, 'boss_won');
      }
      break;
    }

    case 'boss_retry': {
      const b = state.boss;
      if (!b || b.status !== 'lost') break;
      state.boss = newBoss(b);
      if (a.diff && FINAL_SECONDS[a.diff]) state.boss.diff[slot] = a.diff;
      ev.push({ e: 'boss_retry' });
      break;
    }

    // ---- finale: radio call ----
    case 'call_answer': {
      const c = state.call;
      if (!c || state.stage !== 'finale' || state.boat || c.q >= CALL.length) break;
      const q = CALL[c.q];
      if (q.to !== slot && state.players[q.to].connected) break;
      const ok = checkCallAnswer(c.q, a.text);
      const shown = String(a.text || '').slice(0, 100);
      if (ok) {
        learn(state, slot, q.phrase, a.hinted ? 'u' : 'r');
        ev.push({ e: 'call_ok', q: c.q, by: slot, text: shown, understood: q.understood });
        c.q += 1;
        c.tries = 0;
        if (c.q >= CALL.length) startScene(state, 'boat_intro');
      } else {
        c.tries += 1;
        ev.push({ e: 'call_retry', q: c.q, by: slot, text: shown, tries: c.tries });
      }
      break;
    }

    // ---- finale: guiding the boat ----
    case 'boat_cmd': {
      const b = state.boat;
      if (!b || b.done) break;
      if (slot !== b.commander && state.players[b.commander].connected) break;
      const n = normalize(a.text);
      const c = parseBoatCommand(n);
      const shown = String(a.text || '').slice(0, 60);
      if (!c) {
        b.last = { by: slot, text: shown, reply: "Sorry? Say that again, please.", ok: false, at: now };
        ev.push({ e: 'boat_reply', ...b.last });
        break;
      }
      if (c.cmd === 'left') b.target = Math.max(0, Math.round(b.target) - 1);
      if (c.cmd === 'right') b.target = Math.min(BAY.lanes - 1, Math.round(b.target) + 1);
      if (c.cmd === 'stop') b.moving = false;
      if (c.cmd === 'go') b.moving = true;
      if (c.cmd === 'back') { b.y = Math.max(b.checkpoint, b.y - 0.9); b.moving = false; }
      const pid = matchPhrase(n);
      learn(state, slot, pid, a.spoken ? 'u' : 'r');
      b.last = { by: slot, text: shown, reply: c.reply, ok: true, at: now };
      ev.push({ e: 'boat_reply', ...b.last });
      break;
    }

    case 'beam': {
      const b = state.boat;
      if (!b) break;
      if (slot !== b.beamer && state.players[b.beamer].connected) break;
      b.beam = Math.max(-70, Math.min(70, Number(a.angle) || 0));
      break;
    }

    default:
      break;
  }
  return ev;
}

function finalSeconds(state) {
  const d = (state.boss && state.boss.diff) || {};
  return Math.max(...SLOTS.map((s) => FINAL_SECONDS[d[s] || 'normal']));
}

// Time-driven rules (boss final timer, boat movement). dt in seconds.
// Returns events; `changed` tells the server whether to broadcast.
export function tick(state, dt, now = Date.now()) {
  const ev = [];
  let changed = false;
  const b = state.boss;
  if (state.stage === 'boss' && b && b.status === 'final' && now > b.finalEndsAt) {
    b.lamp -= 2;
    changed = true;
    if (b.lamp <= 0) { b.status = 'lost'; ev.push({ e: 'boss_lost' }); }
    else {
      b.finalDone = {};
      b.finalEndsAt = now + finalSeconds(state) * 1000;
      ev.push({ e: 'final_fail', ms: finalSeconds(state) * 1000 });
    }
  }
  const boat = state.boat;
  if (state.stage === 'finale' && boat && !boat.done) {
    boat.t += dt;
    changed = true;
    // slide toward the target lane
    const dl = boat.target - boat.lane;
    const step = 2.2 * dt;
    boat.lane = Math.abs(dl) <= step ? boat.target : boat.lane + Math.sign(dl) * step;
    if (boat.moving) boat.y += BOAT_SPEED * dt;
    const row = Math.floor(boat.y);
    const cells = BAY.rows[row];
    if (cells) {
      const laneIdx = Math.round(boat.lane);
      let hit = cells[laneIdx] === 'R';
      if (cells[laneIdx] === 'M') {
        // the mast only hits the boat in the middle of its row
        const m = mastLane(boat.t);
        const frac = boat.y - row;
        hit = m !== null && frac > 0.2 && frac < 0.8 && boat.lane + 0.35 > m && boat.lane - 0.35 < m + 2;
      }
      if (hit) {
        boat.bumps += 1;
        boat.moving = false;
        boat.y = Math.max(boat.checkpoint, row - 1.2);
        ev.push({ e: 'bump' });
      }
    }
    if (!boat.swapped && boat.y >= BAY.swapAtRow + 1) {
      boat.swapped = true;
      boat.moving = false;
      boat.checkpoint = BAY.swapAtRow + 1;
      const c = boat.commander;
      boat.commander = boat.beamer;
      boat.beamer = c;
      ev.push({ e: 'swap' });
    }
    if (boat.y >= BAY.rows.length + 0.5) {
      boat.done = true;
      boat.moving = false;
      ev.push({ e: 'boat_done' });
      startScene(state, 'ending');
    }
  }
  return { ev, changed };
}

// When a room is rebuilt from a saved game (server restarted, etc.),
// keep progress but put any timed challenge back at a safe checkpoint.
export function restoreState(save, room) {
  const s = createState(room);
  if (!save || typeof save !== 'object') return s;
  const keep = ['stage', 'flags', 'gen', 'learn', 'pos', 'log', 'call'];
  for (const k of keep) if (save[k] !== undefined) s[k] = save[k];
  for (const slot of SLOTS) {
    if (save.players && save.players[slot]) {
      s.players[slot].name = String(save.players[slot].name || '').slice(0, 16);
      if (LOOKS.includes(save.players[slot].look)) s.players[slot].look = save.players[slot].look;
    }
  }
  s.genProgress = 0;
  s.flags = s.flags || {};
  if (s.stage === 'boss') {
    s.boss = newBoss(save.boss || null);
    if (s.flags.boss_won) { s.stage = 'finale'; s.call = s.call || { q: 0, tries: 0 }; }
  }
  if (s.stage === 'finale') {
    s.call = s.call || { q: 0, tries: 0 };
    if (save.boat) { s.boat = newBoat(); }
    else if (s.call.q >= CALL.length) startScene(s, 'boat_intro');
  }
  // Re-open a story scene that was interrupted.
  if (save.scene && SCENES[save.scene.id]) {
    s.scene = { id: save.scene.id, idx: Math.min(save.scene.idx || 0, SCENES[save.scene.id].length - 1), ready: {} };
  }
  if (Array.isArray(save.sceneQueue)) s.sceneQueue = save.sceneQueue.filter((id) => SCENES[id]);
  return s;
}

// Progress summary for the "Continue" button.
export function progressOf(state) {
  const f = state.flags || {};
  const steps = ['intro_done', 'pip_met', 'radio_done', 'log_done', 'journal', 'lens', 'power', 'door_open', 'boss_won', 'complete'];
  const done = steps.filter((k) => f[k]).length;
  return Math.round((done / steps.length) * 100);
}
