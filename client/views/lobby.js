import { initAudio } from '../sounds.js';

export function renderLobby(container, socket) {
    // 1. Inject the HTML
    container.innerHTML = `
        <div id="lobby-screen" class="screen">
            <h1>Snake IO</h1>
            <input type="text" id="player-name" placeholder="Enter your name" />
            <button id="join-btn">Join Game</button>
            
            <div id="join-error" style="color: #e74c3c; margin-top: 10px; font-weight: bold; display: none;"></div>
            
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
    const errorText = document.getElementById('join-error'); // NEW

    joinBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            initAudio();
            
            // Hide the error text if they are trying again
            if (errorText) errorText.style.display = 'none';

            socket.emit('join', { name });
            joinBtn.disabled = true;
            nameInput.disabled = true;
        }
    });

    startGameBtn.addEventListener('click', () => {
        socket.emit('start_game');
    });

    // Ask the server for the current lobby state in case we just finished a game
    socket.emit('request_lobby_update');

    // 3. Listen for Server Updates

    // Listen for rejections and unlock the UI
    socket.on('join_error', (payload) => {
        joinBtn.disabled = false;
        nameInput.disabled = false;
        if (errorText) {
            errorText.innerText = payload.message;
            errorText.style.display = 'block';
        }
    });

    socket.on('lobby_update', (payload) => {
        const list = document.getElementById('player-list');
        if (list && payload.players) {
            list.innerHTML = payload.players
                .map((p) => `<li><span style="color:${p.color}; font-size: 1.2em;">●</span> ${p.name}</li>`)
                .join('');

            // If we are already in the lobby (returning from a game), lock the join UI
            const me = payload.players.find(p => p.id === socket.id);
            if (me) {
                nameInput.value = me.name;
                nameInput.disabled = true;
                joinBtn.disabled = true;
                if (errorText) errorText.style.display = 'none';
            }

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