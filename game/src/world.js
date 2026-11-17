// The game itself: state plus one fixed step. The loop in main.js and the
// screenshot scenes in shots.js both drive the world through these functions.
import { ENEMIES, FIELD, LANTERN, PLAYER, WAVES } from './config.js';
import {
  burnInLantern, createPlayer, lanternRadius, makeEmber, makeFloater,
  makeParticle, stepEmber, stepEnemy, stepPlayer,
} from './entities.js';
import { makeRng } from './random.js';
import { createWaveState, rollUpgrades, scatterEmbers, startWave, stepSpawner, waveCleared } from './waves.js';

export function loadBest() {
  try { return Number(window.localStorage.getItem('emberfall-best') || 0) || 0; } catch (err) { return 0; }
}

export function saveBest(best) {
  try { window.localStorage.setItem('emberfall-best', String(best)); } catch (err) { /* no storage */ }
}

export function createState(seed) {
  const rng = makeRng(seed ?? Math.floor(Math.random() * 0xffffffff));
  const player = createPlayer();
  return {
    rng,
    player,
    enemies: [],
    embers: [],
    pulses: [],
    particles: [],
    floaters: [],
    waves: createWaveState(),
    score: 0,
    best: loadBest(),
    wave: 0,
    screen: 'title',
    upgrades: [],
    combo: 0,
    comboTimer: 0,
    shake: 0,
    time: 0,
    waveHint: '',
    overTimer: 0,
    muted: false,
  };
}

export function startRun(state) {
  state.player = createPlayer();
  state.enemies = [];
  state.embers = [];
  state.pulses = [];
  state.particles = [];
  state.floaters = [];
  state.score = 0;
  state.combo = 0;
  state.shake = 0;
  state.time = 0;
  state.overTimer = 0;
  state.screen = 'playing';
  state.waveHint = '';
  for (let i = 0; i < 5; i += 1) {
    state.embers.push(makeEmber(120 + state.rng() * (FIELD.width - 240), 120 + state.rng() * (FIELD.height - 240), state.rng));
  }
  startWave(state.waves, 1, state.rng);
  state.wave = 1;
}

export function firePulse(state) {
  const player = state.player;
  if (player.pulseTimer > 0 || player.charge < PLAYER.pulseCost || !player.alive) return false;
  player.charge -= PLAYER.pulseCost;
  player.pulseTimer = player.pulseCooldown;
  state.pulses.push({
    x: player.x, y: player.y, radius: 20, age: 0, life: 0.45,
    maxRadius: player.pulseRadius, damage: player.pulseDamage, hit: new Set(),
  });
  for (let i = 0; i < 14; i += 1) {
    state.particles.push(makeParticle(player.x, player.y, '#ffd278', 120, 0.4, 3));
  }
  return true;
}

function damageEnemy(state, enemy, amount, audio) {
  enemy.hp -= amount;
  enemy.flash = 0.12;
  if (enemy.hp <= 0) {
    state.score += enemy.score;
    state.floaters.push(makeFloater(enemy.x, enemy.y, `+${enemy.score}`, '#ffe9a8'));
    scatterEmbers(state, enemy.x, enemy.y, enemy.embers, state.rng);
    for (let i = 0; i < 12; i += 1) {
      state.particles.push(makeParticle(enemy.x, enemy.y, '#c9a6ff', 160, 0.5, 3));
    }
    if (audio) audio.kill();
    return true;
  }
  return false;
}

export function applyUpgrade(state, index, audio) {
  const up = state.upgrades[index];
  if (!up) return;
  up.apply(state.player);
  state.upgrades = [];
  if (audio) audio.upgrade();
  state.wave += 1;
  startWave(state.waves, state.wave, state.rng);
  state.screen = 'playing';
}

function hurtPlayer(state, enemy, audio) {
  const player = state.player;
  if (player.invulnerable > 0 || !player.alive) return;
  player.hearts -= enemy.touch;
  player.invulnerable = PLAYER.invulnerableSeconds;
  player.charge = Math.max(0, player.charge - 20);
  state.shake = 14;
  state.combo = 0;
  for (let i = 0; i < 16; i += 1) {
    state.particles.push(makeParticle(player.x, player.y, '#ff6b81', 200, 0.5, 4));
  }
  if (audio) audio.hit();
  if (player.hearts <= 0) {
    player.alive = false;
    state.screen = 'over';
    state.overTimer = 0;
    state.best = Math.max(state.best, state.score);
    saveBest(state.best);
    if (audio) audio.over();
  }
}

