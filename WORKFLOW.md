# Multiplayer Snake — Team Workflow

## Roles

- **Person A** — Server & Game Logic
- **Person B** — Renderer & Input
- **Person C** — UI, Lobby, Sounds & Deployment

---

## Step 1 — Setup

1. Clone the repo: `git clone https://gitea.kood.tech/markpenjam/multi-player`
2. Run `npm init -y`
3. Run `npm install express socket.io`
4. Create the folder structure:

```
/client
  index.html
  lobby.html
  style.css
  renderer.js
  input.js
  ui.js
  sounds.js
/server
  server.js
  gameEngine.js
package.json
README.md
```

---

## Step 2 — Build

### Person A — Server & Game Logic
Files: `server.js`, `gameEngine.js`

- [ ] Set up Express + Socket.io server
- [ ] Handle player connections, name validation (unique names)
- [ ] Track lobby state, assign snake colors
- [ ] Build game loop (tick every 100ms)
- [ ] Snake movement logic (move head, shift tail)
- [ ] Collision detection (wall, self, other snakes)
- [ ] Food spawning on random empty cells
- [ ] Score tracking (food eaten)
- [ ] Server-side countdown timer (2 min)
- [ ] Broadcast `game_state` every tick
- [ ] Handle pause/resume/quit, broadcast messages
- [ ] Emit `game_over` with winner and scores

### Person B — Renderer & Input
Files: `renderer.js`, `input.js`, `style.css`

- [ ] Build 30×30 CSS grid using divs
- [ ] Listen for `game_state` from server, repaint grid each update
- [ ] Use `requestAnimationFrame` — loop never stops, even when paused
- [ ] Color snake cells per player, food cells, empty cells
- [ ] Track keyboard with a `Set` (keydown adds, keyup removes) — no long-press bugs
- [ ] Send `input` event to server on direction change
- [ ] Block reverse direction (can't go backwards into yourself)
- [ ] Show visual flash when a snake dies

### Person C — UI, Lobby, Sounds & Deployment
Files: `index.html`, `ui.js`, `sounds.js`

- [ ] Lobby page: name input, player list, Start button (host only)
- [ ] Enforce unique name on the UI side too
- [ ] In-game HUD: scoreboard (all players, live), timer
- [ ] In-game menu overlay: Pause / Resume / Quit buttons
- [ ] Show message when someone pauses/resumes/quits ("Alice paused the game")
- [ ] Winner screen at end with final scores
- [ ] Sound effects: game start, eat food, die, game over (Web Audio API)
- [ ] Deploy to Railway or Render, share the public URL

---

## Step 3 — Integration

1. Person A runs `node server.js` locally
2. Person B and C connect their code to the running server
3. Fix any event name mismatches (refer to the socket events table below)

---

## Socket Events (shared contract — do not change without telling everyone)

| Event | Direction | Payload |
|---|---|---|
| `join` | Client → Server | `{ name }` |
| `lobby_update` | Server → All | `{ players }` |
| `start_game` | Client → Server | — |
| `game_state` | Server → All | `{ snakes, food, scores, timer }` |
| `input` | Client → Server | `{ direction }` |
| `player_died` | Server → All | `{ name }` |
| `pause` | Client → Server | `{ name }` |
| `game_paused` | Server → All | `{ name }` |
| `resume` | Client → Server | `{ name }` |
| `game_resumed` | Server → All | `{ name }` |
| `quit` | Client → Server | `{ name }` |
| `game_over` | Server → All | `{ winner, scores }` |

---

## Step 4 — Polish

- [ ] Test with 2, 3 and 4 players
- [ ] Check 60fps in browser DevTools (Performance tab)
- [ ] Check RAF keeps running during pause
- [ ] Check keyboard has no input delay or long-press glitch
- [ ] Check timer is same on all screens simultaneously
- [ ] Test on the deployed URL (not localhost)

---

## Step 5 — Final Check Before Submit

- [ ] Game runs at 60fps with no frame drops
- [ ] No canvas element anywhere in the code
- [ ] Pause/resume/quit works and shows player name to all
- [ ] Scores update live for all players
- [ ] Timer is server-controlled
- [ ] Winner screen shows at end
- [ ] Sound effects work
- [ ] Public URL works from any browser on any network
