// Dependencies
const express = require('express');
const createHttpServer = require('http').createServer;
const createIo = require('socket.io');
const createPeerServer = require('peer').ExpressPeerServer;

// Environment
const port = process.env.PORT || 8080;

createIo.set('close timeout', 5);
createIo.set('heartbeat timeout', 15);

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
const channels = [];

// thanks http://stackoverflow.com/a/11301464/4603498
var selectedChannelIndex = 0;
function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i].length > max) {
            maxIndex = i;
            max = arr[i].length;
        }
    }

    return maxIndex;
}

peerServer.on('connection', (key) => {
    if (channels.length == 0) {
        channels.push([key]);
        selectedChannelIndex = 0;
    } else {
        // thanks http://stackoverflow.com/a/18277862/4603498
        var minChannelIndex = indexOfMax(channels);

        if (channels[minChannelIndex].length > 10) {
            channels.push([]);
            selectedChannelIndex = channels.length + 1;
        }

        channels[selectedChannelIndex].push(key);

    }
    console.log('connected', key);

    io.emit('keys', channels[selectedChannelIndex]);
});

var searchIndexes;
function getIndexByKey(searchKey) {

    channels.forEach(function(channel, channelIndex) {
        channel.forEach(function(key, keyIndex) {
            if (key == searchKey) {
                searchIndexes = [channelIndex, keyIndex]
            }
        });
    });

}

peerServer.on('disconnect', (key) => {
    var currentChannel = [];

    getIndexByKey(key);

    channels[searchIndexes[0]].splice(searchIndexes[1], 1);

    console.log('disconnect', key);

    io.emit('keys', channels[searchIndexes[0]]);
});
