const socket = io();

socket.on('connect', () => {
    console.log('connected to server, my id is', socket.id);
});

const board = document.getElementById('board');

const segmentsMap = new Map(); // Map<snakeId: [div name]>

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

    const returnableDiv = snakeSegments[segmentIndex];

    returnableDiv.classList.remove('hidden');

    return returnableDiv;
};

const hideSegments = (snakeId, segmentsInUse) => {
    const snakeSegments = segmentsMap.get(snakeId);
    if (!snakeSegments) return ;

    for (let i = segmentsInUse; i < snakeSegments.length; i++) {
        snakeSegments[i].classList.add('hidden');
    }
};

const removeSnakeAfterDisconnect = (snakeId) => {
    const snakeSegments = segmentsMap.get(snakeId);
    if (!snakeSegments) return ;

    snakeSegments.forEach((div) => div.remove());
    segmentsMap.delete(snakeId);
};
