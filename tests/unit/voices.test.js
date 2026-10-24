import test from 'node:test';
import assert from 'node:assert/strict';
import { allocate, genderOf, CAST } from '../../client/src/voices.js';

const v = (name, lang = 'en-US') => ({ name, lang });
// Chrome on Windows
const CHROME_WIN = [
  v('Microsoft David - English (United States)'), v('Microsoft Mark - English (United States)'),
  v('Microsoft Zira - English (United States)'), v('Google US English'),
  v('Google UK English Female', 'en-GB'), v('Google UK English Male', 'en-GB'),
];

test('gender from voice names', () => {
  assert.equal(genderOf('Google UK English Female'), 'f');
  assert.equal(genderOf('Google UK English Male'), 'm');
  assert.equal(genderOf('Microsoft Zira - English (United States)'), 'f');
  assert.equal(genderOf('Microsoft Guy Online (Natural) - English (United States)'), 'm');
  assert.equal(genderOf('Google US English'), 'f');
});

test('Chrome on Windows: the main characters get different voices of the right gender', () => {
  const c = allocate(CHROME_WIN);
  const main = ['lac', 'tim', 'keeper', 'captain'];
  assert.equal(new Set(main.map((w) => c[w].voice.name)).size, 4);
  for (const w of main) assert.equal(genderOf(c[w].voice.name), CAST[w].gender, w);
  assert.equal(new Set(Object.values(c).map((x) => x.voice.name)).size, 6);
});

test('only two voices: shared voices are shifted in pitch', () => {
  const c = allocate([v('Alex'), v('Samantha')]);
  assert.equal(genderOf(c.lac.voice.name), 'm');
  assert.equal(genderOf(c.captain.voice.name), 'm');
  assert.ok(c.captain.shared);
  assert.notEqual(c.captain.pitch, CAST.captain.pitch);
  assert.ok(!c.lac.shared);
});

test('player choice wins and others avoid it', () => {
  const c = allocate(CHROME_WIN, { tim: 'Google UK English Female' });
  assert.equal(c.tim.voice.name, 'Google UK English Female');
  assert.ok(c.tim.fixed);
  assert.notEqual(c.keeper.voice.name, 'Google UK English Female');
});

test('no voices at all', () => {
  const c = allocate([]);
  assert.equal(c.lac.voice, null);
});
