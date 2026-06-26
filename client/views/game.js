import { 
    playStartSound,
    playDieSound, 
    playEatFoodSound,
    stopBackgroundMusic,
    toggleMute 
} from '../sounds.js';

import {
    showStarBurst,
    setBurstHandlingExit,
    registerGameOverHandler,
    resetStarBurst
} from '../starBurst.js';

export function renderGame(container, socket, navigate) {
    // 1. Inject the HTML with the countdown overlay
    container.innerHTML = `
        <div id="game-screen" class="screen" style="position: relative;">
            
            <div id="countdown-overlay" style="
                position: absolute; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%); 
                font-size: 5rem; 
                color: #ff8c00; 
                text-shadow: 0 0 30px #ff8c00; 
                font-weight: bold; 
                z-index: 1000; 
                pointer-events: none;
            "></div>

            <div id="board"></div> 
            
            <div id="hud">
                <div id="timer">00:00</div>
                <div id="scoreboard"></div>
            </div>

            <div id="controls" style="display: flex; justify-content: center; gap: 10px;">
                <button id="pause-btn">Pause</button>
                <button id="mute-btn">Mute</button>
            </div>

            <div id="pause-menu" class="hidden">
                <h2>Game Paused</h2>
                <p id="pause-message"></p>
                <button id="resume-btn">Resume</button>
                <button id="quit-btn">Quit</button>
            </div>
        </div>
    `;

    // Start background music as soon as the game screen loads
    playStartSound();

    // Run the visual countdown synced to 1 second (1000ms) beats
    const overlay = document.getElementById('countdown-overlay');
    const countdownSteps = ['3', '2', '1', 'GO!'];
    let stepIndex = 0;

    // Show the first number immediately
    if (overlay) {
        overlay.innerText = countdownSteps[stepIndex];
    }

    // Update every second to match the traffic light sound
    const countdownInterval = setInterval(() => {
        stepIndex++;
        
        if (stepIndex < countdownSteps.length) {
            if (overlay) {
                overlay.innerText = countdownSteps[stepIndex];
                // Optional: Add a CSS animation class here if you want it to "pulse"
                overlay.style.animation = 'none';
                setTimeout(() => overlay.style.animation = '', 10); // Trigger reflow to restart animation
            }
        } else {
            // End of countdown
            clearInterval(countdownInterval);
            if (overlay) overlay.style.display = 'none'; // Hide the text
        }
    }, 1000);

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
    const muteBtn = document.getElementById('mute-btn');
    // --- End-of-game result burst state ---
    let myName = null;
    let burstStarted = false;
    let pendingGameOver = null;

    // Learn this client's own name by matching socket.id against the scores list.
    // Runs every tick but short-circuits once resolved.
    const resolveMyName = (scoresArray) => {
        if (myName || !scoresArray) return;

        const me = scoresArray.find((p) => p.id === socket.id);
        if (me) myName = me.name;
    }

    // Navigate to Game Over, but only once the game_over payload exists. A
    // mid-game loser starts their burst before the round ends, so if the
    // payload hasn't arrived yet, poll briefly until it does, then navigate.
    const navigateWhenReady = () => {
        if (pendingGameOver) {
            navigate('game_over', pendingGameOver);
        } else {
            const intervalId = setInterval(() => {
                if (pendingGameOver) {
                    clearInterval(intervalId);
                    navigate('game_over', pendingGameOver);
                }
            }, 50);
        };
    }

    // Handles game_over for this client. Stops the music and stashes the payload.
    // If a burst is already running (this client died, lose burst is up) we leave
    // it be. Otherwise we pick win vs lose from the winner name in the payload —
    // this covers the timer-runs-out case where nobody died, so "didn't die"
    // alone can't tell winner from loser.
    const handleGameOver = (payload) => {
        stopBackgroundMusic();

        pendingGameOver = payload;
        if (burstStarted) return;

        burstStarted = true;
        setBurstHandlingExit(true);
        if (payload.winner === myName) {
            showStarBurst('You win!', () => {
                navigateWhenReady();
            })
        } else {
            showStarBurst('You lose!', () => {
                navigateWhenReady();
            })
        }
    }

    // --- Outgoing Player Actions ---
    document.getElementById('pause-btn').addEventListener('click', () => {
        socket.emit('pause', { name: 'You' }); 
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
        socket.emit('resume', { name: 'You' });
    });

    document.getElementById('quit-btn').addEventListener('click', () => {
        socket.emit('quit', { name: 'You' });
        resetStarBurst(); // clear burst state so a mid-game quit doesn't leak into the next round
        stopBackgroundMusic(); 
        navigate('lobby');
    });

    // Mute Button Listener
    muteBtn.addEventListener('click', () => {
        const currentlyMuted = toggleMute();
        muteBtn.innerText = currentlyMuted ? 'Unmute' : 'Mute';
    });

    // --- Incoming Server Events ---
    socket.on('game_paused', (payload) => {
        if (pauseMenu) pauseMenu.classList.remove('hidden');
        if (pauseMessage) pauseMessage.innerText = `${payload.name} paused the game.`;
    });

    socket.on('game_resumed', () => {
        if (pauseMenu) pauseMenu.classList.add('hidden');
    });

    // Play the die sound for every death; if it was MY snake, run the lose burst.
    socket.on('player_died', (payload) => {
        playDieSound();
        console.log(`${payload.name} has died!`);

        if (payload.name === myName && !burstStarted) {
            burstStarted = true;
            setBurstHandlingExit(true);
            showStarBurst('You lose!', () => {
                navigateWhenReady();
            })
        }
    });

    // Trigger the eat sound
    socket.on('food_eaten', () => {
        playEatFoodSound();
    });

    // Hand our game_over logic to ui.js's relay instead of binding a socket listener.
    registerGameOverHandler(handleGameOver);

    // Update HUD when server ticks
    socket.on(
        'game_state',
        /** @param {import('../ui.js').GameStatePayload} payload */ (payload) => {
            resolveMyName(payload.scores);
            const timer = document.getElementById('timer');
            const scoreboard = document.getElementById('scoreboard');

            if (timer) timer.innerText = payload.timer.toString();

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