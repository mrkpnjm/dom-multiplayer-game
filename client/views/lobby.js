import { initAudio } from '../sounds.js';

export function renderLobby(container, socket) {
    // 1. Inject the HTML
    container.innerHTML = `
        <div id="lobby-screen" class="screen">
            <h1>Snake IO</h1>
            <input type="text" id="player-name" placeholder="Enter your name" />
            <button id="join-btn">Join Game</button>
            
            <div id="player-list-container">
                <h3>Players Waiting:</h3>
                <ul id="player-list"></ul>
            </div>
            
            <button id="start-game-btn" style="display: none;">Start Game</button>
        </div>
    `;

    // 2. Attach Event Listeners
    const joinBtn = /** @type {HTMLButtonElement} */ (document.getElementById('join-btn'));
    const nameInput = /** @type {HTMLInputElement} */ (document.getElementById('player-name'));
    const startGameBtn = /** @type {HTMLButtonElement} */ (document.getElementById('start-game-btn'));

    joinBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            // Wake up the Web Audio API instantly on this user click
            initAudio(); 
            
            socket.emit('join', { name });
            
            // Prevent spamming and lock in their name
            joinBtn.disabled = true; 
            nameInput.disabled = true;
        }
    });

    // Only the host will ever see this button to click it
    startGameBtn.addEventListener('click', () => {
        socket.emit('start_game');
    });

    // 3. Listen for Server Updates (specific to the lobby)
    socket.on('lobby_update', (payload) => {
        const list = document.getElementById('player-list');
        if (list && payload.players) {
            // Added a neat little color dot next to their name so they know what color snake they are!
            list.innerHTML = payload.players.map(p => 
                `<li><span style="color:${p.color}; font-size: 1.2em;">●</span> ${p.name}</li>`
            ).join('');
            
            // The Lead Player / Host is always the first person in the array
            const isHost = payload.players.length > 0 && payload.players[0].id === socket.id;
            const hasEnoughPlayers = payload.players.length >= 2;

            if (isHost && hasEnoughPlayers) {
                startGameBtn.style.display = 'block';
            } else {
                startGameBtn.style.display = 'none';
            }
        }
    });
}