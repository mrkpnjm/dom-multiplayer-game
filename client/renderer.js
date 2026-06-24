// game_state payload (from server, every 50ms):
// {
//   snakes: { [id]: { segments: [{x,y}, ...], angle } },  // segments[0] = head
//   food:   [ {x,y}, ... ],
//   scores: [ { id, name, color, score }, ... ],           // color lives here
//   timer:  number,                                        // seconds, counts down
//   alive:  { [id]: boolean }
// }
// Coordinates are in 1600x900 space = board pixels (no scaling needed).
// Server tick = 50ms (20 Hz).

let previousState = null;
let currentState = null;
let previousTimestamp = 0;
let currentTimestamp = 0;
const TICK_INTERVAL = 50; // Must match Server's constant, in ms, matches 20 Hz

let board = null;

const segmentsMap = new Map(); // Map<snakeId, div[]>

const positionDiv = (element, position) => {
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
};

const getSegment = (snakeId, segmentIndex) => {
    if (!segmentsMap.has(snakeId)) {
        segmentsMap.set(snakeId, []);
    }

    const snakeSegments = segmentsMap.get(snakeId);

    // Create divs until the array is long enough to hold segmentIndex.
    while (snakeSegments.length <= segmentIndex) {
        const newDiv = document.createElement('div');
        newDiv.className = 'segment';
        board.appendChild(newDiv);
        snakeSegments.push(newDiv);
    }

    const segment = snakeSegments[segmentIndex];

    segment.classList.remove('hidden');

    return segment;
};

const hideSegments = (snakeId, segmentsInUse) => {
    const snakeSegments = segmentsMap.get(snakeId);
    if (!snakeSegments) return;

    for (let i = segmentsInUse; i < snakeSegments.length; i++) {
        snakeSegments[i].classList.add('hidden');
    }
};

const removeSnake = (snakeId) => {
    const snakeSegments = segmentsMap.get(snakeId);
    if (!snakeSegments) return;

    snakeSegments.forEach((div) => div.remove());
    segmentsMap.delete(snakeId);
};

export const init = (socket) => {
    board = document.getElementById('board');

    socket.on('game_state', (state) => {
        previousState = currentState;
        previousTimestamp = currentTimestamp;
        currentState = state;
        currentTimestamp = performance.now();

        if (previousState === null) {
            previousState = currentState;
            previousTimestamp = currentTimestamp;
        }
    });
};
