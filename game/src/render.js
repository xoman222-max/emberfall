// Everything the eye sees: the reef, the creatures, the HUD and the screens.
// Drawing only reads state; it never changes it.
import { COLORS, FIELD, PLAYER } from './config.js';
import { lanternRadius } from './entities.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'playing';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_OVER = 'over';

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function glowCircle(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
  ctx.globalAlpha = 1;
}

export function createBackdrop() {
  // Pre-rendered reef silhouettes and drifting motes, drawn once per frame cheaply.
  const motes = [];
  for (let i = 0; i < 90; i += 1) {
    motes.push({
      x: Math.random() * FIELD.width,
      y: Math.random() * FIELD.height,
      r: 0.6 + Math.random() * 1.8,
      speed: 4 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2,
    });
  }
  const corals = [];
  for (let x = 20; x < FIELD.width; x += 90 + Math.random() * 120) {
    corals.push({ x, h: 40 + Math.random() * 90, w: 26 + Math.random() * 30, hue: Math.random() });
  }
  return { motes, corals };
}

function drawBackdrop(ctx, backdrop, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, '#06233a');
  grad.addColorStop(0.55, COLORS.water);
  grad.addColorStop(1, COLORS.deep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // God rays from the surface.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#9fdcff';
  for (let i = 0; i < 5; i += 1) {
    const x = 150 + i * 240 + Math.sin(time * 0.1 + i) * 20;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 90, 0);
    ctx.lineTo(x + 40, FIELD.height);
    ctx.lineTo(x - 60, FIELD.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Drifting motes.
  ctx.fillStyle = '#bfe9ff';
  for (const mote of backdrop.motes) {
    const y = (mote.y + time * mote.speed) % FIELD.height;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time + mote.phase);
    circle(ctx, mote.x, y, mote.r);
  }
  ctx.globalAlpha = 1;

  // Reef silhouettes along the floor.
  for (const coral of backdrop.corals) {
    ctx.fillStyle = coral.hue > 0.5 ? '#0a2f26' : COLORS.reef;
    ctx.beginPath();
    ctx.moveTo(coral.x - coral.w / 2, FIELD.height);
    ctx.quadraticCurveTo(coral.x - coral.w / 4, FIELD.height - coral.h, coral.x, FIELD.height - coral.h * 1.15);
    ctx.quadraticCurveTo(coral.x + coral.w / 4, FIELD.height - coral.h, coral.x + coral.w / 2, FIELD.height);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPlayer(ctx, player, time) {
  if (!player.alive) return;
  const blink = player.invulnerable > 0 && Math.floor(time * 12) % 2 === 0;
  const radius = lanternRadius(player);
  glowCircle(ctx, player.x, player.y, radius, 'rgba(255, 190, 90, 0.20)', 1);
  glowCircle(ctx, player.x, player.y, radius * 0.55, 'rgba(255, 210, 120, 0.16)', 1);

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  if (blink) ctx.globalAlpha = 0.35;
  // Tail.
  ctx.fillStyle = '#3fb8d8';
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-24, -10);
  ctx.lineTo(-24, 10);
  ctx.closePath();
  ctx.fill();
  // Body.
  const body = ctx.createLinearGradient(-14, 0, 16, 0);
  body.addColorStop(0, '#2a9ec4');
  body.addColorStop(1, COLORS.player);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lantern bulb.
  ctx.fillStyle = COLORS.emberCore;
  circle(ctx, 12, 0, 6 + Math.sin(time * 5) * 1.2);
  ctx.fillStyle = '#123';
  circle(ctx, 7, -4, 2.4);
  ctx.restore();

  // Pulse cooldown arc.
  if (player.pulseTimer > 0) {
    ctx.strokeStyle = 'rgba(255, 179, 71, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 24, -Math.PI / 2, -Math.PI / 2 + (1 - player.pulseTimer / player.pulseCooldown) * Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(ctx, enemy, time) {
  const scaleIn = 0.4 + 0.6 * enemy.spawnT;
  const r = enemy.radius * scaleIn;
  const color = COLORS[enemy.kind] || '#fff';
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  if (enemy.flash > 0) ctx.globalAlpha = 0.85;
  glowCircle(ctx, 0, 0, r * 2.2, color, 0.35);
  if (enemy.kind === 'wisp') {
    ctx.fillStyle = color;
    circle(ctx, 0, 0, r);
    ctx.fillStyle = '#fff';
    circle(ctx, -r * 0.3, -r * 0.2, r * 0.28);
    circle(ctx, r * 0.3, -r * 0.2, r * 0.28);
  } else if (enemy.kind === 'eel') {
    ctx.rotate(Math.atan2(enemy.vy, enemy.vx));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.7, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, r, -2, 2.5);
    ctx.beginPath();
    ctx.moveTo(-r * 1.4, 0);
    ctx.lineTo(-r * 2.2, -r * 0.5 + Math.sin(time * 10 + enemy.wobble) * 3);
    ctx.lineTo(-r * 2.2, r * 0.5 + Math.sin(time * 10 + enemy.wobble) * 3);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.kind === 'brute') {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + time * 0.4;
      const rr = i % 2 === 0 ? r : r * 0.72;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b0000';
    circle(ctx, -r * 0.3, -r * 0.15, r * 0.16);
    circle(ctx, r * 0.3, -r * 0.15, r * 0.16);
  } else {
    // The Abyssal Maw: a ringed mouth that opens as it charges.
    const open = 0.5 + 0.5 * Math.sin(time * 0.5 + enemy.wobble);
    ctx.fillStyle = color;
    circle(ctx, 0, 0, r);
    ctx.fillStyle = '#1a0010';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.62, r * (0.2 + open * 0.42), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      circle(ctx, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 3);
    }
  }
  ctx.restore();
  if (enemy.maxHp > 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(enemy.x - 22, enemy.y - enemy.radius - 12, 44, 5);
    ctx.fillStyle = COLORS.ember;
    ctx.fillRect(enemy.x - 22, enemy.y - enemy.radius - 12, 44 * (enemy.hp / enemy.maxHp), 5);
  }
}

