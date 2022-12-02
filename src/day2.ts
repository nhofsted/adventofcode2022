import fs = require('fs');
import readline = require('readline');

function winScore(opponent: number, my: number): number {
    return ((my-opponent+4)%3)*3;
}

function shapeScore(my: number): number {
    return my + 1;
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    const A = 'A'.charCodeAt(0);
    const X = 'X'.charCodeAt(0);

    var score = 0;
    for await (const line of rl) {
        let opponentShape = line.charCodeAt(0) - A;
        let myShape = line.charCodeAt(2) - X;
        score += winScore(opponentShape, myShape);
        score += shapeScore(myShape);
    }

    console.log('Total score: ' + score);
}

part1('data/day2.txt');