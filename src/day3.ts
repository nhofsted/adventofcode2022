import assert = require('assert');
import fs = require('fs');
import readline = require('readline');

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    const priorityMapping = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let prioritySum = 0;
    for await (const line of rl) {
        const length = line.length;
        const match = line.match('[' + line.slice(length/2) + ']');
        assert(match != null);
        prioritySum += priorityMapping.indexOf(match[0])+1;
    }

    console.log('Sum of all priorities: ' + prioritySum);
}

part1('data/day3.txt');