function drawEmber(ctx, ember, time) {
  const bob = Math.sin(ember.bob) * 2;
  glowCircle(ctx, ember.x, ember.y + bob, 18, 'rgba(255, 179, 71, 0.55)', 1);
  ctx.fillStyle = COLORS.emberCore;
  circle(ctx, ember.x, ember.y + bob, 5);
  ctx.fillStyle = COLORS.ember;
  circle(ctx, ember.x, ember.y + bob, 2.5);
}

function drawHud(ctx, state) {
  const { player, score, wave } = state;
  ctx.save();
  ctx.textBaseline = 'top';
  // Score.
  ctx.fillStyle = COLORS.hud;
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 24, 18);
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillStyle = '#8fd0ea';
  ctx.fillText(`WAVE ${wave}`, 24, 56);
  // Hearts.
  ctx.textAlign = 'right';
  ctx.font = '26px system-ui, sans-serif';
  let hearts = '';
  for (let i = 0; i < player.maxHearts; i += 1) hearts += i < player.hearts ? '♥' : '♡';
  ctx.fillStyle = '#ff6b81';
  ctx.fillText(hearts, FIELD.width - 24, 18);
  // Lantern charge bar.
  const bw = 220;
  const bx = FIELD.width - 24 - bw;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(bx, 52, bw, 12);
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#ff9a3d');
  grad.addColorStop(1, '#ffe9a8');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, 52, bw * (player.charge / 100), 12);
  ctx.fillStyle = '#cfeeff';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('LANTERN', bx - 8, 50);
  // Wave progress.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8fd0ea';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(state.waveHint, FIELD.width / 2, 20);
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(3, 18, 31, 0.82)';
  ctx.strokeStyle = 'rgba(127, 231, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
}

