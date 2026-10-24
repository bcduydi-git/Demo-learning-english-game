// Chapter 2 end to end with two browsers: start from the waiting room, walk
// the station map, open each puzzle, check each side only sees its half,
// make a mistake, then solve it through the real buttons.
//
//   node tests/e2e/chapter2.mjs     (server must be running)
//   URL=http://localhost:8090/ OUT=/tmp/shots node tests/e2e/chapter2.mjs

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { viewOf } from '../../shared/ch2/antenna.js';
import { wireAnswer, valveAnswer, keypadOrder } from '../../shared/transmitter.js';
import { recallOf } from '../../shared/ch2/finale.js';

const URL = process.env.URL || 'http://localhost:8080/';
const OUT = process.env.OUT || '/tmp/claude-0/ch2-shots';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: fs.existsSync(EXE) ? EXE : undefined });
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
async function mk(name) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { if (!errors.length) console.log(e.stack); errors.push(`${name}: ${e.message}`); });
  p.label = name;
  return p;
}
const shot = (p, name) => p.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}-${p.label}.png` });
const c2 = (p) => p.evaluate(() => window.__beacon.G.state.c2);
const check = (ok, msg) => { console.log(ok ? '✔' : '✘', msg); if (!ok) throw new Error(msg); };
async function waitFor(p, fn, arg, timeout = 12000) {
  const t0 = Date.now();
  for (;;) {
    if (await p.evaluate(fn, arg).catch(() => false)) return;
    if (Date.now() - t0 > timeout) throw new Error('timeout: ' + fn.toString().slice(0, 120));
    await sleep(100);
  }
}
// both press "next" until the story scene is over
async function skipScenes(a, b, shootFirst) {
  for (let i = 0; i < 60; i++) {
    const sc = await a.evaluate(() => window.__beacon.G.state.scene);
    if (!sc) return;
    if (shootFirst && i === 0) { await sleep(400); await shot(a, shootFirst); }
    for (const p of [a, b]) await p.evaluate(() => { const x = document.querySelector('#dialogue .next'); if (x && !x.disabled) x.click(); });
    await sleep(160);
  }
}
const slotOf = (p) => p.evaluate(() => window.__beacon.G.slot);

async function openPuzzle(a, b, room) {
  // A walks there through the map and opens it
  const st = await c2(a);
  if (st.rooms[await slotOf(a)] !== room) {
    await a.click(`.c2-room:has-text("${await a.evaluate((r) => window.__beacon.ROOMS[r].vi, room)}")`);
    await waitFor(a, (r) => window.__beacon.G.state.c2.rooms[window.__beacon.G.slot] === r, room);
  }
  await a.click('.c2-roombox .btn.gold');
  await skipScenes(a, b);
  await waitFor(b, () => document.querySelector('.c2-setup'));
  await a.click('.c2-setup .seg button:has-text("Vừa")');
  await a.click('text=Sẵn sàng ▶');
  await b.click('text=Sẵn sàng ▶');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.status === 'run');
  await sleep(500);
}
async function pageFor(a, b, role) {
  const pz = (await c2(a)).pz;
  return pz.roles[role] === (await slotOf(a)) ? a : b;
}
async function strikeCount(a) { return (await c2(a)).pz.strikes; }

const a = await mk('A');
const b = await mk('B');
try {
  await a.goto(URL);
  await a.click('text=Tạo phòng mới');
  await a.click('text=Tạo phòng ▶');
  await a.waitForSelector('.code');
  const code = (await a.textContent('.code')).trim();
  await b.goto(URL);
  await b.click('text=Vào phòng của bạn kia');
  await b.fill('input.en-input', code);
  await b.click('text=Vào phòng ▶');
  await waitFor(a, () => window.__beacon.G.state.players.p2.connected);
  await a.click('text=Chương 2 ▶');
  await waitFor(b, () => window.__beacon.G.state.stage === 'ch2');
  await skipScenes(a, b, 'intro');
  // expose room names for the helpers
  for (const p of [a, b]) await p.evaluate(() => { window.__beacon.ROOMS = { bridge: 'Buồng lái tàu Aurora', dock: 'Cầu cập tàu', hub: 'Sảnh trung tâm', west: 'Cánh Tây', east: 'Cánh Đông', office: 'Văn phòng', lockers: 'Phòng tủ đồ', dome: 'Mái vòm ăng-ten', transmitter: 'Phòng máy phát' }; window.__beacon.ROOMS = Object.fromEntries(Object.entries(window.__beacon.ROOMS).map(([k, v]) => [k, { vi: v }])); });
  await shot(a, 'bridge');

  // ---------------------------------------------------------------- 1. coords
  await openPuzzle(a, b, 'bridge');
  const nav = await pageFor(a, b, 'nav');
  const radio = nav === a ? b : a;
  check(await nav.isVisible('text=Hải đồ (chỉ bạn có)') && !(await radio.isVisible('text=Hải đồ (chỉ bạn có)')), 'coords: only the navigator has the chart');
  const heard = async (p) => p.evaluate(() => [...document.querySelectorAll('.c2-broadcast .part')].map((x) => x.classList.contains('clear')));
  const hn = await heard(nav);
  const hr = await heard(radio);
  check(hn.some((v, i) => v !== hr[i]), 'coords: static covers different parts for each player');
  await shot(nav, 'coords-nav');
  await shot(radio, 'coords-radio');
  const pos = (await c2(a)).pz.data.pos;
  const fill = async (v) => {
    for (const [k, val] of Object.entries(v)) await nav.fill(`input[data-k="${k}"]`, String(val));
    await nav.click('text=Đặt hướng đi ▶');
  };
  await fill({ ...pos, latMin: pos.latMin === 13 ? 30 : 13 });
  await waitFor(a, () => window.__beacon.G.state.c2.pz.strikes === 1);
  check(true, 'coords: a wrong position is a strike');
  await fill(pos);
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c2_arrive');
  check(true, 'coords solved: the Aurora reaches the station');
  await skipScenes(a, b, 'arrive');

  // ---------------------------------------------------------------- 2. flood
  check((await c2(a)).step === 'flood', 'step 2 opens');
  await openPuzzle(a, b, 'hub');
  const west = await pageFor(a, b, 'west');
  const east = west === a ? b : a;
  check((await c2(a)).rooms[await slotOf(west)] === 'west' && (await c2(a)).rooms[await slotOf(east)] === 'east', 'flood: players are split into the two wings');
  await shot(west, 'flood-west');
  await east.click('text=Mở cửa khoang ▶');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.strikes === 1);
  check(true, 'flood: opening a hatch at the wrong levels is a strike');
  const sol = (await c2(a)).pz.data.solution;
  for (const [side, p] of [['west', west], ['east', east]]) {
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < sol[side][i]; k++) {
        await p.locator('.c2-valve').nth(i).locator('button:has-text("+")').click();
        await sleep(120);
      }
    }
  }
  await shot(east, 'flood-east-ready');
  await west.click('.c2-card .btn.teal');
  await sleep(300);
  await east.click('.c2-card .btn.teal');
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c2_flood_done');
  check(true, 'flood solved: both hatches opened together');
  await skipScenes(a, b);

  // ---------------------------------------------------------------- 3. keycard
  await openPuzzle(a, b, 'office');
  const office = await pageFor(a, b, 'office');
  const lockers = office === a ? b : a;
  check(await office.isVisible('.c2-inbox') && !(await lockers.isVisible('.c2-inbox')), 'keycard: only the office has the emails');
  check(await lockers.isVisible('.c2-lockers') && !(await office.isVisible('.c2-lockers')), 'keycard: only the locker room sees the lockers');
  await office.click('.c2-inbox .mail >> nth=0');
  await shot(office, 'keycard-office');
  await shot(lockers, 'keycard-lockers');
  const ans = (await c2(a)).pz.data.answer;
  await lockers.click(`.locker >> nth=${ans === 0 ? 1 : 0}`);
  await lockers.click('text=Mở tủ số');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.strikes === 1);
  check(true, 'keycard: a wrong locker is a strike');
  await lockers.click(`.locker >> nth=${ans}`);
  await lockers.click('text=Mở tủ số');
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c2_keycard_done');
  check(true, 'keycard solved');
  await skipScenes(a, b, 'keycard-done');

  // ---------------------------------------------------------------- 4. antenna
  await openPuzzle(a, b, 'dome');
  for (let round = 0; round < 2; round++) {
    const d = (await c2(a)).pz.data;
    const rd = d.rounds[d.cur];
    const ctrl = await pageFor(a, b, rd.controller);
    const desc = ctrl === a ? b : a;
    check(await desc.isVisible('text=Bản đồ sao (chỉ bạn có)') && !(await ctrl.isVisible('text=Bản đồ sao (chỉ bạn có)')), `antenna dish ${round + 1}: only the describer has the star chart`);
    // the describer sees the panel mirrored compared with the controller
    const litOf = (p) => p.evaluate(() => { const g = [...document.querySelectorAll('.c2-grid')].pop(); return [...g.children].map((c) => c.classList.contains('on')); });
    const lc = await litOf(ctrl);
    const ld = await litOf(desc);
    const N = rd.n;
    const mirrored = lc.every((v, i) => v === ld[Math.floor(i / N) * N + (N - 1 - (i % N))]);
    check(mirrored, `antenna dish ${round + 1}: the two sides see the panel mirrored`);
    if (round === 0) { await shot(desc, 'antenna-describer'); await shot(ctrl, 'antenna-controller'); }
    const side = rd.controller;
    const view = (cells) => viewOf(cells, N, side);
    const want = view(rd.target);
    const have = view(rd.lit);
    for (const k of [...have.filter((x) => !want.includes(x)), ...want.filter((x) => !have.includes(x))]) {
      const [r, c] = k.split(',').map(Number);
      await ctrl.click(`.c2-grid .cell.click >> nth=${r * N + c}`);
      await sleep(120);
    }
    await ctrl.click('text=Align ▶');
    if (round === 0) await waitFor(a, () => window.__beacon.G.state.c2.pz.data.cur === 1);
  }
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c2_antenna_done');
  check(true, 'antenna solved: both dishes aligned');
  await skipScenes(a, b, 'antenna-done');

  // ---------------------------------------------------------------- 5. transmitter room
  check((await c2(a)).step === 'machine', 'step 5 opens: the transmitter room');
  await openPuzzle(a, b, 'transmitter');
  const tech = await pageFor(a, b, 'tech');
  const reader = tech === a ? b : a;
  check(await tech.isVisible('.tx-plate') && !(await reader.isVisible('.tx-plate')), 'machine: only the technician sees the machine');
  check(await reader.isVisible('.tx-manual') && !(await tech.isVisible('.tx-manual')), 'machine: only the reader has the manual');
  check(await a.isVisible('.c2-runhead .tx-clock'), 'machine: the clock is running');
  await shot(tech, 'machine-tech');
  await shot(reader, 'machine-reader');
  let md = (await c2(a)).pz.data;
  const leftBefore = md.left;
  const rightWire = wireAnswer(md.wires.colours, md.plate).index;
  await tech.click(`.tx-wire >> nth=${rightWire === 0 ? 1 : 0}`);
  await tech.click('text=✂ Cắt dây');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.strikes === 1);
  md = (await c2(a)).pz.data;
  check(leftBefore - md.left >= 15000, 'machine: a wrong wire costs a strike and 15 seconds');
  await tech.click(`.tx-wire >> nth=${rightWire}`);
  await tech.click('text=✂ Cắt dây');
  const mv = valveAnswer(md.valves.pressure, md.plate, (await c2(a)).pz.level);
  if (mv.valve) for (let i = 0; i < mv.turns; i++) await tech.locator('.tx-dial').filter({ hasText: mv.valve }).locator('button:has-text("+")').click();
  await tech.click('button:has-text("CONFIRM")');
  for (const word of keypadOrder(md.keypad.words)) { await tech.click(`.tx-key:has-text("${word}")`); await sleep(120); }
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c2_machine_done');
  check(true, 'machine solved');
  await skipScenes(a, b);

  // ---------------------------------------------------------------- 6. finale
  check((await c2(a)).step === 'finale', 'step 6 opens: the last signal');
  await openPuzzle(a, b, 'transmitter');
  const pa = await pageFor(a, b, 'a');
  const pb = pa === a ? b : a;
  let fd = (await c2(a)).pz.data;
  check(await pb.isVisible('text=Mở ở lượt 2.') && await pb.isVisible('.tx-page'), 'finale phase 1: B reads the wire rules, B\'s valves are still locked');
  await shot(pa, 'finale-a');
  await shot(pb, 'finale-b');
  await pa.click(`.tx-wire >> nth=${wireAnswer(fd.main.wires.colours, fd.main.plate).index}`);
  await pa.click('text=✂ Cắt dây');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.data.phase === 2);
  check(true, 'finale phase 2: roles swap');
  const fv = valveAnswer(fd.backup.valves.pressure, fd.backup.plate, (await c2(a)).pz.level);
  if (fv.valve) for (let i = 0; i < fv.turns; i++) await pb.locator('.tx-dial').filter({ hasText: fv.valve }).locator('button:has-text("+")').click();
  await pb.click('button:has-text("CONFIRM")');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.data.phase === 3);
  check(await pb.isVisible('text=Gợi ý khoá giọng nói') && !(await pa.isVisible('text=Gợi ý khoá giọng nói')), 'finale phase 3: only B has the clue for A\'s voice lock');
  await shot(pb, 'finale-b-phase3');
  await pa.fill('input[data-k="recall"]', recallOf(fd).answers[0]);
  await pa.click('text=Mở khoá ▶');
  for (const word of keypadOrder(fd.backup.keypad.words)) { await pb.click(`.tx-key:has-text("${word}")`); await sleep(120); }
  await waitFor(a, () => window.__beacon.G.state.c2.pz.data.phase === 4);
  await shot(pa, 'finale-send');
  await pa.click('.c2-sendbtn');
  await sleep(300);
  await pb.click('.c2-sendbtn');
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c2_ending');
  check(true, 'finale solved: the signal is sent');
  await skipScenes(a, b, 'ending');
  await waitFor(a, () => document.querySelector('.c2-overlay .logo'));
  await shot(a, 'end');
  check((await c2(a)).step === 'end', 'end of chapter 2');

  // reload: comes back to the same place
  await b.reload();
  await waitFor(b, () => window.__beacon && window.__beacon.G.state && window.__beacon.G.state.stage === 'ch2' && document.querySelector('.c2-overlay .logo'), null, 15000);
  check(true, 'reloading keeps chapter 2 progress');
  check(errors.length === 0, 'no page errors ' + errors.join(' | '));
  console.log('ALL OK');
} catch (e) {
  console.error(e);
  await shot(a, 'error').catch(() => {});
  await shot(b, 'error').catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
