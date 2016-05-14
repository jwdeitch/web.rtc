// Dependencies
const express = require('express');
const createHttpServer = require('http').createServer;
const createIo = require('socket.io');
const createPeerServer = require('peer').ExpressPeerServer;

// Environment
const port = process.env.PORT || 8080;

// Routes
const app = express();
const httpServer = createHttpServer(app);
const io = createIo(httpServer);
const peerServer = createPeerServer(httpServer);

app.use('/api', peerServer);
app.use(express.static(__dirname));

// Boot
httpServer.listen(port, () => {
    console.log(`Boot on http://localhost:${port}`);
});

io.sockets.on('connection', function (socket) {
    var address = socket.handshake.address;
    console.log('New connection from ' + address.address + ':' + address.port);
});

io.sockets.on('disconnect', function (socket) {
    var address = socket.handshake.address;
    console.log('Lost connection from ' + address.address + ':' + address.port);
});

// Manage p2p keys
const keys = [];
peerServer.on('connection', (key) => {
    keys.push(key);

    console.log('connected', key);

    io.emit('keys', keys);
});

peerServer.on('disconnect', (key) => {
    const index = keys.indexOf(key);
    if (index > -1) {
        keys.splice(index, 1);
    }
    console.log('disconnect', key);

    io.emit('keys', keys);
});
