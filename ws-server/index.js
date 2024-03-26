const { WebSocketServer, WebSocket } = require('ws');
const sockserver = new WebSocketServer({ port: 443 });
const { Chess } = require('chess.js')

let connectedClients = 0;

// Returns 0 or 1 (white or black)
function randomizeColor() {
    return Math.floor(Math.random() * 2); 
}

const gameState = {
    player1: {
        color: undefined,
        ws: undefined
    },
    player2: {
        color: undefined,
        ws: undefined
    },
    game: undefined,
}

const data = {
    gameInProgress: false, // Game can not be in progress if game is over or not 2 players
    waiting: true, // Waiting if there are not 2 players
    message: undefined,
};

sockserver.on('connection', ws => {

    // Deny connection if full capacity
    if (connectedClients >= 2) {
        const denyConnectionData = {
            meesage: "Game in progress already."
        }
        const jsonData = JSON.stringify(denyConnectionData);
        ws.send(jsonData);
        ws.close();
        return;
    }

    // Inform client their connection was made
    connectedClients++;
    data.message = "Connected";
    ws.send(JSON.stringify(data));

    // If one player, inform client that they are waiting
    if (connectedClients == 1) {
        data.message = "Waiting for player 2 to connect."
        const jsonData = JSON.stringify(data);
        ws.send(jsonData);
    }
    
    // If 2 players have just entered now let the first player know their opponent connected 
    // Start game play and deal with opponent who was randomly assigned to be White.
    if (connectedClients == 2 && !data.gameInProgress) {
        
        // Initialize colors
        let color1 = randomizeColor() ? "b" : "w";
        let color2 = color1 == "b" ? "w" : "b";
        gameState.game = new Chess();
        data.gameInProgress = true;
        console.log(gameState, color1, color2);

        sockserver.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                data.message = "Player 2 has connected."
                const jsonData = JSON.stringify(data);
                client.send(jsonData);

                gameState.player1.color = color1;
                gameState.player1.ws = client;
                data.message = "Game started!\nWaiting for you opponent to move...";
                data.waiting = true;
                
                if (gameState.player1.color == 'w') { 
                    data.message = "Your move!"
                    data.waiting = false;
                }

                client.send(JSON.stringify(data));
            } 
            else if (client === ws && client.readyState === WebSocket.OPEN) {
                gameState.player2.color = color2;
                gameState.player2.ws = client;
                data.message = "Game started!\nWaiting for you opponent to move...";
                data.waiting = true;
                
                if (gameState.player2.color == 'w') { 
                    data.message = "Your move!"
                    data.waiting = false;
                }
                
                client.send(JSON.stringify(data));
            }

            console.log(gameState);

        })
    }

    // TODO: handle chess gameplay logic: turn management, isStalemate, isCheckmate, isThreefold, etc.
    //          However, start with just finishing a game (isGameOver).
    ws.on('message', (message) => {
        try {
            let { move } = JSON.parse(message);
            gameState.game.move(move);
            console.log(gameState.game.ascii());

            if (gameState.game.isGameOver()) {
                data.message = "Game over!"
                sockserver.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({...data, move}))
                        return;
                    }
                    client.send(JSON.stringify(data));
                })
                data.gameInProgress = false;
                data.waiting = true;

                // TODO: Give option to start a new game, reset game state, reverse colors
                return;
            }
            
            sockserver.clients.forEach((client) => {
                // TODO: Add logic checking for ws and correct color
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    // TODO: handle logic to update the json data and send it
                    data.message = `Opponent moved!\nYour opponent played: ${move}`;
                    data.waiting = false;
                    client.send(JSON.stringify({...data, move}));
                    
                }
                else if (client === ws) {
                    // TODO: Handle logic to let the user know they are waiting on their opponents move
                    data.message = "Move Received!\nWaiting for you opponent to move...";
                    data.waiting = true;
                    client.send(JSON.stringify(data));
                }
            })
        }

        catch (e) {
            console.error(e);
            data.message = "Invalid move. Try again"
            ws.send(JSON.stringify(data));
        }
        
    });


    ws.on('close', () => {
        connectedClients--;
        console.log('Client disconnected');
        // TODO: handle resetting a game when a client disconnects. Maybe add a handler to give 10 seconds for client to reconnect.
    });

    console.log("New client connected");  
    console.log(`Current number of clients: ${connectedClients}`);
})