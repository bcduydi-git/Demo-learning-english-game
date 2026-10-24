import '@fontsource/vt323';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import './style.css';
import Phaser from 'phaser';

import { G, emit, on } from './ctx.js';
import { net } from './net.js';
import { showLobby, hideLobby, lobbyError, renderLobby, lobbyVisible } from './ui/lobby.js';
import { initHud, showHud, renderHud, feedMessage, toast } from './ui/hud.js';
import { renderDialogue, advance, dialogueOpen } from './ui/dialogue.js';
import { openRadio } from './ui/radio.js';
import { openPhrasebook } from './ui/phrasebook.js';
import { openSettings } from './ui/settings.js';
import { showHint } from './ui/panels.js';
import { toggleMute, unlockAudio, sfx } from './audio.js';
import { BootScene } from './scenes/BootScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { BossScene } from './scenes/BossScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';
import { CreditsScene } from './scenes/CreditsScene.js';
import { TransmitterScene } from './scenes/TransmitterScene.js';
import { Chapter2Scene } from './scenes/Chapter2Scene.js';

const STAGE_SCENE = { world: 'World', boss: 'Boss', finale: 'Finale', credits: 'Credits', tx: 'Transmitter', ch2: 'Chapter2' };
let ready = false;
let currentScene = null;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  pixelArt: true,
  backgroundColor: '#0b0e1a',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, WorldScene, BossScene, FinaleScene, CreditsScene, TransmitterScene, Chapter2Scene],
});
G.game = game;

on('assets-ready', () => {
  ready = true;
  syncScene();
});

function syncScene() {
  const s = G.state;
  if (!ready || !s || !G.slot) return;
  const want = s.flags.started ? STAGE_SCENE[s.stage] : null;
  if (want === currentScene) {
    const sc = want && game.scene.getScene(want);
    if (sc && sc.applyState && game.scene.isActive(want)) sc.applyState(s);
    return;
  }
  const prev = currentScene;
  currentScene = want;
  if (prev) game.scene.stop(prev);
  if (want) game.scene.start(want);
}

// ------------------------------------------------------------ network
net.on('welcome', (m) => {
  G.slot = m.slot;
});

net.on('state', (s) => {
  G.state = s;
  G.slot = net.slot;
  if (s.flags.started) {
    if (lobbyVisible()) hideLobby();
    showHud(s.stage !== 'credits');
    renderHud(s);
  } else {
    showLobby();
    renderLobby();
  }
  renderDialogue(s);
  syncScene();
  emit('state', s);
});

net.on('ev', (e) => {
  emit('ev:' + e.e, e);
  if (e.e === 'radio') feedMessage(e);
  const sc = currentScene && game.scene.getScene(currentScene);
  if (sc && sc.onEvent && game.scene.isActive(currentScene)) sc.onEvent(e);
});

net.on('error', (m) => {
  if (lobbyVisible() || !G.state) lobbyError(m);
  else toast(m.msg, 'bad');
  if (m.code === 'replaced') {
    showHud(false);
    showLobby();
    lobbyError(m);
  }
});

net.on('status', () => {
  if (G.state && G.state.flags.started) renderHud(G.state);
  else renderLobby();
});

// ------------------------------------------------------------ keyboard
window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (!G.state || !G.state.flags.started || lobbyVisible()) return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
  if (G.busy) return;
  const k = e.key.toLowerCase();
  if (dialogueOpen()) {
    if (k === ' ' || k === 'enter' || k === 'e') { e.preventDefault(); advance(); }
    return;
  }
  if (G.typing) return; // boss / finale typing owns the keyboard
  if (k === 'r') { e.preventDefault(); openRadio(); }
  else if (k === 'b') { e.preventDefault(); openPhrasebook(); }
  else if (k === 'h') { e.preventDefault(); showHint(); }
  else if (k === 'm') { toggleMute(); }
  else if (k === 'escape') { if (!document.getElementById('lookoutpad')) openSettings(); }
});
window.addEventListener('pointerdown', unlockAudio);

// ------------------------------------------------------------ start
initHud();
showLobby();

// Resume automatically after a page reload in the middle of a session.
const params = new URLSearchParams(location.search);
import('./store.js').then(({ lastSession, loadSave, settings }) => {
  const last = lastSession();
  if (!last || params.get('room')) return;
  const save = loadSave(last.room);
  if (save && save.state && save.state.flags && save.state.flags.started && !save.state.flags.complete && Date.now() - save.savedAt < 6 * 3600e3) {
    net.connect('join', { room: last.room, slot: last.slot, save: save.state });
  }
});

// debug helpers for testing in the browser console
window.__beacon = { G, net, sfx };
