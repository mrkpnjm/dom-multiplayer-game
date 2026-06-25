// client/sounds.js

// Preload the audio objects so there is no delay when playing
const sounds = {
    start: new Audio('/assets/sounds/start.mp3'),
    eat: new Audio('/assets/sounds/eat.mp3'),
    die: new Audio('/assets/sounds/die.mp3'),
    gameOver: new Audio('/assets/sounds/game-over.mp3'),
    background: new Audio('/assets/sounds/background.mp3'), // ---> NEW: Background music track
};

// Optional: Adjust volumes if some files are too loud
sounds.start.volume = 0.5;
sounds.eat.volume = 0.8;
sounds.die.volume = 0.6;
sounds.gameOver.volume = 0.5;
sounds.background.volume = 0.3;
sounds.background.loop = true;

// We still need an init function triggered by the "Join" button click.
// Browsers require a user interaction before they allow audio to play.
// We silently play and pause a sound to "unlock" the audio context.
export function initAudio() {
    sounds.eat
        .play()
        .then(() => {
            sounds.eat.pause();
            sounds.eat.currentTime = 0;
        })
        .catch((err) => console.log('Audio unlock failed until further interaction:', err));
}

// --- The Sound Effects Library ---

export function playStartSound() {
    sounds.start.currentTime = 0; // Rewind to start just in case
    sounds.start.onended = () => {
        playBackgroundMusic();
    };
        sounds.start.play().catch((e) => {
            console.error(e);
            // Fallback: If start sound gets blocked, try to play the music anyway
            playBackgroundMusic();
    });
}

export function playEatFoodSound() {
    sounds.eat.currentTime = 0;
    sounds.eat.play().catch((e) => console.error(e));
}

export function playDieSound() {
    sounds.die.currentTime = 0;
    sounds.die.play().catch((e) => console.error(e));
}

export function playGameOverSound() {
    sounds.gameOver.currentTime = 0;
    sounds.gameOver.play().catch((e) => console.error(e));
}

export function playBackgroundMusic() {
    // If the game starts before the user interacts (unlikely, but possible), catch the error gracefully
    sounds.background.play().catch((e) => console.log('BGM play blocked by browser, waiting for user interaction...'));
}

export function stopBackgroundMusic() {
    sounds.background.pause();
    sounds.background.currentTime = 0;
}

let isMuted = false;

export function toggleMute() {
    isMuted = !isMuted;
    
    // Loop through every sound in our 'sounds' object and mute/unmute them
    Object.values(sounds).forEach((audioElement) => {
        audioElement.muted = isMuted;
    });

    return isMuted;
}