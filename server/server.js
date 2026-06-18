import express from 'express';
import http from 'http';
import { dirname, join } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(join(__dirname, '..', 'client')));

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a player connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('a player disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});