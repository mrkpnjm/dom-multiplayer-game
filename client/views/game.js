import { playDieSound, playEatFoodSound } from '../sounds.js';

export function renderGame(container, socket, navigate) {
    // 1. Inject the HTML
    container.innerHTML = `
        <div id="game-screen" class="screen">
            <div id="board"></div> 
            
            <div id="hud">
                <div id="timer">00:00</div>
                <div id="scoreboard"></div>
            </div>

            <button id="pause-btn">Pause</button>

            <div id="pause-menu" class="hidden">
                <h2>Game Paused</h2>
                <p id="pause-message"></p>
                <button id="resume-btn">Resume</button>
                <button id="quit-btn">Quit</button>
            </div>
        </div>
    `;

    // 2. Dynamically import Person B's scripts ONLY when the game screen loads
    import('../renderer.js')
        .then((rendererModule) => rendererModule.init(socket))
        .catch((err) => console.error('Failed to load renderer', err));

    import('../input.js')
        .then((inputModule) => inputModule.init(socket))
        .catch((err) => console.error('Failed to load input', err));

    // 3. Handle Game UI Logic
    const pauseMenu = document.getElementById('pause-menu');
    const pauseMessage = document.getElementById('pause-message');

    // --- Outgoing Player Actions ---
    document.getElementById('pause-btn').addEventListener('click', () => {
        socket.emit('pause', { name: 'You' }); // Person A will handle finding the real name
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
        socket.emit('resume', { name: 'You' });
    });

    document.getElementById('quit-btn').addEventListener('click', () => {
        socket.emit('quit', { name: 'You' });
        navigate('lobby');
    });

    // --- Incoming Server Events ---
    socket.on('game_paused', (payload) => {
        if (pauseMenu) pauseMenu.classList.remove('hidden');
        if (pauseMessage) pauseMessage.innerText = `${payload.name} paused the game.`;
    });

    socket.on('game_resumed', () => {
        if (pauseMenu) pauseMenu.classList.add('hidden');
    });

    // Trigger the sound effect when someone dies
    socket.on('player_died', (payload) => {
        playDieSound();
        console.log(`${payload.name} has died!`);
    });

    // Trigger the eat sound
    socket.on('food_eaten', () => {
        playEatFoodSound();
    });

    // Update HUD when server ticks
    // Notice the fixed inline JSDoc import below!
    socket.on(
        'game_state',
        /** @param {import('../ui.js').GameStatePayload} payload */ (payload) => {
            const timer = document.getElementById('timer');
            const scoreboard = document.getElementById('scoreboard');

            if (timer) timer.innerText = payload.timer.toString();

            // Example logic to render the scoreboard dynamically
            if (scoreboard && payload.scores) {
                scoreboard.innerHTML = payload.scores
                    .map(
                        (p) =>
                            `<div><span style="color:${p.color}">●</span> ${p.name}: ${p.score}</div>`,
                    )
                    .join('');
            }
        },
    );
}
