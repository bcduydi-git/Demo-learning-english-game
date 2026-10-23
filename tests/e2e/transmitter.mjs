// Chapter 2 prototype end to end: two browsers open the transmitter from the
// waiting room, check that each side only sees its own half, make one
// mistake on purpose, then fix the three modules through the real UI.
//
//   node tests/e2e/transmitter.mjs     (server must be running)
//   URL=http://localhost:8090/ OUT=/tmp/shots node tests/e2e/transmitter.mjs

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { wireAnswer, valveAnswer, keypadOrder } from '../../shared/transmitter.js';

const URL = process.env.URL || 'http://localhost:8080/';
const OUT = process.env.OUT || '/tmp/claude-0/tx-shots';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: fs.existsSync(EXE) ? EXE : undefined });
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
async function mk(name) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { if (!errors.length) console.log(e.stack); errors.push(`${name}: ${e.message}`); });
  p.label = name;
  return p;
}
const shot = (p, name) => p.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}-${p.label}.png` });
const tx = (p) => p.evaluate(() => window.__beacon.G.state.tx);
const check = (ok, msg) => { console.log(ok ? '✔' : '✘', msg); if (!ok) throw new Error(msg); };
async function waitFor(p, fn, arg, timeout = 10000) {
  const t0 = Date.now();
  for (;;) {
    if (await p.evaluate(fn, arg).catch(() => false)) return;
    if (Date.now() - t0 > timeout) throw new Error('timeout: ' + fn.toString().slice(0, 100));
    await sleep(100);
  }
}

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

  // open the prototype from the waiting room
  await a.click('button:has-text("🧪 Máy phát")');
  await waitFor(b, () => window.__beacon.G.state.stage === 'tx' && document.querySelector('.tx-setup'));
  await shot(b, 'setup');
  // B swaps roles and picks a level; both see it
  await b.click('text=⇄ Đổi vai');
  await waitFor(a, () => window.__beacon.G.state.tx.tech === 'p2');
  await b.click('text=⇄ Đổi vai');
  await a.click('.tx-setup .seg button:has-text("Vừa")');
  await a.click('text=Sẵn sàng ▶');
  await b.click('text=Sẵn sàng ▶');
  await waitFor(a, () => window.__beacon.G.state.tx.status === 'run');
  check(true, 'round started after both were ready');
  await sleep(600);

  // A (p1) is at the machine, B (p2) holds the manual
  check(await a.isVisible('.tx-machine') && !(await a.isVisible('.tx-manual')), 'technician sees the machine, not the manual');
  check(await b.isVisible('.tx-manual') && !(await b.isVisible('.tx-machine')), 'reader sees the manual, not the machine');
  await shot(a, 'machine');
  await shot(b, 'manual-wires');
  await b.click('.tx-tabs button:has-text("Valves")');
  await shot(b, 'manual-valves');
  await b.click('.tx-tabs button:has-text("Keypad")');
  await shot(b, 'manual-keypad');

  const t = await tx(a);
  const m = t.machine;
  const right = wireAnswer(m.wires.colours, m.plate).index;
  const wrong = right === 0 ? 1 : 0;

  // the reader cannot cut a wire (no machine on screen, and the server refuses)
  await b.evaluate(() => window.__beacon.G.net.act({ type: 'tx_cut', index: 0 }));
  await sleep(300);
  check((await tx(a)).machine.wires.cut.length === 0, 'server ignores machine actions from the reader');

  // one mistake on purpose
  const left0 = (await tx(a)).left;
  await a.click(`.tx-wire:nth-child(${wrong + 1})`);
  await a.click('text=✂ Cắt dây');
  await waitFor(a, () => window.__beacon.G.state.tx.strikes === 1);
  const left1 = (await tx(a)).left;
  check(left0 - left1 >= 15000, `a wrong wire costs a strike and 15 s (${Math.round((left0 - left1) / 1000)} s)`);
  await shot(b, 'strike');

  // module 1: wires
  await a.click(`.tx-wire:nth-child(${right + 1})`);
  await a.click('text=✂ Cắt dây');
  await waitFor(a, () => window.__beacon.G.state.tx.machine.solved.wires);
  check(true, 'wires solved');

  // module 2: valves
  const v = valveAnswer(m.valves.pressure, m.plate, t.level);
  if (v.valve) {
    const dial = a.locator('.tx-dial').filter({ hasText: v.valve });
    for (let i = 0; i < v.turns; i++) await dial.locator('button:has-text("+")').click();
  }
  await a.click('button:has-text("CONFIRM")');
  await waitFor(a, () => window.__beacon.G.state.tx.machine.solved.valves);
  check(true, `valves solved (${v.valve || 'no valve'} ${v.turns})`);

  // module 3: keypad, in the column's order
  for (const word of keypadOrder(m.keypad.words)) {
    await a.click(`.tx-key:has-text("${word}")`);
    await sleep(150);
  }
  await waitFor(a, () => window.__beacon.G.state.tx.status === 'won');
  check(true, 'all three modules fixed: round won');
  await sleep(500);
  await shot(a, 'won');
  await b.click('summary:has-text("Xem lại")');
  await shot(b, 'won-review');

  // play again with swapped roles, then leave
  await b.click('text=↻ Chơi lại (máy mới)');
  await waitFor(a, () => window.__beacon.G.state.tx.status === 'setup');
  await a.click('text=⇄ Đổi vai');
  await waitFor(b, () => window.__beacon.G.state.tx.tech === 'p2');
  await a.click('text=Sẵn sàng ▶');
  await b.click('text=Sẵn sàng ▶');
  await waitFor(b, () => window.__beacon.G.state.tx.status === 'run');
  await sleep(500);
  check(await b.isVisible('.tx-machine') && await a.isVisible('.tx-manual'), 'roles swapped for the second round');
  const m2 = (await tx(a)).machine;
  check(JSON.stringify(m2.wires.colours) !== JSON.stringify(m.wires.colours) || m2.plate.serial !== m.plate.serial, 'a new machine for the new round');
  await shot(b, 'round2-machine');

  // reload in the middle of a round: the page comes back to the same round
  await a.reload();
  await waitFor(a, () => window.__beacon && window.__beacon.G.state && window.__beacon.G.state.stage === 'tx' && document.querySelector('.tx-manual'), null, 15000);
  check(true, 'reader reloads and is back in the round');

  await a.evaluate(() => window.__beacon.G.net.act({ type: 'tx_exit' }));
  await waitFor(b, () => !window.__beacon.G.state.flags.started && document.querySelector('#lobby:not(.hidden)'));
  check(true, 'leaving returns both players to the waiting room');
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
