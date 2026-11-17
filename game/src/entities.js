// The things that live in the reef: the player, the shadow creatures, embers,
// the pulse ring, particles and floating score text. Pure state plus step
// functions; drawing lives in render.js.
import { ENEMIES, FIELD, LANTERN, PLAYER } from './config.js';

export function createPlayer() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    hearts: PLAYER.maxHearts,
    maxHearts: PLAYER.maxHearts,
    charge: 55,
    maxSpeed: PLAYER.maxSpeed,
    lanternBonus: 0,
    magnetRadius: PLAYER.emberMagnetRadius,
    pulseRadius: PLAYER.pulseRadius,
    pulseDamage: PLAYER.pulseDamage,
    pulseCooldown: PLAYER.pulseCooldown,
    pulseTimer: 0,
    emberScore: 10,
    invulnerable: 0,
    alive: true,
  };
}

export function lanternRadius(player) {
  return LANTERN.baseRadius + player.lanternBonus + player.charge * LANTERN.radiusPerCharge;
}

export function makeEnemy(kind, x, y, rng) {
  const spec = ENEMIES[kind];
  return {
    kind,
    x, y,
    vx: 0, vy: 0,
    radius: spec.radius,
    hp: spec.hp,
    maxHp: spec.hp,
    speed: spec.speed * (0.9 + rng() * 0.2),
    score: spec.score,
    embers: spec.embers,
    touch: spec.touch,
    wobble: rng() * Math.PI * 2,
    flash: 0,
    spawnT: 0,
  };
}

export function makeEmber(x, y, rng) {
  return {
    x, y,
    vx: (rng() - 0.5) * 30,
    vy: (rng() - 0.5) * 30,
    radius: 6,
    bob: rng() * Math.PI * 2,
    life: 14,
  };
}

export function makeParticle(x, y, color, speed, life, size) {
  const a = Math.random() * Math.PI * 2;
  return { x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life, maxLife: life, size };
}

export function makeFloater(x, y, text, color) {
  return { x, y, text, color, life: 1.1 };
}

export function stepPlayer(player, move, dt) {
  player.vx += move.x * PLAYER.accel * dt;
  player.vy += move.y * PLAYER.accel * dt;
  player.vx *= Math.pow(PLAYER.drag, dt * 60);
  player.vy *= Math.pow(PLAYER.drag, dt * 60);
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > player.maxSpeed) {
    player.vx = (player.vx / speed) * player.maxSpeed;
    player.vy = (player.vy / speed) * player.maxSpeed;
  }
  player.x = Math.max(PLAYER.radius, Math.min(FIELD.width - PLAYER.radius, player.x + player.vx * dt));
  player.y = Math.max(PLAYER.radius, Math.min(FIELD.height - PLAYER.radius, player.y + player.vy * dt));
  if (speed > 20) player.angle = Math.atan2(player.vy, player.vx);
  if (player.invulnerable > 0) player.invulnerable -= dt;
  if (player.pulseTimer > 0) player.pulseTimer -= dt;
  player.charge = Math.max(0, player.charge - LANTERN.chargeDecayPerSecond * dt);
}

export function stepEnemy(enemy, player, dt, time) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  let mx = dx / dist;
  let my = dy / dist;
  if (enemy.kind === 'eel') {
    const perp = Math.sin(time * 3 + enemy.wobble) * 0.7;
    mx += -my * perp;
    my += mx * perp;
  }
  if (enemy.kind === 'maw') {
    // The Maw lumbers, then charges in a straight line.
    const charging = Math.sin(time * 0.5 + enemy.wobble) > 0.55;
    const s = charging ? enemy.speed * 2.6 : enemy.speed * 0.6;
    enemy.vx = mx * s;
    enemy.vy = my * s;
  } else {
    enemy.vx = mx * enemy.speed;
    enemy.vy = my * enemy.speed;
  }
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  if (enemy.flash > 0) enemy.flash -= dt;
  if (enemy.spawnT < 1) enemy.spawnT = Math.min(1, enemy.spawnT + dt * 2);
}

export function burnInLantern(enemy, player, dt) {
  // Shadows caught in the lantern light slowly burn.
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  if (Math.hypot(dx, dy) < lanternRadius(player)) {
    enemy.hp -= LANTERN.burnDamagePerSecond * dt;
    enemy.flash = Math.max(enemy.flash, 0.05);
    return true;
  }
  return false;
}

export function stepEmber(ember, player, dt) {
  const dx = player.x - ember.x;
  const dy = player.y - ember.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist < player.magnetRadius) {
    const pull = 420 * (1 - dist / (player.magnetRadius + 60));
    ember.vx += (dx / dist) * pull * dt;
    ember.vy += (dy / dist) * pull * dt;
  }
  ember.vx *= Math.pow(0.94, dt * 60);
  ember.vy *= Math.pow(0.94, dt * 60);
  ember.x += ember.vx * dt;
  ember.y += ember.vy * dt;
  ember.bob += dt * 3;
  ember.life -= dt;
}
