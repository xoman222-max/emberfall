// All sound is synthesized with WebAudio: no audio files, nothing fetched.
// A soft pad loop for music, short blips for pickups, a sweep for the pulse,
// a low thud for taking a hit. Everything is guarded: no AudioContext, no sound.
export function createAudio() {
  let ctx = null;
  let master = null;
  let musicTimer = null;
  let muted = false;
  let chordIndex = 0;
  const CHORDS = [
    [110.0, 164.81, 220.0],
    [87.31, 130.81, 174.61],
    [98.0, 146.83, 196.0],
    [82.41, 123.47, 164.81],
  ];

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    } catch (err) { return false; }
    return true;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.05);
    } catch (err) { /* silent without sound */ }
  }

  function startMusic() {
    if (!ensure() || musicTimer) return;
    const playChord = () => {
      if (muted) return;
      const chord = CHORDS[chordIndex % CHORDS.length];
      chordIndex += 1;
      chord.forEach((freq) => tone(freq, 7.5, 'triangle', 0.045));
      tone(chord[0] / 2, 7.5, 'sine', 0.05);
    };
    playChord();
    musicTimer = window.setInterval(playChord, 8000);
  }

  return {
    unlock() { if (ensure()) { ctx.resume().catch(() => {}); startMusic(); } },
    pickup(combo) { tone(520 + Math.min(combo, 12) * 36, 0.16, 'sine', 0.16, 880 + Math.min(combo, 12) * 36); },
    pulse() { tone(220, 0.4, 'sawtooth', 0.12, 55); tone(440, 0.3, 'sine', 0.1, 110); },
    hit() { tone(90, 0.35, 'square', 0.2, 45); },
    kill() { tone(330, 0.12, 'triangle', 0.12, 660); },
    clear() { [523, 659, 784].forEach((f, i) => window.setTimeout(() => tone(f, 0.3, 'sine', 0.14), i * 110)); },
    upgrade() { [392, 523, 659, 784].forEach((f, i) => window.setTimeout(() => tone(f, 0.25, 'sine', 0.12), i * 80)); },
    over() { [392, 330, 262, 196].forEach((f, i) => window.setTimeout(() => tone(f, 0.5, 'triangle', 0.12), i * 220)); },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
  };
}
