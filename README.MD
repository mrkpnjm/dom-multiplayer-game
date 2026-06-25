# Multiplayer Snake IO
A real-time, DOM-based multiplayer snake game built for 2-4 players.

## Features
- Smooth 60 FPS gameplay using requestAnimationFrame.
- Real-time multiplayer via Socket.io.
- Arcade-style retro aesthetic with glowing neon elements.
- Fully functional pause/resume/quit lobby system.
- Audio engine with retro sound effects.

## Setup & Installation
1. Clone the repository: `git clone https://gitea.kood.tech/markpenjam/multi-player`
2. Install dependencies: `npm install`
3. Run the server: `npm start`
4. Access the game at `http://localhost:3000`

## Gameplay
- Use `Arrow Keys` or `A, D keys` to steer your snake.
- Join the lobby and wait for at least one other player to join.
- The host can then start the game.

## Try it out

- For testing purposes, we also hosted the latest version of this repository on `https://dom-multiplayer-snake-game.onrender.com/`

- Note: Due to the low computational power and the location of the free version of this hosting platform, it might have some minor fps / stutter issues. While testing on the local machine, the game runs flawlessly.