// The loop: input in, world stepped, world drawn. Also the ?shot= scenes
// the screenshots are taken from — a shot plays the real rules forward from
// a fixed seed, then freezes on one frame.
import { FIELD } from './config.js';
import { createAudio } from './audio.js';
import { consumePulse, createInput } from './input.js';
import { createBackdrop, drawWorld } from './render.js';
import { buildShotScene } from './shots.js';
import { applyUpgrade, createState, startRun, stepWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1);

const audio = createAudio();
const input = createInput(canvas);
const backdrop = createBackdrop();
let state;
let last = performance.now();

if (shotName) {
  // Screenshot mode: stage the scene, draw it once, and stop. No sound.
  state = buildShotScene(shotName, seed);
  drawWorld(ctx, state, backdrop, state.time);
} else {
  state = createState();
  state.screen = 'title';
  requestAnimationFrame(loop);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.time += dt * 0; // world time advances in stepWorld while playing

  if (input.muteQueued) {
    input.muteQueued = false;
    state.muted = audio.toggleMute();
  }

  if (state.screen === 'title') {
    if (input.anyKeyQueued) {
      input.anyKeyQueued = false;
      audio.unlock();
      startRun(state);
    }
  } else if (state.screen === 'playing') {
    if (input.pauseQueued) {
      input.pauseQueued = false;
      state.screen = 'paused';
    } else {
      stepWorld(state, input.moveVector(), consumePulse(input), audio, dt);
    }
  } else if (state.screen === 'paused') {
    if (input.pauseQueued) {
      input.pauseQueued = false;
      state.screen = 'playing';
    }
  } else if (state.screen === 'upgrade') {
    let choice = input.choiceQueued;
    input.choiceQueued = -1;
    if (input.mouse.clicked) {
      input.mouse.clicked = false;
      const cw = 300;
      const gap = 36;
      const total = cw * 3 + gap * 2;
      const x0 = (FIELD.width - total) / 2;
      for (let i = 0; i < 3; i += 1) {
        const x = x0 + i * (cw + gap);
        if (input.mouse.x >= x && input.mouse.x <= x + cw && input.mouse.y >= 240 && input.mouse.y <= 430) choice = i;
      }
    }
    if (choice >= 0 && choice < state.upgrades.length) applyUpgrade(state, choice, audio);
  } else if (state.screen === 'over') {
    if (state.overTimer > 0.8 && input.anyKeyQueued) {
      input.anyKeyQueued = false;
      startRun(state);
    }
  }

  drawWorld(ctx, state, backdrop, performance.now() / 1000);
  requestAnimationFrame(loop);
}
