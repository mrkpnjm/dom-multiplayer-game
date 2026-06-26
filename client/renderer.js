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
let currentTimestamp = 0;
const TICK_INTERVAL = 50;

let board = null;
const segmentsMap = new Map(); // Map<snakeId, div[]>
let isLooping = false; // Safety lock for the animation loop

const positionDiv = (element, position) => {
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
};

const getSegment = (snakeId, segmentIndex, className = 'segment', color = null) => {
    if (!segmentsMap.has(snakeId)) {
        segmentsMap.set(snakeId, []);
    }

    const snakeSegments = segmentsMap.get(snakeId);

    // Create divs until the array is long enough
    while (snakeSegments.length <= segmentIndex) {
        const newDiv = document.createElement('div');
        newDiv.className = className;
        
        // Apply the unique player color!
        if (color) {
            newDiv.style.backgroundColor = color;
            newDiv.style.color = color;
        };
        
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

const lerp = (startValue, endValue, t) => startValue + (endValue - startValue) * t;

const draw = (alpha) => {
    if (!currentState || !board) return;

    // Clean up ghost snakes that died or quit
    for (const snakeId of segmentsMap.keys()) {
        if (snakeId !== '__food__' && (!currentState.snakes[snakeId] || !currentState.alive[snakeId])) {
            removeSnake(snakeId);
        }
    }

    for (const [snakeId, snakeData] of Object.entries(currentState.snakes)) {
        if (!currentState.alive[snakeId]) continue; // Skip rendering dead snakes

        const segments = snakeData.segments;
        
        // Find the player's color from the scoreboard data
        const playerInfo = currentState.scores.find(p => p.id === snakeId);
        const color = playerInfo ? playerInfo.color : 'black';

        for (let i = 0; i < segments.length; i++) {
            const prevSnake = previousState.snakes[snakeId];
            const currPos = segments[i];
            const prevPos = prevSnake && prevSnake.segments[i] ? prevSnake.segments[i] : currPos;

            const dx = currPos.x - prevPos.x;
            const dy = currPos.y - prevPos.y;
            const segmentAlpha = Math.abs(dx) > 100 || Math.abs(dy) > 100 ? 1 : alpha;

            positionDiv(getSegment(snakeId, i, 'segment', color), {
                x: lerp(prevPos.x, currPos.x, segmentAlpha),
                y: lerp(prevPos.y, currPos.y, segmentAlpha),
            });
        }
        hideSegments(snakeId, segments.length);
    }

    const food = currentState.food;
    for (let i = 0; i < food.length; i++) {
        positionDiv(getSegment('__food__', i, 'food'), food[i]);
    }
    hideSegments('__food__', food.length);
};

const loop = (now) => {
    // Only draw if the board is actively in the DOM
    if (board) {
        const alpha = Math.min((now - currentTimestamp) / TICK_INTERVAL, 1);
        draw(alpha);
    }
    requestAnimationFrame(loop);
};

export const init = (socket) => {
    board = document.getElementById('board');
    
    // Completely reset the rendering memory for the new game!
    previousState = null;
    currentState = null;
    segmentsMap.forEach((_, snakeId) => removeSnake(snakeId));
    segmentsMap.clear();
    
    socket.on('game_state', (state) => {
        previousState = currentState;
        currentState = state;
        currentTimestamp = performance.now();

        if (previousState === null) {
            previousState = currentState;
        }
    });

    // Ensure we only start the requestAnimationFrame loop ONCE
    if (!isLooping) {
        isLooping = true;
        requestAnimationFrame(loop);
    }
};
