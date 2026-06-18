// @ts-ignore
const socket = io();

socket.on('connect', () => {
    console.log('connected to server, my id is', socket.id);
});