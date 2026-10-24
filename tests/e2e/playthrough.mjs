// Full co-op playthrough with two independent browser contexts talking to a
// real server over WebSocket. Uses small debug shortcuts (teleporting the
// local player) to save walking time, but every puzzle step goes through the
// real UI / keyboard / network path.
//
//   node tests/e2e/playthrough.mjs           (server must be running)
//   URL=http://localhost:8090/ OUT=/tmp/shots node tests/e2e/playthrough.mjs

import { chromium } from 'playwright-core';
import fs from 'node:fs';

const URL = process.env.URL || 'http://localhost:8080/';
const OUT = process.env.OUT || '/tmp/claude-0/shots';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: fs.existsSync(EXE) ? EXE : undefined });
let shotN = 0;
const errors = [];
async function mk(name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { errors.push(`${name}: ${e.message}`); console.log(`[${name} pageerror]`, e.message); });
  p.on('console', (m) => { if (m.type() === 'error') console.log(`[${name} console]`, m.text()); });
  p.ctxRef = ctx;
  p.label = name;
  return p;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (p, name) => { await p.screenshot({ path: `${OUT}/${String(++shotN).padStart(2, '0')}-${name}-${p.label}.png` }); };
const st = (p) => p.evaluate(() => window.__beacon.G.state);
const log = (...a) => console.log('•', ...a);

async function waitFor(p, fn, arg, timeout = 15000) {
  const t0 = Date.now();
  for (;;) {
    const ok = await p.evaluate(fn, arg).catch(() => false);
    if (ok) return ok;
    if (Date.now() - t0 > timeout) throw new Error(`timeout waiting: ${fn.toString().slice(0, 120)}`);
    await sleep(120);
  }
}

async function tp(p, tx, ty) {
  await waitFor(p, () => !window.__beacon.G.game.scene.getScene('World').warping);
  await p.evaluate(([x, y]) => {
    const sc = window.__beacon.G.game.scene.getScene('World');
    sc.me.setPosition(x * 16 + 8, y * 16 + 12);
    sc.updateArea(true);
    sc.sendPos(true);
  }, [tx, ty]);
  await sleep(250);
}

async function press(p, key) {
  await p.keyboard.press(key);
  await sleep(120);
}

// advance the current shared scene on both machines until it ends
async function playScene(a, b, id, shootAt = []) {
  await waitFor(a, (sid) => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === sid, id);
  let guard = 0;
  for (;;) {
    const s = await st(a);
    if (!s.scene || s.scene.id !== id) break;
    if (shootAt.includes(s.scene.idx)) { await sleep(700); await shot(a, `${id}${s.scene.idx}`); await shot(b, `${id}${s.scene.idx}`); shootAt = shootAt.filter((x) => x !== s.scene.idx); }
    for (const p of [a, b]) {
      await p.evaluate(() => { const n = document.querySelector('#dialogue .next'); if (n && !n.disabled) n.click(); });
      await sleep(60);
      await p.evaluate(() => { const n = document.querySelector('#dialogue .next'); if (n && !n.disabled) n.click(); });
    }
    await sleep(200);
    if (++guard > 80) throw new Error('scene stuck ' + id);
  }
  log(`scene ${id} done`);
}

async function closeModal(p) {
  await p.keyboard.press('Escape');
  await sleep(150);
}

