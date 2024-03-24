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



const mainLoop = async (fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") => {
    const chess = new Chess(fen);
    try {
        while (!chess.isGameOver()) {
            console.log(chess.ascii());
            
            let { moveMade } = await inquirer.prompt(movePrompt);
            console.log(moveMade);
            chess.move(moveMade);
        
        }
        console.log(chess.ascii());
        console.log("Game over!");
    }
    

    catch (e) {

        console.error("Invalid move");
        mainLoop(chess.fen());
    }
};


mainLoop();



const makeMove = async (fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") => {
    const chess = new Chess(fen);

    try {
        console.log(chess.ascii());
        let { moveMade } = await inquirer.prompt(movePrompt);
        console.log(moveMade);
        chess.move(moveMade);
        return chess;
    }

    catch (e) {
        console.error(error);
        makeMove(chess.fen());
    }
}

// TODO: review all bases and logic to handle an ongoing game
connection.on('message', async (message) => {
    try {
        const data = JSON.parse(message);

        if (!data.waiting && data.gameInProgress) {
            console.log(data.ascii)
            // TODO send the data to the ws server
            const resultingPosition = await makeMove(data.fen);
        }

        else if (data.waiting) {
            console.log("Waiting for opponent to join...");
        }
    }
    catch (e) {
        console.error(e)
    }
    
})