const pressedKeys = new Set();
let lastSentIntent = null;
let isInitialized = false; // Safety lock to prevent duplicate listeners

const getTurningIntent = () => {
    // Support both Arrow Keys and WASD!
    const left = pressedKeys.has('ArrowLeft') || pressedKeys.has('KeyA');
    const right = pressedKeys.has('ArrowRight') || pressedKeys.has('KeyD');
    
    // If they press both at the same time, go straight
    if (left && right) return null;
    if (left) return 'left';
    if (right) return 'right';
    return null;
};

const sendIntentIfChanged = (socket) => {
    const intent = getTurningIntent();
    
    // Only spam the server if we actually changed directions
    if (intent !== lastSentIntent) {
        socket.emit('input', { turning: intent });
        lastSentIntent = intent;
    }
};

export const init = (socket) => {
    // If the router already set up the keyboard, don't do it again!
    if (isInitialized) return; 
    isInitialized = true;

    const handleKeyDown = (event) => {
        // Prevent the browser window from scrolling when pressing arrows
        if (['ArrowRight', 'ArrowLeft', 'KeyA', 'KeyD'].includes(event.code)) {
            event.preventDefault();
        }
        pressedKeys.add(event.code);
        sendIntentIfChanged(socket);
    };

    const handleKeyUp = (event) => {
        if (['ArrowRight', 'ArrowLeft', 'KeyA', 'KeyD'].includes(event.code)) {
            event.preventDefault();
        }
        pressedKeys.delete(event.code);
        sendIntentIfChanged(socket);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
};