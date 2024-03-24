const { WebSocketServer } = require('ws');
const sockserver = new WebSocketServer({ port: 443 });
const { Chess } = require('chess.js')

let connectedClients = 0;

sockserver.on('connection', ws => {
    let chess = new Chess();
    const data = {
        gameInProgress: false, // Game can not be in progress if game is over or not 2 players
        waiting: true, // Waiting if there are not 2 players
        ascii: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
        fen: chess.ascii()
    };

    if (connectedClients >= 2) {
        ws.send('Game in progress already.')
        ws.close();
        return;
    }

    connectedClients++;
    if (connectedClients == 1) {
        const jsonData = JSON.stringify(data);
        ws.send(jsonData);
    }



    // Send the message across
    ws.on('message', (message) => {
        sockserver.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                // TODO: handle logic to update the json data and send it
                client.send(message);
            }
            else if (client === ws) {
                // TODO: Handle logic to let the user know they are waiting on their opponents move
                client.send(message);
            }
        })
    });


    ws.on('close', () => {
        connectedClients--;
        console.log('Client disconnected');
    });

    console.log("New client connected");  
    console.log(`Current number of clients: ${connectedClients}`);
})