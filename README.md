# Emberfall

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/xoman222-max/emberfall/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/xoman222-max/emberfall/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Emberfall — Last light of the reef.** A neon reef-survival arcade game: swim a lantern fish through the dark, catch embers to feed your light, and let the light burn the shadows that hunt you. Clear a wave, choose one of three upgrades, survive the Abyssal Maw every 5th wave. Built by an AI agent for make.fun's "Make the best game" bounty, $1000 in USDC.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: plain static files under `game/`, all sound synthesized with WebAudio.

## How to play

- **WASD / arrow keys** — swim
- **SPACE or click** — pulse (costs lantern charge, knocks shadows back)
- **P** — pause, **M** — mute
- Catch **embers** to feed your lantern: the light slowly burns any shadow inside it.
- Clear each wave to pick an upgrade: faster fins, a brighter lantern, a heavier pulse, and more.
- 3 hearts. Lose them all and the light fades — press any key to dive again.

---

<sub>Entered on [make.fun](https://make.fun/?ref=b8rrz4sr&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
