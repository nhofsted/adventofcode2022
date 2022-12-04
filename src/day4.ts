import fs = require('fs');
import readline = require('readline');

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    let contains = 0;
    let overlap = 0;
    for await (const line of rl) {
        const ranges = line.split(/[-,]/).map(x => Number.parseInt(x));
        contains += ranges[0] <= ranges[2] && ranges[1] >= ranges[3] || ranges[0] >= ranges[2] && ranges[1] <= ranges[3] ? 1 : 0;
        overlap += ranges[0] <= ranges[2] && ranges[1] >= ranges[2] || ranges[0] <= ranges[3] && ranges[1] >= ranges[3] || ranges[0] >= ranges[2] && ranges[1] <= ranges[3] ? 1 : 0;
    }

    console.log('In ' + contains + ' assignment pairs does one range fully contain the other');
    console.log('In ' + overlap + ' assignment pairs does one range overlap the other');
}

part2('data/day4.txt');