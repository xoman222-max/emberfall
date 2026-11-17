// The wave director: what spawns, when, and the boss. Upgrades are rolled here
// too, so the upgrade screen always offers three different choices.
import { ENEMIES, FIELD, UPGRADES, WAVES } from './config.js';
import { makeEmber, makeEnemy } from './entities.js';
import { pick, shuffle } from './random.js';

export function createWaveState() {
  return {
    wave: 0,
    spawnQueue: [],
    spawnTimer: 0,
    betweenWaves: 0,
    bossSpawned: false,
  };
}

function edgePoint(rng) {
  const side = Math.floor(rng() * 4);
  const m = 30;
  if (side === 0) return { x: rng() * FIELD.width, y: -m };
  if (side === 1) return { x: FIELD.width + m, y: rng() * FIELD.height };
  if (side === 2) return { x: rng() * FIELD.width, y: FIELD.height + m };
  return { x: -m, y: rng() * FIELD.height };
}

export function startWave(waves, waveNumber, rng) {
  waves.wave = waveNumber;
  waves.spawnQueue = [];
  waves.bossSpawned = false;
  const count = WAVES.count(waveNumber);
  for (let i = 0; i < count; i += 1) {
    const roll = rng();
    const kind = roll < 0.55 ? 'wisp' : roll < 0.85 ? 'eel' : 'brute';
    waves.spawnQueue.push(kind);
  }
  if (waveNumber % WAVES.bossEvery === 0) waves.spawnQueue.push('maw');
  waves.spawnQueue = shuffle(rng, waves.spawnQueue);
  waves.spawnTimer = 0.5;
}

export function stepSpawner(state, waves, rng, dt) {
  // state: { enemies, embers } — the spawner appends to it.
  if (waves.spawnQueue.length > 0) {
    waves.spawnTimer -= dt;
    if (waves.spawnTimer <= 0) {
      waves.spawnTimer = WAVES.spawnInterval(waves.wave);
      const kind = waves.spawnQueue.shift();
      const at = edgePoint(rng);
      state.enemies.push(makeEnemy(kind, at.x, at.y, rng));
      if (kind === 'maw') waves.bossSpawned = true;
    }
  }
  // A slow drift of ambient embers keeps the lantern fed between fights.
  if (state.embers.length < 6 && Math.random() < dt * 0.4) {
    state.embers.push(makeEmber(
      60 + rng() * (FIELD.width - 120),
      60 + rng() * (FIELD.height - 120),
      rng,
    ));
  }
}

export function waveCleared(waves, enemies) {
  return waves.spawnQueue.length === 0 && enemies.length === 0;
}

export function rollUpgrades(rng) {
  return shuffle(rng, UPGRADES).slice(0, 3);
}

export function scatterEmbers(state, x, y, count, rng) {
  for (let i = 0; i < count; i += 1) {
    state.embers.push(makeEmber(
      Math.max(20, Math.min(FIELD.width - 20, x + (rng() - 0.5) * 90)),
      Math.max(20, Math.min(FIELD.height - 20, y + (rng() - 0.5) * 90)),
      rng,
    ));
  }
}

export function enemyKindName(kind) {
  return { wisp: 'Wisp', eel: 'Eel', brute: 'Brute', maw: 'Abyssal Maw' }[kind] || kind;
}

export { ENEMIES, pick };
