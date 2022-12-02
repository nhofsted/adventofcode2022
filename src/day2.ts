import fs = require('fs');
import readline = require('readline');

function winScore(opponent: number, my: number): number {
    return ((my - opponent + 4) % 3) * 3;
}

function shapeScore(my: number): number {
    return my + 1;
}

function playForResult(opponent: number, result: number): number {
    return (opponent + result + 2) % 3;
}

function superDuperObfuscated(opponent: number, result: number): number {
    return 1 + (opponent + result + 2) % 3 + result * 3;
}

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    const A = 'A'.charCodeAt(0);
    const X = 'X'.charCodeAt(0);

    var score1 = 0;
    var score2 = 0;
    var score2b = 0;
    for await (const line of rl) {
        let opponentShape = line.charCodeAt(0) - A;
        let result = line.charCodeAt(2) - X;

        // calculate part 1 for old times' sake
        let myShape1 = result;
        score1 += winScore(opponentShape, myShape1);
        score1 += shapeScore(myShape1);

        // calculate part 2 in a readable way
        let myShape2 = playForResult(opponentShape, result)
        score2 += winScore(opponentShape, myShape2);
        score2 += shapeScore(myShape2);

        // calculate part 2 again, but now collapse everything in a giant obfuscated, but maybe more efficient, mess
        score2b += superDuperObfuscated(opponentShape, result);
    }

    console.log('Total score (part 1): ' + score1);
    console.log('Total score (part 2, readable): ' + score2);
    console.log('Total score (part 2, shortcut): ' + score2b);
}

part2('data/day2.txt');