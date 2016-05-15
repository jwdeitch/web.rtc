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
const channels = [];

peerServer.on('connection', (key) => {

    if (channels.length == 0) {
        channels.push([key]);
    } else {
        // thanks http://stackoverflow.com/a/18277862/4603498
        var minChannelIndex = function () {
            for (var i = 1; i < channels.length; i++) {
                if (channels[shortestIndex].length > channels[i].length)
                    return i;
            }
        };

        var selectedChannelIndex = 0;

        console.log(minChannelIndex);

        if (channels[minChannelIndex].length > 20) {
            channels.push([]);
            selectedChannelIndex = channels.length + 1;
        }

        channels[selectedChannelIndex].push(key);

    }

    console.log('connected', key);

    io.emit('keys', channels[selectedChannelIndex]);
});

peerServer.on('disconnect', (key) => {
    var currentChannel = [];
    var index = channels.forEach(function(channel, channelIdex){
       channel.forEach(function(keyIndex,index){
           if (key == keyIndex) {
               currentChannel = channelIdex;
               return index;
           }
       });
    });

    if (index > -1) {
        keys.splice(index, 1);
    }
    console.log('disconnect', key);

    io.emit('keys', channels[currentChannel]);
});
