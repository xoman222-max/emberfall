// Keyboard and mouse, read by the game loop. Nothing here touches the canvas.
// Movement: WASD or arrow keys. Pulse: Space or left click. Pause: P. Mute: M.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    mouse: { x: 0, y: 0, clicked: false },
    pulseQueued: false,
    pauseQueued: false,
    muteQueued: false,
    anyKeyQueued: false,
    choiceQueued: -1,
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('arrowleft') || keys.has('a')) x -= 1;
      if (keys.has('arrowright') || keys.has('d')) x += 1;
      if (keys.has('arrowup') || keys.has('w')) y -= 1;
      if (keys.has('arrowdown') || keys.has('s')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
  };

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    input.anyKeyQueued = true;
    if (key === ' ') input.pulseQueued = true;
    if (key === 'p' || key === 'escape') input.pauseQueued = true;
    if (key === 'm') input.muteQueued = true;
    if (key === '1' || key === '2' || key === '3') input.choiceQueued = Number(key) - 1;
  }
  function onKeyUp(event) { keys.delete(event.key.toLowerCase()); }
  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  }
  function onMouseDown(event) {
    onMouseMove(event);
    input.mouse.clicked = true;
    input.pulseQueued = true;
    input.anyKeyQueued = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  return input;
}

export function consumePulse(input) {
  const queued = input.pulseQueued || input.mouse.clicked;
  input.pulseQueued = false;
  input.mouse.clicked = false;
  return queued;
}
