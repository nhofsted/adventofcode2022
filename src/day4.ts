import fs = require('fs');
import readline = require('readline');

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    let sum = 0;
    for await (const line of rl) {
        const ranges = line.split(/[-,]/).map(x => Number.parseInt(x));
        sum += ranges[0] <= ranges[2] && ranges[1] >= ranges[3] || ranges[0] >= ranges[2] && ranges[1] <= ranges[3] ? 1 : 0;
    }

    console.log('In ' + sum + ' assignment pairs does one range fully contain the other');
}

part1('data/day4.txt');