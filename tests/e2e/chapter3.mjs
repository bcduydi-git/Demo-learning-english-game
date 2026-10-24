// Chapter 3 end to end with two browsers: start from the waiting room,
// play the four puzzles through the real buttons, check each side only sees
// its half, and reach THE END.
//
//   node tests/e2e/chapter3.mjs     (server must be running)
//   URL=http://localhost:8090/ OUT=/tmp/shots node tests/e2e/chapter3.mjs

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { answer as gearAnswer } from '../../shared/ch3/gears.js';
import { signalFor, dutyOf } from '../../shared/ch3/beacon.js';

const URL = process.env.URL || 'http://localhost:8080/';
const OUT = process.env.OUT || '/tmp/claude-0/ch3-shots';
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
  await a.click('text=Chương 3 ▶');
  await waitFor(b, () => window.__beacon.G.state.stage === 'ch2' && window.__beacon.G.state.c2.chapter === 3);
  await skipScenes(a, b, 'intro');
  for (const p of [a, b]) await p.evaluate(() => { window.__beacon.ROOMS = Object.fromEntries(Object.entries({ deck: 'Boong tàu Aurora', landing: 'Bãi đá chân tháp', stairs: 'Cầu thang xoắn', keeperroom: 'Phòng người gác đèn', gearroom: 'Phòng bánh răng', lantern: 'Phòng đèn' }).map(([k, v]) => [k, { vi: v }])); });
  await shot(a, 'deck');

  // ---------------------------------------------------------------- 1. tide
  await openPuzzle(a, b, 'deck');
  const chart = await pageFor(a, b, 'chart');
  const tables = chart === a ? b : a;
  check(await tables.isVisible('text=Tide table') && !(await chart.isVisible('text=Tide table')), 'tide: only one side has the tide table');
  check(await chart.isVisible('text=Route card') && !(await tables.isVisible('text=Route card')), 'tide: only the other side has the route card');
  await shot(tables, 'tide-tables');
  await shot(chart, 'tide-chart');
  const td = (await c2(a)).pz.data;
  await chart.selectOption('.c2-card select', String(td.route.leave));
  await chart.click('text=Khởi hành ▶');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.strikes === 1);
  check(true, 'tide: leaving too early is a strike');
  await chart.selectOption('.c2-card select', String(td.answer));
  await chart.click('text=Khởi hành ▶');
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c3_tide_done');
  check(true, 'tide solved');
  await skipScenes(a, b, 'tide-done');

  // ---------------------------------------------------------------- 2. diary
  check((await c2(a)).step === 'diary', 'step 2 opens');
  await openPuzzle(a, b, 'stairs');
  const dd = (await c2(a)).pz.data;
  const leftP = await pageFor(a, b, 'left');
  const rightP = leftP === a ? b : a;
  for (let slot = 0; slot < dd.order.length; slot++) {
    const st = dd.strips.find((x) => x.id === dd.order[slot]);
    const p = st.owner === 'left' ? leftP : rightP;
    await p.click(`.c3-strip:has-text("${st.en.slice(0, 30).replace(/"/g, '\\"')}")`);
    await p.click(`.c3-slot >> nth=${slot}`);
    await sleep(150);
    if (slot === 3) {
      // the partner sees only the first word of a strip they do not own (normal level)
      const other = p === leftP ? rightP : leftP;
      const txt = await other.textContent(`.c3-slot >> nth=${slot}`);
      check(!txt.includes(st.en) && txt.includes(st.en.split(' ')[0]), 'diary: the other player cannot read your strip');
      await shot(other, 'diary');
    }
  }
  await a.click('text=Kiểm tra thứ tự ▶');
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c3_diary_done');
  check(true, 'diary solved');
  await skipScenes(a, b);

  // ---------------------------------------------------------------- 3. gears
  await openPuzzle(a, b, 'gearroom');
  const crank = await pageFor(a, b, 'crank');
  const diagram = crank === a ? b : a;
  check(await diagram.isVisible('text=Blueprint') && !(await crank.isVisible('text=Blueprint')), 'gears: only one side has the blueprint');
  check(await crank.isVisible('text=Maintenance tag') && !(await diagram.isVisible('text=Maintenance tag')), 'gears: only the crank side has the tag');
  await shot(diagram, 'gears-blueprint');
  const ga = gearAnswer((await c2(a)).pz.data);
  await crank.click(`.seg button:has-text("${ga.dir === 'cw' ? '↺' : '↻'}")`);
  await crank.click(`.seg button:text-is("${ga.turns} turn${ga.turns === 1 ? '' : 's'}")`);
  await crank.click('text=Quay ▶');
  await waitFor(a, () => window.__beacon.G.state.c2.pz.strikes === 1);
  check(true, 'gears: the wrong direction is a strike');
  await crank.click(`.seg button:has-text("${ga.dir === 'cw' ? '↻' : '↺'}")`);
  await crank.click('text=Quay ▶');
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c3_gears_done');
  check(true, 'gears solved');
  await skipScenes(a, b);

  // ---------------------------------------------------------------- 4. beacon
  await openPuzzle(a, b, 'lantern');
  check(await a.isVisible('.c2-runhead .tx-clock'), 'beacon: the clock is running');
  let first = true;
  for (;;) {
    const st = (await c2(a)).pz;
    const d = st.data;
    if (d.cur >= d.ships.length) break;
    const slotA = await slotOf(a);
    const roleA = Object.keys(st.roles).find((r) => st.roles[r] === slotA);
    const keeper = dutyOf(d, roleA) === 'keeper' ? a : b;
    const lookout = keeper === a ? b : a;
    check(await lookout.isVisible('text=Ống nhòm') && !(await keeper.isVisible('text=Ống nhòm')), `beacon ship ${d.cur + 1}: only the lookout sees the ship`);
    if (first) { await shot(lookout, 'beacon-lookout'); await shot(keeper, 'beacon-keeper'); first = false; }
    const sig = signalFor(d.ships[d.cur], st.level);
    await keeper.click(`.seg button:text-is("${sig.colour}")`);
    for (const f of sig.flashes) await keeper.click(f === 'L' ? 'text=▬ long' : 'text=• short');
    const n0 = d.cur;
    await keeper.click('text=Phát đèn ▶');
    await waitFor(a, (k) => window.__beacon.G.state.c2.pz.data.cur > k, n0);
  }
  check(true, 'beacon: every ship got the right light (roles swapped after ship two)');
  await a.click('.c2-sendbtn');
  await sleep(300);
  await b.click('.c2-sendbtn');
  await waitFor(a, () => window.__beacon.G.state.scene && window.__beacon.G.state.scene.id === 'c3_ending');
  check(true, 'beacon solved: the lighthouse is lit');
  await skipScenes(a, b, 'ending');
  await waitFor(a, () => document.querySelector('.c2-overlay .logo'));
  await shot(a, 'the-end');
  check((await c2(a)).step === 'end', 'THE END');
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
