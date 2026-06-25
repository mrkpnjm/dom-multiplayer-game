export const PLANE_WIDTH = 1600;
export const PLANE_HEIGHT = 900;
export const SEGMENT_SIZE = 20;
export const TICK_INTERVAL = 50;

const SNAKE_SPEED = 10;
const TRAIL_SPACING = SEGMENT_SIZE / SNAKE_SPEED; // 2 trail entries per visible segment
const TURN_SPEED = 7; // degrees per tick
const INITIAL_LENGTH = 5;
const SAFE_TAIL = TRAIL_SPACING * 10; // head can't hit first 10 body segments (self-collision)
const FOOD_COUNT = 5;
const GAME_DURATION = 120;

const STARTING_POSITIONS = [
    { x: 200, y: 450, angle: 0 },
    { x: 1400, y: 450, angle: 180 },
    { x: 800, y: 150, angle: 90 },
    { x: 800, y: 750, angle: 270 },
];

function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function createSnake({ x, y, angle }) {
    const rad = (angle * Math.PI) / 180;
    const trail = [];
    for (let i = 0; i < INITIAL_LENGTH * TRAIL_SPACING; i++) {
        trail.push({
            x: x - Math.cos(rad) * i * SNAKE_SPEED,
            y: y - Math.sin(rad) * i * SNAKE_SPEED,
        });
    }
    return { x, y, angle, trail, length: INITIAL_LENGTH };
}

function spawnFood(snakes) {
    const margin = SEGMENT_SIZE * 3;
    const allTrail = Object.values(snakes).flatMap((s) => s.trail);

    let pos;
    let tries = 0;
    do {
        pos = {
            x: margin + Math.random() * (PLANE_WIDTH - margin * 2),
            y: margin + Math.random() * (PLANE_HEIGHT - margin * 2),
        };
        tries++;
    } while (tries < 30 && allTrail.some((seg) => dist(pos, seg) < SEGMENT_SIZE * 2));

    return pos;
}

export function createGameState(players) {
    const snakes = {};
    const alive = {};
    const scores = {};

    players.forEach((player, i) => {
        snakes[player.id] = createSnake(STARTING_POSITIONS[i]);
        alive[player.id] = true;
        scores[player.id] = 0;
    });

    const food = Array.from({ length: FOOD_COUNT }, () => spawnFood(snakes));

    return { snakes, alive, scores, food, timer: GAME_DURATION };
}

export function tick(state, turningMap) {
    const died = [];
    const ateFood = []; // ---> NEW: Tracker for food eaten this frame

    for (const [id, snake] of Object.entries(state.snakes)) {
        if (!state.alive[id]) continue;

        const turning = turningMap.get(id);
        if (turning === 'left') snake.angle = (snake.angle - TURN_SPEED + 360) % 360;
        if (turning === 'right') snake.angle = (snake.angle + TURN_SPEED) % 360;

        const rad = (snake.angle * Math.PI) / 180;
        snake.x += Math.cos(rad) * SNAKE_SPEED;
        snake.y += Math.sin(rad) * SNAKE_SPEED;
        snake.trail.unshift({ x: snake.x, y: snake.y });
        snake.trail = snake.trail.slice(0, (snake.length + 1) * TRAIL_SPACING);
    }

    for (const [id, snake] of Object.entries(state.snakes)) {
        if (!state.alive[id]) continue;

        if (snake.x < 0 || snake.x > PLANE_WIDTH || snake.y < 0 || snake.y > PLANE_HEIGHT) {
            state.alive[id] = false;
            died.push(id);
            continue;
        }

        for (const [otherId, otherSnake] of Object.entries(state.snakes)) {
            if (!state.alive[otherId] && otherId !== id) continue;
            const trailStart = otherId === id ? SAFE_TAIL : 0;
            const body = otherSnake.trail.slice(trailStart);

            if (body.some((seg) => dist({ x: snake.x, y: snake.y }, seg) < SEGMENT_SIZE)) {
                state.alive[id] = false;
                died.push(id);
                break;
            }
        }
    }

    // Food collision logic
    for (const [id, snake] of Object.entries(state.snakes)) {
        if (!state.alive[id]) continue;

        for (let fi = state.food.length - 1; fi >= 0; fi--) {
            if (dist({ x: snake.x, y: snake.y }, state.food[fi]) < SEGMENT_SIZE * 1.5) {
                state.scores[id]++;
                snake.length++;
                state.food.splice(fi, 1);
                state.food.push(spawnFood(state.snakes));
                ateFood.push(id); // Record that this snake ate food
            }
        }
    }

    const alivePlayers = Object.keys(state.alive).filter((id) => state.alive[id]);
    if (alivePlayers.length <= 1) {
        // Include ateFood in the return payload
        return { died, ateFood, gameOver: true, winnerId: alivePlayers[0] ?? getWinner(state) };
    }

    // Include ateFood in the return payload
    return { died, ateFood, gameOver: false, winnerId: null };
}

export function getWinner(state) {
    const alive = Object.entries(state.alive).filter(([, a]) => a);
    if (alive.length === 1) return alive[0][0];
    return Object.entries(state.scores).sort(([, a], [, b]) => b - a)[0][0];
}

export function getSegments(snake) {
    return Array.from({ length: snake.length }, (_, i) => {
        return snake.trail[i * TRAIL_SPACING] ?? snake.trail.at(-1);
    });
}