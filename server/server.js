import express from 'express';
import http from 'http';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { createGameState, tick, getWinner, getSegments, TICK_INTERVAL } from './gameEngine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(join(__dirname, '..', 'client')));

const server = http.createServer(app);
const io = new Server(server);

const COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'];

/** @type {Map<string, { id: string, name: string, color: string }>} */
const players = new Map();

let gameState = null;
let gameLoop = null;
let timerInterval = null;
let isPaused = false;
const playerTurning = new Map();

function buildScores() {
    return Array.from(players.values()).map((p) => ({
        ...p,
        score: gameState ? (gameState.scores[p.id] ?? 0) : 0,
    }));
}

function endGame(winnerId) {
    clearInterval(gameLoop);
    clearInterval(timerInterval);
    gameLoop = null;
    timerInterval = null;

    const winner = players.get(winnerId);
    io.emit('game_over', {
        winner: winner ? winner.name : 'Nobody',
        scores: buildScores(),
    });

    gameState = null;
}

function handlePlayerLeave(socketId) {
    const player = players.get(socketId);
    if (!player) return;

    players.delete(socketId);

    if (gameState) {
        gameState.alive[socketId] = false;
        io.emit('player_died', { name: player.name });

        const alivePlayers = Object.keys(gameState.alive).filter((id) => gameState.alive[id]);
        if (alivePlayers.length <= 1) {
            endGame(alivePlayers.length === 1 ? alivePlayers[0] : getWinner(gameState));
        }
    } else {
        io.emit('lobby_update', { players: Array.from(players.values()) });
    }
}

io.on('connection', (socket) => {
    socket.on('join', ({ name }) => {
        const nameExists = [...players.values()].some((p) => p.name === name);
        if (nameExists || players.size >= 4) return;

        players.set(socket.id, {
            id: socket.id,
            name,
            color: COLORS[players.size % COLORS.length],
        });

        io.emit('lobby_update', { players: Array.from(players.values()) });
    });

    // Restore lobby state for returning players
    socket.on('request_lobby_update', () => {
        socket.emit('lobby_update', { players: Array.from(players.values()) });
    });

    socket.on('start_game', () => {
        if (players.size < 2 || gameLoop) return;

        gameState = createGameState(Array.from(players.values()));
        isPaused = false;
        io.emit('start_game');

        timerInterval = setInterval(() => {
            if (!gameState || isPaused) return;
            gameState.timer--;
            if (gameState.timer <= 0) endGame(getWinner(gameState));
        }, 1000);

        gameLoop = setInterval(() => {
            if (!gameState || isPaused) return;

            const { died, ateFood, gameOver, winnerId } = tick(gameState, playerTurning);

            died.forEach((id) => {
                const player = players.get(id);
                if (player) io.emit('player_died', { name: player.name });
            });

            if (ateFood && ateFood.length > 0) {
                io.emit('food_eaten');
            }

            io.emit('game_state', {
                snakes: Object.fromEntries(
                    Object.entries(gameState.snakes).map(([id, snake]) => [
                        id,
                        { segments: getSegments(snake), angle: snake.angle },
                    ]),
                ),
                food: gameState.food,
                scores: buildScores(),
                timer: gameState.timer,
                alive: gameState.alive,
            });

            if (gameOver) endGame(winnerId);
        }, TICK_INTERVAL);
    });

    socket.on('input', ({ turning }) => {
        playerTurning.set(socket.id, turning);
    });

    socket.on('pause', () => {
        const player = players.get(socket.id);
        if (player) {
            isPaused = true;
            io.emit('game_paused', { name: player.name });
        }
    });

    socket.on('resume', () => {
        const player = players.get(socket.id);
        if (player) {
            isPaused = false;
            io.emit('game_resumed', { name: player.name });
        }
    });

    socket.on('quit', () => handlePlayerLeave(socket.id));

    socket.on('disconnect', () => handlePlayerLeave(socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});