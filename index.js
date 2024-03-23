import { Chess } from 'chess.js'

const chess = new Chess();

console.log(chess.ascii());

chess.move("e4");

console.log(chess.ascii());