const a = await mk('A');
const b = await mk('B');
try {
  // ---------------------------------------------------------- lobby
  await a.goto(URL);
  await a.click('text=Tạo phòng mới');
  await a.click('.who-card:has-text("Tím")');
  await a.click('text=Tạo phòng ▶');
  await a.waitForSelector('.code');
  const code = (await a.textContent('.code')).trim();
  log('room', code);
  await b.goto(URL);
  await b.click('text=Vào phòng của bạn kia');
  await b.fill('input.en-input', code);
  await b.click('.who-card:has-text("Tím")'); // already taken: B must become Lắc
  await b.click('text=Vào phòng ▶');
  await waitFor(a, () => window.__beacon.G.state.players.p2.connected);
  const looks = await a.evaluate(() => [window.__beacon.G.state.players.p1.look, window.__beacon.G.state.players.p2.look]);
  if (looks.join() !== 'tim,lac') throw new Error('character choice not applied: ' + looks);
  log('characters: p1 =', looks[0], ', p2 =', looks[1]);
  await a.click('text=Bắt đầu ▶');
  await playScene(a, b, 'intro', [1, 2]);

  // ---------------------------------------------------------- beach
  await tp(b, 40, 47);
  await press(b, 'e');
  await sleep(300);
  await shot(b, 'crate-p2');
  await closeModal(b);
  await tp(a, 40, 47);
  await press(a, 'e');
  await waitFor(a, () => window.__beacon.G.state.flags.has_tools);
  await tp(b, 16, 49);
  await press(b, 'e');
  await waitFor(a, () => window.__beacon.G.state.flags.has_radio);
  log('items picked up');
  await playScene(a, b, 'pip_meet', [0]);

  // ---------------------------------------------------------- radio
  await press(a, 'r');
  await sleep(300);
  await shot(a, 'radio');
  await a.click('.tab:has-text("Gọi qua radio")');
  await a.click('button.chip:has-text("Yes, I can hear you.")');
  await closeModal(a);
  await press(b, 'r');
  await b.click('#radio input.en-input');
  await b.keyboard.type("Let's go, wait and see!", { delay: 20 });
  if ((await b.inputValue('#radio input.en-input')) !== "Let's go, wait and see!") throw new Error('typing into the radio box was blocked');
  await b.fill('#radio input.en-input', "Let's go!");
  await b.keyboard.press('Enter');
  await sleep(300);
  await closeModal(b);
  await sleep(600);
  await shot(b, 'feed');
  await playScene(a, b, 'radio_done');
  const learnA = (await st(a)).learn.p1;
  log('p1 learn i_can_hear_you', JSON.stringify(learnA.i_can_hear_you));

  // ---------------------------------------------------------- log (lift together)
  await tp(a, 30, 41);
  await tp(b, 32, 41);
  await shot(a, 'log');
  await Promise.all([a.keyboard.press('e'), b.keyboard.press('e')]);
  await playScene(a, b, 'log_done');
  if (!(await st(a)).flags.log_done) throw new Error('log not moved');

  // ---------------------------------------------------------- cottage + journal
  await tp(a, 26, 32);
  await tp(b, 26, 33);
  await shot(a, 'cottage');
  await tp(a, 26, 31);
  await press(a, 'e');
  await sleep(700);
  await tp(a, 67, 5);
  await shot(a, 'interior');
  await press(a, 'e');
  await playScene(a, b, 'journal', [2]);

  // ---------------------------------------------------------- generator
  await tp(b, 26, 31);
  await press(b, 'e');
  await sleep(700);
  await tp(b, 73, 5);
  await press(b, 'e');
  await sleep(800);
  await shot(b, 'station');
  await closeModal(b);
  await tp(a, 69, 9);
  await sleep(300);
  await tp(a, 45, 34);
  await press(a, 'e');
  await sleep(300);
  // one wrong input first
  await a.click('.gbtn:has-text("RED")');
  await sleep(300);
  if ((await st(a)).genFails !== 1) throw new Error('gen fail not counted');
  const gen = (await st(a)).gen;
  log('generator', JSON.stringify(gen));
  await a.click(`button:has-text("${gen.wheel === 'left' ? '⟲ LEFT' : 'RIGHT ⟳'}")`);
  for (let i = 0; i < gen.times; i++) { await a.click(`.gbtn:has-text("${gen.color.toUpperCase()}")`); await sleep(150); }
  await shot(a, 'generator');
  await a.click(`button:has-text("${gen.lever === 'up' ? '▲ UP' : 'DOWN ▼'}")`);
  await playScene(a, b, 'power_on');

  // ---------------------------------------------------------- fog woods
  await tp(a, 22, 24);
  await press(a, 'e');
  await sleep(900);
  const map = await a.evaluate(() => window.__beacon.G.game.cache.json.get('map'));
  const [msx, msy] = map.areas.maze_start;
  await tp(b, msx, msy);
  await tp(b, msx - 1, msy);
  await playScene(a, b, 'fog_intro');
  await sleep(300);
  await shot(a, 'lookout');
  await shot(b, 'fog');
  // step on a trap
  const trap = map.traps[0];
  await tp(b, trap[0], trap[1]);
  await waitFor(b, ([x, y]) => { const sc = window.__beacon.G.game.scene.getScene('World'); return !sc.warping && Math.abs(sc.me.x - (x * 16 + 8)) < 2 && Math.abs(sc.me.y - (y * 16 + 14)) < 2; }, [msx, msy]);
  log('trap sent walker back to the maze start; fps', await b.evaluate(() => Math.round(window.__beacon.G.game.loop.actualFps)));
  await sleep(800);
  await shot(a, 'trap-seen-by-lookout');
  // reach the chest (find a free tile next to it)
  const chest = map.objects.find((o) => o.id === 'lens');
  const free = [[0, 1], [1, 1], [1, 0]].map(([dx, dy]) => [chest.x + dx, chest.y + dy]).find(([x, y]) => map.grid[y][x] === '"');
  await tp(b, free[0], free[1]);
  await press(b, 'e');
  await playScene(a, b, 'lens_found');
  await sleep(400);
  await shot(b, 'page2');
  await closeModal(b);
  await press(a, 'e'); // leave the lookout

  // ---------------------------------------------------------- lighthouse door
  await tp(a, 32, 10);
  await tp(b, 32, 11);
  await press(a, 'e');
  await sleep(400);
  await shot(a, 'door-p1');
  await a.fill('#door input.en-input', 'hold on help me');
  await a.keyboard.press('Enter');
  await sleep(400);
  await shot(a, 'door-wrong');
  await press(b, 'e');
  await sleep(400);
  await shot(b, 'door-p2');
  await b.fill('#door input.en-input', 'Hold on, help is coming.');
  await b.keyboard.press('Enter');
  await playScene(a, b, 'door_open');

  // ---------------------------------------------------------- enter together
  // both screens must have closed the dialogue, or the key only advances it
  for (const p of [a, b]) await waitFor(p, () => !window.__beacon.G.state.scene && !document.querySelector('#dialogue:not(.hidden) .next'));
  await press(a, 'e');
  await sleep(300);
  await press(b, 'e');
  await playScene(a, b, 'boss_intro', [1]);
  await waitFor(a, () => window.__beacon.G.state.boss && window.__beacon.G.state.boss.status === 'rules');
  await sleep(400);
  await shot(a, 'boss-rules');

  // ---------------------------------------------------------- boss: lose once, then win
  for (const p of [a, b]) await p.click('text=Sẵn sàng ▶');
  await waitFor(a, () => window.__beacon.G.state.boss.status === 'fight');
  await sleep(4000);
  await shot(a, 'boss-fight');
  for (let i = 0; i < 5; i++) await a.evaluate(() => window.__beacon.G.net.act({ type: 'boss_leak' }));
  await waitFor(a, () => window.__beacon.G.state.boss.status === 'lost');
  await sleep(500);
  await shot(b, 'boss-lost');
  await a.click('text=Thử lại ↻');
  await waitFor(b, () => window.__beacon.G.state.boss.status === 'rules');
  for (const p of [a, b]) await p.click('text=Sẵn sàng ▶');
  await waitFor(a, () => window.__beacon.G.state.boss.status === 'fight');
  log('boss retry ok, fighting');

  // both players type whatever is in their lane
  const typer = async (p) => {
    for (let n = 0; n < 400; n++) {
      const info = await p.evaluate(() => {
        const s = window.__beacon.G.state;
        const sc = window.__beacon.G.game.scene.getScene('Boss');
        if (!s.boss || s.stage !== 'boss') return { done: true };
        if (s.boss.status === 'final') return { final: true, done: !!s.boss.finalDone[window.__beacon.G.slot], scene: !!s.scene };
        if (s.boss.status !== 'fight') return { done: s.boss.status === 'won', wait: true };
        const c = sc.clouds.slice().sort((x, y) => y.p - x.p)[0];
        return { target: c ? c.target : null, buf: sc.buf };
      });
      if (info.done && !info.wait) return;
      if (info.final && !info.done && !info.scene) {
        const slot = await p.evaluate(() => window.__beacon.G.slot);
        await p.keyboard.type(slot === 'p1' ? 'hold on' : 'help is coming', { delay: 40 });
        await sleep(300);
        continue;
      }
      if (info.target && !info.buf) {
        // make one deliberate mistake once to exercise the feedback path
        if (n === 3) await p.keyboard.type('q');
        await p.keyboard.type(info.target.replace(/'/g, ''), { delay: 35 });
      }
      await sleep(250);
    }
  };
  await Promise.all([typer(a), typer(b)]);
  await shot(a, 'boss-end');
  await playScene(a, b, 'boss_won', [1]);
  log('boss won; recalled:', Object.entries((await st(a)).learn.p1).filter(([, v]) => v.r).map(([k]) => k).join(','));

  // ---------------------------------------------------------- finale: call
  await waitFor(a, () => window.__beacon.G.state.stage === 'finale');
  await sleep(1200);
  await shot(a, 'call-q1');
  await a.fill('#call input.en-input', 'maybe');
  await a.keyboard.press('Enter');
  await sleep(500);
  await a.fill('#call input.en-input', 'Yes, I can hear you!');
  await a.keyboard.press('Enter');
  await waitFor(b, () => window.__beacon.G.state.call.q === 1);
  await sleep(600);
  await b.fill('#call input.en-input', "We're fine, thanks");
  await b.keyboard.press('Enter');
  await waitFor(a, () => window.__beacon.G.state.call.q === 2);
  await sleep(600);
  await a.fill('#call input.en-input', 'two people');
  await a.keyboard.press('Enter');
  await waitFor(b, () => window.__beacon.G.state.call.q === 3);
  await sleep(600);
  await b.fill('#call input.en-input', "We're at the lighthouse");
  await b.keyboard.press('Enter');
  await playScene(a, b, 'boat_intro');

  // ---------------------------------------------------------- finale: boat
  await waitFor(a, () => !!window.__beacon.G.state.boat);
  await sleep(800);
  await shot(a, 'boat-beam');
  await shot(b, 'boat-cmd');
  const rows = await a.evaluate(() => null) || ['~~~~~', '~~~~~', 'RR~~~', '~R~~~', '~~~RR', '~~~R~', 'R~~~~', '~~R~~', '~RR~~', '~~~~R', 'MMMMM', '~~~~~', 'R~~RR', '~~~R~', 'RR~~~', '~R~~R', '~~~~R', '~RRR~', '~~~~~', 'R~~~R', '~~~~~'];
  const sendCmd = async (text) => {
    const s = await st(a);
    const cmdr = s.boat.commander === 'p1' ? a : b;
    await cmdr.fill('#call input.en-input', text);
    await cmdr.keyboard.press('Enter');
    await sleep(120);
  };
  const mastLane = (t) => { const p = t % 10; return p >= 4 ? null : -2 + p * (7 / 4); };
  const safeLane = (row, lane) => {
    const next = rows[row + 1];
    if (!next || next[lane] !== 'R') return lane;
    for (const d of [1, -1, 2, -2, 3, -3]) {
      const l = lane + d;
      if (l < 0 || l > 4 || next[l] === 'R') continue;
      let ok = true;
      for (let k = Math.min(l, lane); k <= Math.max(l, lane); k++) if (rows[row][k] === 'R') ok = false;
      if (ok) return l;
    }
    return lane;
  };
  let swappedShot = false;
  // the beamer sweeps the light toward the next rock, like a player would
  for (let i = 0; i < 900; i++) {
    const s = await st(a);
    if (!s.boat || s.boat.done) break;
    const bt = s.boat;
    if (bt.swapped && !swappedShot) { swappedShot = true; await sleep(500); await shot(a, 'boat-swapped'); await shot(b, 'boat-swapped'); }
    const row = Math.floor(bt.y);
    const lane = Math.round(bt.lane);
    const want = safeLane(row, bt.target);
    const nextRow = rows[row + 1] || '';
    if (want !== bt.target) {
      if (bt.moving) await sendCmd('Stop!');
      await sendCmd(want < bt.target ? 'go left' : 'go right');
    } else if (nextRow.includes('M') && bt.y - row > 0.4) {
      const m = mastLane(bt.t);
      if (bt.moving && m !== null) await sendCmd('stop');
      else if (!bt.moving && m === null && (bt.t % 10) < 6.5) await sendCmd('keep going');
    } else if (!bt.moving && bt.target === lane) {
      await sendCmd('keep going');
    }
    await sleep(100);
  }
  const fin = await st(a);
  log('boat done:', !!(fin.boat && fin.boat.done), 'bumps', fin.boat && fin.boat.bumps);
  await playScene(a, b, 'ending', [3, 7]);
  await waitFor(a, () => window.__beacon.G.state.stage === 'credits');
  await sleep(1500);
  await shot(a, 'credits');
  await shot(b, 'credits');
  log('COMPLETE');
} catch (e) {
  console.log('FAILED:', e.message);
  for (const p of [a, b]) {
    const info = await p.evaluate(() => { const G = window.__beacon.G; const sc = G.game.scene.getScene('World'); return { flags: G.state.flags, scene: G.state.scene, busy: G.busy, typing: G.typing, me: sc && sc.me ? [sc.me.x, sc.me.y] : null, nearest: sc && sc.nearest ? sc.nearest.id : null,  warping: sc && sc.warping }; }).catch((e2) => e2.message);
    console.log(p.label, JSON.stringify(info));
  }

  await shot(a, 'fail');
  await shot(b, 'fail');
  process.exitCode = 1;
}
if (errors.length) { console.log('page errors:', errors.length); process.exitCode = 1; }
await browser.close();
