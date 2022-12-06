import fs = require('fs');
import readline = require('readline');

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    for await (const line of rl) {
        console.log(line.match(/(.)((?!\1).)((?!(\1|\2)).)((?!(\1|\2|\3)).)/)!.index! + 4);
    }
}

part1('data/day6.txt');