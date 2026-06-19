// client/sounds.js

// Preload the audio objects so there is no delay when playing
const sounds = {
    start: new Audio('/assets/sounds/start.mp3'),
    eat: new Audio('/assets/sounds/eat.mp3'),
    die: new Audio('/assets/sounds/die.mp3'),
    gameOver: new Audio('/assets/sounds/game-over.mp3')
};

// Optional: Adjust volumes if some files are too loud
sounds.start.volume = 0.5;
sounds.eat.volume = 0.3;
sounds.die.volume = 0.6;
sounds.gameOver.volume = 0.5;

// We still need an init function triggered by the "Join" button click.
// Browsers require a user interaction before they allow audio to play.
// We silently play and pause a sound to "unlock" the audio context.
export function initAudio() {
    sounds.eat.play().then(() => {
        sounds.eat.pause();
        sounds.eat.currentTime = 0;
    }).catch(err => console.log("Audio unlock failed until further interaction:", err));
}

// --- The Sound Effects Library ---

export function playStartSound() {
    sounds.start.currentTime = 0; // Rewind to start just in case
    sounds.start.play().catch(e => console.error(e));
}

export function playEatFoodSound() {
    sounds.eat.currentTime = 0;
    sounds.eat.play().catch(e => console.error(e));
}

export function playDieSound() {
    sounds.die.currentTime = 0;
    sounds.die.play().catch(e => console.error(e));
}

export function playGameOverSound() {
    sounds.gameOver.currentTime = 0;
    sounds.gameOver.play().catch(e => console.error(e));
}