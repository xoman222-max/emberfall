// Tuning for Emberfall: every number the game balances on lives here.
// The arena is a fixed 1280x720 field; the page scales the canvas to fit.
export const FIELD = { width: 1280, height: 720 };

export const PLAYER = {
  radius: 14,
  accel: 1500,
  maxSpeed: 270,
  drag: 0.86,
  maxHearts: 3,
  invulnerableSeconds: 1.4,
  pulseCost: 25,
  pulseCooldown: 0.9,
  pulseRadius: 170,
  pulseDamage: 2,
  emberMagnetRadius: 90,
  pickupRadius: 26,
};

export const LANTERN = {
  baseRadius: 70,
  radiusPerCharge: 1.15,
  chargeMax: 100,
  chargePerEmber: 9,
  chargeDecayPerSecond: 1.6,
  burnDamagePerSecond: 1.2,
};

export const ENEMIES = {
  wisp:  { radius: 12, hp: 1, speed: 70,  score: 25,  embers: 1, touch: 1 },
  eel:   { radius: 11, hp: 2, speed: 165, score: 40,  embers: 2, touch: 1 },
  brute: { radius: 24, hp: 6, speed: 48,  score: 80,  embers: 3, touch: 1 },
  maw:   { radius: 52, hp: 70, speed: 55, score: 500, embers: 10, touch: 2 },
};

export const WAVES = {
  // enemies in wave n (before the boss wave's own count)
  count: (n) => 5 + 3 * n,
  spawnInterval: (n) => Math.max(0.55, 1.5 - n * 0.09),
  bossEvery: 5,
  clearBonus: (n) => 100 * n,
};

export const UPGRADES = [
  { id: 'fins',    name: 'Swift Fins',    text: '+14% swim speed',            apply: (p) => { p.maxSpeed *= 1.14; } },
  { id: 'lantern', name: 'Brighter Lantern', text: '+26 lantern radius',      apply: (p) => { p.lanternBonus += 26; } },
  { id: 'pulse',   name: 'Heavy Pulse',   text: '+45% pulse damage and reach', apply: (p) => { p.pulseDamage *= 1.45; p.pulseRadius *= 1.2; } },
  { id: 'magnet',  name: 'Ember Magnet',  text: '+70% ember pull radius',     apply: (p) => { p.magnetRadius *= 1.7; } },
  { id: 'scales',  name: 'Thick Scales',  text: '+1 max heart, heal 1',       apply: (p) => { p.maxHearts += 1; p.hearts = Math.min(p.maxHearts, p.hearts + 1); } },
  { id: 'greed',   name: 'Ember Greed',   text: '+25% ember score',           apply: (p) => { p.emberScore *= 1.25; } },
  { id: 'quick',   name: 'Quick Pulse',   text: 'Pulse recharges 30% faster', apply: (p) => { p.pulseCooldown *= 0.7; } },
];

export const COLORS = {
  deep: '#04121f',
  water: '#0a2a44',
  reef: '#0d3a2e',
  ember: '#ffb347',
  emberCore: '#ffe9a8',
  player: '#7fe7ff',
  playerCore: '#eafcff',
  wisp: '#b48cff',
  eel: '#ff7ad9',
  brute: '#ff5d5d',
  maw: '#ff2e63',
  hud: '#cfeeff',
};
