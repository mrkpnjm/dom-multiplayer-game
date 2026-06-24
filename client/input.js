const pressedKeys = new Set();
let lastSentIntent = null;

const getTurningIntent = () => {
    const left = pressedKeys.has('ArrowLeft');
    const right = pressedKeys.has('ArrowRight');

    if (left && right) return null;
    if (left) return 'left';
    if (right) return 'right';
    return null;
};

const sendIntentIfChanged = (socket) => {
    const intent = getTurningIntent();
    if (intent !== lastSentIntent) {
        socket.emit('input', { turning: intent });
        lastSentIntent = intent;
    }
};

export const init = (socket) => {
    const handleKeyDown = (event) => {
        if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
            event.preventDefault();
        }
        pressedKeys.add(event.code);
        sendIntentIfChanged(socket);
    };

    const handleKeyUp = (event) => {
        if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
            event.preventDefault();
        }
        pressedKeys.delete(event.code);
        sendIntentIfChanged(socket);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
};
