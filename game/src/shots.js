// Screenshot scenes: each one plays the real rules forward from a fresh
// world with a fixed seed, steered by a simple autopilot, and freezes on the
// frame the screenshot takes. ?shot=start|play|upgrade|end&seed=1
import { FIELD, PLAYER } from './config.js';
import { createState, startRun, stepWorld } from './world.js';
import { rollUpgrades, startWave } from './waves.js';

const DT = 1 / 60;

function nearest(list, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const item of list) {
    const d = Math.hypot(item.x - x, item.y - y);
    if (d < bestD) { bestD = d; best = item; }
  }
  return { item: best, dist: bestD };
}

// Chase the nearest ember; run from the nearest shadow inside 150px.
function autopilot(state, reckless) {
  const player = state.player;
  const foe = nearest(state.enemies, player.x, player.y);
  if (foe.item && foe.dist < 150) {
    const dx = player.x - foe.item.x;
    const dy = player.y - foe.item.y;
    const d = Math.hypot(dx, dy) || 1;
    if (reckless) return { x: -dx / d, y: -dy / d, pulse: false };
    return { x: dx / d, y: dy / d, pulse: foe.dist < 170 };
  }
  const ember = nearest(state.embers, player.x, player.y);
  if (ember.item) {
    const dx = ember.item.x - player.x;
    const dy = ember.item.y - player.y;
    const d = Math.hypot(dx, dy) || 1;
    if (reckless) return { x: -dx / d, y: -dy / d, pulse: false };
    return { x: dx / d, y: dy / d, pulse: false };
  }
  return { x: 0, y: -0.4, pulse: false };
}

function simulate(state, seconds, reckless) {
  const steps = Math.floor(seconds / DT);
  for (let i = 0; i < steps; i += 1) {
    if (state.screen === 'over' || state.screen === 'upgrade') break;
    const move = autopilot(state, reckless);
    stepWorld(state, { x: move.x, y: move.y }, move.pulse, null, DT);
  }
}

export function buildShotScene(name, seed) {
  const state = createState(seed);
  if (name === 'start') {
    startRun(state);
    // A calm reef behind the title: a few embers, a few distant wisps.
    state.screen = 'title';
    simulate(state, 5, false);
    state.screen = 'title';
    state.time = 5;
    return state;
  }
  if (name === 'play') {
    startRun(state);
    state.wave = 3;
    startWave(state.waves, 3, state.rng);
    simulate(state, 14, false);
    state.screen = 'playing';
    state.time = 14;
    return state;
  }
  if (name === 'upgrade') {
    startRun(state);
    simulate(state, 90, false);
    if (state.screen !== 'upgrade') {
      // The pilot cleared slowly: force the wave clear for the shot.
      state.enemies = [];
      state.waves.spawnQueue = [];
      state.upgrades = rollUpgrades(state.rng);
      state.screen = 'upgrade';
      state.score += 100;
    }
    state.time = 30;
    return state;
  }
  // end: a reckless pilot that swims into the shadows until the light fades.
  startRun(state);
  simulate(state, 120, true);
  if (state.screen !== 'over') {
    state.player.hearts = 0;
    state.player.alive = false;
    state.screen = 'over';
    state.best = Math.max(state.best, state.score);
  }
  state.time = 40;
  return state;
}

export { FIELD, PLAYER };
