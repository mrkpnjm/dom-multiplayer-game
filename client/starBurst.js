// client/starBurst.js
//
// Renders the end-of-game result animation: an irregular starburst overlay,
// centered on the board, that blinks between two color states 3 times, then
// holds on the first state for 5 seconds before running a completion callback
// (used to route the player to the Game Over screen).
//
// State 1: red border, yellow fill, black text.
// State 2: yellow border, red fill, black text.
//
// The blink/hold runs purely on timers, fully decoupled from the renderer's
// requestAnimationFrame loop and the server's 20 Hz tick.

const BLINK_MS = 250;
const HOLD_MS = 5000;
const TOTAL_BLINKS = 6;

let activeBurst = null;
let burstHandlingExit = false;
let gameOverHandler = null;

// Tell ui.js whether the burst is in charge of leaving the game view, so it
// doesn't navigate to Game Over and wipe the board mid-animation.
export const setBurstHandlingExit = (handlingExitValue) => {
    burstHandlingExit = handlingExitValue;
}

export const isBurstHandlingExit = () => {
    return burstHandlingExit;
}

// The game view registers its game_over handler here so ui.js's single global
// game_over listener can relay the payload in, without the game view adding a
// second socket listener that would stack across rounds.
export const registerGameOverHandler = (f) => {
    gameOverHandler = f;
}

// Called by ui.js when game_over fires. Returns true if the game view handled
// it (so ui.js knows to skip its own navigation), false if nothing is registered.
export const relayGameOver = (payload) => {
    if (gameOverHandler) {
        gameOverHandler(payload);
        return true;
    }
    return false;
}

// Reset all module-level state between rounds (called on start_game and quit)
// so leftover flags, a stale handler, or a lingering burst can't leak into the
// next game.
export const resetStarBurst = () => {
    burstHandlingExit = false;
    gameOverHandler = null;
    if (activeBurst) {
        activeBurst.remove();
        activeBurst = null;
    }
}

// Build an irregular starburst as a CSS clip-path polygon string. Walks around
// a circle alternating between an outer radius (spikes) and inner radius
// (valleys), jittering each point inward by a random amount so the star looks
// hand-drawn. Generated once per burst so the spikes don't flicker each frame.
const makeStarBurst = (spikes = 12, irregularity = 0.5) => {
    const points = [];
    const step = (2 * Math.PI) / (spikes * 2);

    for (let i = 0; i < spikes * 2; i++) {
        const isOuter = i % 2 === 0;
        let radius = isOuter ? 50 : 27;
        radius *= 1 - Math.random() * irregularity;

        const angle = i * step - Math.PI / 2;

        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    }
    const joined = points.join(", ");
    return `polygon(${joined})`;
}

/**
 * Show the end-of-game burst.
 * @param {string} text - the result message, e.g. "You win!" or "You lose!"
 * @param {Function} onComplete - run once after the blink + 5s hold finishes
 */
export const showStarBurst = (text, onComplete) => {
    if (activeBurst) return;

    const board = document.getElementById('board');
    if (!board) {
        if (onComplete) onComplete();
        return;
    }

    const burstDiv = document.createElement('div');
    burstDiv.classList.add('star-burst');
    burstDiv.textContent = text;
    burstDiv.style.clipPath = makeStarBurst();
    board.appendChild(burstDiv);
    activeBurst = burstDiv;

    const applyState = (number) => {
        burstDiv.classList.toggle('state-1', number === 1);
        burstDiv.classList.toggle('state-2', number === 2);
    }

    let counter = 0;
    applyState(1);
    const intervalId = setInterval(() => {
        counter++;
        if (counter >= TOTAL_BLINKS) {
            clearInterval(intervalId);
            applyState(1);
            setTimeout(() => {
                burstDiv.remove();
                activeBurst = null;
                if (onComplete) onComplete();
            }, HOLD_MS);
            return;
        }
        else {
            applyState(counter % 2 === 0 ? 1 : 2);
        }
    }, BLINK_MS);
}

