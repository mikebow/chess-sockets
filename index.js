import { Chess } from 'chess.js';
import inquirer from 'inquirer';
import WebSocket from 'ws';

const URL = "ws://localhost:443";

const connection = new WebSocket(URL);


let movePrompt = [
    {
        type: 'input',
        name: 'moveMade',
        message: 'Enter your move: '
    }
];

let playAgainPromt = [
    {
        type: 'list',
        name: 'playAgain',
        message: 'Do you want to play again?',
        choices: ['Yes', 'No'],
        filter(val) {
            return val == 'Yes' ? true : false;
        }
    }
]




let chess = new Chess();
const makeMove = async (move=null, fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" /*TODO: add option for a starting position*/ ) => {

    try {
        if (move) chess.move(move); // There will not a be a move when the game starts.
        console.log(chess.ascii());
        
        let { moveMade } = await inquirer.prompt(movePrompt);
        chess.move(moveMade);
        console.log(chess.ascii());
        return chess;
    }

    catch (e) {
        // TODO: Somehow we keep getting to this catch block after a rematch.
        console.error(e);
        console.log(e);
        
    }
}

connection.on('open', () => {
    console.log("Successfully connected to chess-sockets!")
})



// TODO: review all bases and logic to handle an ongoing game
connection.on('message', async (message) => {
    try {
        const data = JSON.parse(message);

        if (data.promptPlayAgain) {
            const playAgainResponse = await inquirer.prompt(playAgainPromt);
            connection.send(JSON.stringify({playAgain: playAgainResponse.playAgain}));
            return;
        }

        if (data.newGame) chess = new Chess();

        // Not waiting (meaning it is your move) and there is a game in progress
        if (!data.waiting && data.gameInProgress) {
            console.log(data.message);
            const resultingPosition = await makeMove(data.move);
            const moveData = {
                move: resultingPosition.history()[resultingPosition.history().length - 1]
            }
            const jsonData = JSON.stringify(moveData);
            connection.send(jsonData)
        }

        else {
            console.log(data.message);
        }

    }
    catch (e) {
        console.error(e)
    }
    
})


connection.on('error', (error) => {
    console.error('WebSocket connection error:', error.code);
    console.log("Did you start the ws server?\n");
    console.log("Try the following: \n\tcd ws-server\n\tnode index.js");
});

connection.on('close', () => {
    console.log("\nServer disconnecting now...");
    process.exit();
})