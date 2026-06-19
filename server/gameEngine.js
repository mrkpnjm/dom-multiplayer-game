export const GRID_SIZE = 30;
export const TICK_INTERVAL = 150;

const GAME_DURATION = 120;

const STARTING_POSITIONS = [
    { x: 5,  y: 15, direction: 'RIGHT' },
    { x: 24, y: 15, direction: 'LEFT'  },
    { x: 15, y: 5,  direction: 'DOWN'  },
    { x: 15, y: 24, direction: 'UP'    },
];

const OPPOSITES = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

const MOVES = {
    UP:    { dx:  0, dy: -1 },
    DOWN:  { dx:  0, dy:  1 },
    LEFT:  { dx: -1, dy:  0 },
    RIGHT: { dx:  1, dy:  0 },
};

function createSnake({ x, y, direction }) {
    const { dx, dy } = MOVES[OPPOSITES[direction]];
    return [
        { x,             y             },
        { x: x + dx,     y: y + dy     },
        { x: x + dx * 2, y: y + dy * 2 },
    ];
}

function spawnFood(snakes) {
    const occupied = new Set(
        Object.values(snakes).flat().map(({ x, y }) => `${x},${y}`)
    );

    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
    } while (occupied.has(`${pos.x},${pos.y}`));

    return pos;
}

export function createGameState(players) {
    const snakes = {};
    const directions = {};
    const alive = {};
    const scores = {};

    players.forEach((player, i) => {
        const start = STARTING_POSITIONS[i];
        snakes[player.id] = createSnake(start);
        directions[player.id] = start.direction;
        alive[player.id] = true;
        scores[player.id] = 0;
    });

    return {
        snakes,
        directions,
        alive,
        scores,
        food: spawnFood(snakes),
        timer: GAME_DURATION,
    };
}

export function setDirection(state, playerId, direction) {
    if (!state.alive[playerId]) return;
    if (OPPOSITES[state.directions[playerId]] === direction) return;
    state.directions[playerId] = direction;
}

export function tick(state) {
    const died = [];

    const newHeads = {};
    for (const [id, snake] of Object.entries(state.snakes)) {
        if (!state.alive[id]) continue;
        const { x, y } = snake[0];
        const { dx, dy } = MOVES[state.directions[id]];
        newHeads[id] = { x: x + dx, y: y + dy };
    }

    for (const [id, head] of Object.entries(newHeads)) {
        if (!state.alive[id]) continue;

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            state.alive[id] = false;
            died.push(id);
            continue;
        }

        for (const [otherId, snake] of Object.entries(state.snakes)) {
            if (!state.alive[otherId] && otherId !== id) continue;
            const body = otherId === id ? snake.slice(1) : snake;
            if (body.some(seg => seg.x === head.x && seg.y === head.y)) {
                state.alive[id] = false;
                died.push(id);
                break;
            }
        }
    }

    const aliveEntries = Object.entries(newHeads).filter(([id]) => state.alive[id]);
    for (let i = 0; i < aliveEntries.length; i++) {
        for (let j = i + 1; j < aliveEntries.length; j++) {
            const [idA, hA] = aliveEntries[i];
            const [idB, hB] = aliveEntries[j];
            if (hA.x === hB.x && hA.y === hB.y) {
                state.alive[idA] = false;
                state.alive[idB] = false;
                if (!died.includes(idA)) died.push(idA);
                if (!died.includes(idB)) died.push(idB);
            }
        }
    }

    for (const [id, snake] of Object.entries(state.snakes)) {
        if (!state.alive[id]) continue;
        const head = newHeads[id];
        const ateFood = head.x === state.food.x && head.y === state.food.y;

        snake.unshift(head);
        if (ateFood) {
            state.scores[id]++;
            state.food = spawnFood(state.snakes);
        } else {
            snake.pop();
        }
    }

    const alivePlayers = Object.keys(state.alive).filter(id => state.alive[id]);

    if (alivePlayers.length <= 1) {
        const winnerId = alivePlayers.length === 1 ? alivePlayers[0] : getWinner(state);
        return { died, gameOver: true, winnerId };
    }

    return { died, gameOver: false, winnerId: null };
}

export function getWinner(state) {
    const alive = Object.entries(state.alive).filter(([, isAlive]) => isAlive);
    if (alive.length === 1) return alive[0][0];
    return Object.entries(state.scores).sort(([, a], [, b]) => b - a)[0][0];
}
