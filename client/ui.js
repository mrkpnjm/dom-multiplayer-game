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

// Import your views and sounds
import { renderLobby } from './views/lobby.js';
import { renderGame } from './views/game.js';
import { playStartSound} from './sounds.js';
import { relayGameOver, isBurstHandlingExit, resetStarBurst } from './starBurst.js';

// Global Socket Connection
// @ts-ignore
const socket = io();
const appContainer = document.getElementById('app');

// State Manager / Router
function navigate(viewName, data = null) {
    // Clear out any existing HTML and old event listeners
    if (appContainer) appContainer.innerHTML = '';

    // Remove all previous socket listeners to prevent duplicates when switching screens
    socket.off('lobby_update');
    socket.off('game_state');
    socket.off('game_paused');
    socket.off('game_resumed');
    socket.off('player_died');
    socket.off('food_eaten');

    // Route to the correct view
    if (viewName === 'lobby') {
        renderLobby(appContainer, socket);
    } else if (viewName === 'game') {
        renderGame(appContainer, socket, navigate);
    } else if (viewName === 'game_over') {
        renderGameOver(appContainer, socket, navigate, data);
    }
}

// The Game Over View
function renderGameOver(container, socket, navigate, data) {
    container.innerHTML = `
        <div id="game-over-screen" class="screen">
            <h1>Game Over!</h1>
            <h2>Winner: ${data && data.winner ? data.winner : 'Tie!'}</h2>
            <button id="play-again-btn">Back to Lobby</button>
        </div>
    `;

    const playAgainBtn = /** @type {HTMLButtonElement} */ (
        document.getElementById('play-again-btn')
    );
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            navigate('lobby');
        });
    }
}

// --- Global Server Events that trigger routing ---

socket.on('start_game', () => {
    resetStarBurst(); // clear any leftover burst state before the new round registers its own
    playStartSound(); // Trigger Start Sound
    navigate('game');
});

socket.on(
    'game_over',
    /** @param {GameOverPayload} payload */ (payload) => {
        
        // Hand the result to the game view's burst logic. If it handled it (or a
        // burst is already running the exit), let the burst own the transition to
        // Game Over; otherwise navigate here as a fallback.
        const burstOngoing = relayGameOver(payload);
        if (burstOngoing || isBurstHandlingExit()) return;
        navigate('game_over', payload);
    },
);

// Boot up the application
navigate('lobby');