function drawTitle(ctx, state, time) {
  ctx.fillStyle = 'rgba(2, 10, 20, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const bob = Math.sin(time * 1.2) * 6;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ember;
  ctx.font = '900 84px system-ui, sans-serif';
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 34;
  ctx.fillText('EMBERFALL', FIELD.width / 2, 150 + bob);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.hud;
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText('Last light of the reef — keep the lantern burning.', FIELD.width / 2, 252 + bob);
  ctx.fillStyle = '#9fd8ef';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('WASD / arrows to swim   ·   SPACE or click to pulse   ·   P pause   ·   M mute', FIELD.width / 2, 300 + bob);
  ctx.fillText('Catch embers to feed your light. The light burns the shadows.', FIELD.width / 2, 332 + bob);
  ctx.fillText('Clear a wave, choose an upgrade, survive the Maw every 5th wave.', FIELD.width / 2, 364 + bob);
  if (state.best > 0) {
    ctx.fillStyle = COLORS.ember;
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(`BEST  ${state.best}`, FIELD.width / 2, 412 + bob);
  }
  ctx.fillStyle = '#eafcff';
  ctx.font = '700 26px system-ui, sans-serif';
  if (Math.floor(time * 1.6) % 2 === 0) ctx.fillText('— press any key to dive in —', FIELD.width / 2, 480 + bob);
}

function drawUpgrade(ctx, state) {
  ctx.fillStyle = 'rgba(2, 10, 20, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ember;
  ctx.font = '900 44px system-ui, sans-serif';
  ctx.fillText(`WAVE ${state.wave} CLEAR!`, FIELD.width / 2, 110);
  ctx.fillStyle = COLORS.hud;
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('Choose one upgrade  —  keys 1 / 2 / 3, or click a card', FIELD.width / 2, 175);
  const cw = 300;
  const ch = 190;
  const gap = 36;
  const total = cw * 3 + gap * 2;
  const x0 = (FIELD.width - total) / 2;
  state.upgrades.forEach((up, i) => {
    const x = x0 + i * (cw + gap);
    const y = 240;
    panel(ctx, x, y, cw, ch);
    ctx.fillStyle = COLORS.ember;
    ctx.font = '900 30px system-ui, sans-serif';
    ctx.fillText(`[${i + 1}]`, x + cw / 2, y + 26);
    ctx.fillStyle = '#eafcff';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText(up.name, x + cw / 2, y + 78);
    ctx.fillStyle = '#9fd8ef';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(up.text, x + cw / 2, y + 122);
  });
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(10, 2, 10, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b81';
  ctx.font = '900 72px system-ui, sans-serif';
  ctx.shadowColor = '#ff2e63';
  ctx.shadowBlur = 30;
  ctx.fillText('THE LIGHT FADES', FIELD.width / 2, 170);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.hud;
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText(`SCORE  ${state.score}`, FIELD.width / 2, 280);
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillStyle = '#9fd8ef';
  ctx.fillText(`You reached wave ${state.wave}  ·  Best ${Math.max(state.best, state.score)}`, FIELD.width / 2, 330);
  ctx.fillStyle = '#eafcff';
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText('Press R or any key to dive again', FIELD.width / 2, 420);
}

export function drawWorld(ctx, state, backdrop, time) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawBackdrop(ctx, backdrop, time);
  for (const ember of state.embers) drawEmber(ctx, ember, time);
  for (const pulse of state.pulses) {
    ctx.strokeStyle = `rgba(255, 210, 120, ${Math.max(0, 1 - pulse.age / pulse.life)})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const enemy of state.enemies) drawEnemy(ctx, enemy, time);
  drawPlayer(ctx, state.player, time);
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    circle(ctx, p.x, p.y, p.size);
  }
  ctx.globalAlpha = 1;
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.fillStyle = f.color;
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (state.screen === SCREEN_PLAY || state.screen === SCREEN_UPGRADE || state.screen === 'paused') {
    drawHud(ctx, state);
  }
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state, time);
  if (state.screen === SCREEN_UPGRADE) drawUpgrade(ctx, state);
  if (state.screen === SCREEN_OVER) drawOver(ctx, state);
  if (state.screen === 'paused') {
    ctx.fillStyle = 'rgba(2, 10, 20, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.hud;
    ctx.font = '900 52px system-ui, sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 320);
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText('Press P to keep swimming', FIELD.width / 2, 380);
  }
}