// One fixed step of the playing world. `move` is {x, y}; `pulse` fires the pulse.
export function stepWorld(state, move, pulse, audio, dt) {
  const player = state.player;
  state.time += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  if (state.screen === 'over') state.overTimer += dt;

  stepPlayer(player, move, dt);
  if (pulse) {
    if (firePulse(state) && audio) audio.pulse();
  }
  stepSpawner(state, state.waves, state.rng, dt);

  // Enemies: chase, burn in the light, touch the player.
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    stepEnemy(enemy, player, dt, state.time);
    burnInLantern(enemy, player, dt);
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < enemy.radius + PLAYER.radius - 3) hurtPlayer(state, enemy, audio);
    if (enemy.hp <= 0) {
      damageEnemy(state, enemy, 0, audio);
      state.enemies.splice(i, 1);
      continue;
    }
    if (enemy.x < -80 || enemy.x > FIELD.width + 80 || enemy.y < -80 || enemy.y > FIELD.height + 80) {
      state.enemies.splice(i, 1);
    }
  }

  // Pulses expand and strike once per enemy.
  for (let i = state.pulses.length - 1; i >= 0; i -= 1) {
    const pulseRing = state.pulses[i];
    pulseRing.age += dt;
    pulseRing.radius = 20 + (pulseRing.maxRadius - 20) * (pulseRing.age / pulseRing.life);
    for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = state.enemies[j];
      if (pulseRing.hit.has(enemy)) continue;
      const d = Math.hypot(enemy.x - pulseRing.x, enemy.y - pulseRing.y);
      if (Math.abs(d - pulseRing.radius) < enemy.radius + 14) {
        pulseRing.hit.add(enemy);
        const kx = (enemy.x - pulseRing.x) / (d || 1);
        const ky = (enemy.y - pulseRing.y) / (d || 1);
        enemy.x += kx * 46;
        enemy.y += ky * 46;
        if (damageEnemy(state, enemy, pulseRing.damage, audio)) state.enemies.splice(j, 1);
      }
    }
    if (pulseRing.age >= pulseRing.life) state.pulses.splice(i, 1);
  }

  // Embers: drift, get pulled in, feed the lantern.
  for (let i = state.embers.length - 1; i >= 0; i -= 1) {
    const ember = state.embers[i];
    stepEmber(ember, player, dt);
    const dist = Math.hypot(ember.x - player.x, ember.y - player.y);
    if (dist < PLAYER.pickupRadius) {
      state.embers.splice(i, 1);
      state.combo += 1;
      state.comboTimer = 2.5;
      const gained = Math.round(player.emberScore * (1 + Math.min(state.combo, 10) * 0.05));
      state.score += gained;
      player.charge = Math.min(LANTERN.chargeMax, player.charge + LANTERN.chargePerEmber);
      state.floaters.push(makeFloater(ember.x, ember.y - 10, `+${gained}`, '#ffe9a8'));
      for (let k = 0; k < 6; k += 1) {
        state.particles.push(makeParticle(ember.x, ember.y, '#ffb347', 90, 0.35, 2.5));
      }
      if (audio) audio.pickup(state.combo);
      continue;
    }
    if (ember.life <= 0 || ember.x < -40 || ember.x > FIELD.width + 40 || ember.y < -40 || ember.y > FIELD.height + 40) {
      state.embers.splice(i, 1);
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
    const f = state.floaters[i];
    f.y -= 34 * dt;
    f.life -= dt;
    if (f.life <= 0) state.floaters.splice(i, 1);
  }

  // Wave bookkeeping.
  const remaining = state.enemies.length + state.waves.spawnQueue.length;
  const boss = state.enemies.find((e) => e.kind === 'maw');
  state.waveHint = boss
    ? 'THE ABYSSAL MAW — burn it in your light!'
    : remaining > 0
      ? `Shadows left: ${remaining}`
      : '';
  if (state.screen === 'playing' && waveCleared(state.waves, state.enemies)) {
    state.score += WAVES.clearBonus(state.wave);
    state.upgrades = rollUpgrades(state.rng);
    state.screen = 'upgrade';
    if (audio) audio.clear();
  }
}

export { ENEMIES };
