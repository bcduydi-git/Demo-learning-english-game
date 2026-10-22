// Reconnect / resume tests with a real server process:
//  1. a player closes the tab and comes back -> same role, same progress
//  2. the server restarts with an empty disk (like a free host waking up)
//     -> players' browsers rebuild the room from their own saves
//  3. someone else tries to join a full room while a player is offline
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = 8091;
const URL = `http://localhost:${PORT}/`;
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server;
function startServer(dataDir) {
  server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir }, stdio: 'pipe' });
  return sleep(800);
}
const tmp = (n) => fs.mkdtempSync(path.join(os.tmpdir(), n));
let fails = 0;
const check = (ok, msg) => { console.log(ok ? '✔' : '✘', msg); if (!ok) fails++; };

await startServer(tmp('bdata1-'));
const browser = await chromium.launch({ executablePath: fs.existsSync(EXE) ? EXE : undefined });
const ctxA = await browser.newContext();
const ctxB = await browser.newContext();
const a = await ctxA.newPage();
let b = await ctxB.newPage();
const st = (p) => p.evaluate(() => window.__beacon.G.state);
async function waitFor(p, fn, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { if (await p.evaluate(fn).catch(() => false)) return true; await sleep(150); }
  return false;
}
try {
  await a.goto(URL);
  await a.click('text=Tạo phòng mới');
  await a.click('text=Tạo phòng ▶');
  await a.waitForSelector('.code');
  const code = (await a.textContent('.code')).trim();
  await b.goto(URL + '?room=' + code);
  await b.click('text=Vào phòng ▶');
  await waitFor(a, () => window.__beacon.G.state.players.p2.connected);
  await a.click('text=Bắt đầu ▶');
  await waitFor(a, () => !!window.__beacon.G.state.scene);
  await a.evaluate(() => window.__beacon.G.net.act({ type: 'pickup', item: 'tools' }));
  await sleep(300);

  // 1. B closes the tab and comes back
  await b.close();
  check(await waitFor(a, () => !window.__beacon.G.state.players.p2.connected), 'A sees B offline');
  check(await waitFor(a, () => !document.querySelector('#hud .banner').classList.contains('hidden')), 'A shows the offline banner');
  b = await ctxB.newPage();
  await b.goto(URL);
  check(await waitFor(b, () => window.__beacon.G.slot === 'p2' && window.__beacon.G.state.flags.has_tools), 'B auto-resumes as p2 with progress');
  check(await waitFor(a, () => window.__beacon.G.state.players.p2.connected), 'A sees B back online');

  // 2. server restart with an empty disk
  server.kill('SIGKILL');
  await sleep(500);
  await startServer(tmp('bdata2-'));
  check(await waitFor(a, () => window.__beacon.G.net.status === 'online' && window.__beacon.G.state.players.p1.connected, 30000), 'A reconnects after server restart');
  check(await waitFor(b, () => window.__beacon.G.net.status === 'online' && window.__beacon.G.state.players.p2.connected, 30000), 'B reconnects after server restart');
  const s = await st(a);
  check(s.room === code && s.flags.has_tools && s.flags.started, 'room rebuilt from the players\' saves with progress');
  check(s.players.p1.look === 'lac' && s.players.p2.look === 'tim', 'characters (Lắc / Tím) kept');

  // 3. a third browser cannot join a full room; can take over an offline seat
  const ctxC = await browser.newContext();
  const c = await ctxC.newPage();
  await c.goto(URL + '?room=' + code);
  await c.click('text=Vào phòng ▶');
  check(await waitFor(c, () => /đủ 2 người/.test(document.querySelector('.err').textContent)), 'third player gets "room full"');
  await b.close();
  await waitFor(a, () => !window.__beacon.G.state.players.p2.connected);
  await c.goto(URL + '?room=' + code);
  await c.click('text=Vào phòng ▶');
  check(await waitFor(c, () => !!document.querySelector('button') && [...document.querySelectorAll('button')].some((x) => x.textContent.includes('Vào chỗ của'))), 'offered to take over the empty seat');
  await c.click('text=Vào chỗ của');
  check(await waitFor(c, () => window.__beacon.G.slot === 'p2' && window.__beacon.G.state.flags.started), 'takeover works (new browser continues as p2)');
} catch (e) {
  console.log('ERROR', e.message);
  fails++;
}
await browser.close();
server.kill();
console.log(fails ? `${fails} check(s) failed` : 'all reconnect checks passed');
process.exit(fails ? 1 : 0);
