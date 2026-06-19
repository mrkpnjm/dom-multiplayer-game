/**
 * @typedef {Object} Player
 * @property {string} id - The socket ID
 * @property {string} name - The player's display name
 * @property {string} color - The snake's color (e.g., "#FF0000")
 * @property {number} score - Current score
 */

/**
 * @typedef {Object} SnakeSegment
 * @property {number} x - X coordinate on the grid
 * @property {number} y - Y coordinate on the grid
 */

/**
 * @typedef {Object} GameStatePayload
 * @property {Object.<string, SnakeSegment[]>} snakes - Dictionary of snakes by socket ID
 * @property {{x: number, y: number}} food - Current food coordinates
 * @property {Player[]} scores - Current leaderboard
 * @property {number} timer - Time remaining in seconds
 */

/**
 * @typedef {Object} GameOverPayload
 * @property {string} winner - Name of the winning player
 * @property {Player[]} scores - Final leaderboard
 */

import express from 'express';
import http from 'http';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(join(__dirname, '..', 'client')));

const server = http.createServer(app);
const io = new Server(server);

// Store players in a Map for easy lookup by socket.id
/** @type {Map<string, Player>} */
const players = new Map();

// Helper array of colors for new players
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // --- Lobby Events ---
    socket.on('join', (payload) => {
        // Basic unique name validation
        let nameExists = false;
        for (const p of players.values()) {
            if (p.name === payload.name) nameExists = true;
        }

        if (nameExists) {
            // Optionally emit an error back to the client here
            return;
        }

        // Create the new player
        const newPlayer = {
            id: socket.id,
            name: payload.name,
            color: COLORS[players.size % COLORS.length],
            score: 0
        };

        players.set(socket.id, newPlayer);
        console.log(`${payload.name} joined the lobby.`);

        // Broadcast the updated player list to ALL connected clients
        io.emit('lobby_update', { players: Array.from(players.values()) });
    });

    // --- Game Menu Events ---
    
    // --> NEW: Catch the host's start signal and broadcast it to everyone
    socket.on('start_game', () => {
        console.log('The host has started the game!');
        io.emit('start_game'); 
    });

    socket.on('pause', () => {
        const player = players.get(socket.id);
        if (player) {
            io.emit('game_paused', { name: player.name });
        }
    });

    socket.on('resume', () => {
        const player = players.get(socket.id);
        if (player) {
            io.emit('game_resumed', { name: player.name });
        }
    });

    socket.on('quit', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`${player.name} quit the game.`);
            // When someone quits, we remove them and update the lobby
            players.delete(socket.id);
            io.emit('lobby_update', { players: Array.from(players.values()) });
        }
    });

    // --- Disconnect Handling ---
    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
        if (players.has(socket.id)) {
            players.delete(socket.id);
            // Broadcast updated lobby if someone closes their browser
            io.emit('lobby_update', { players: Array.from(players.values()) });
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});