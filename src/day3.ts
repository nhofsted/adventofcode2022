import assert = require('assert');
import fs = require('fs');
import readline = require('readline');

const priorityMapping = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    let prioritySum = 0;
    for await (const line of rl) {
        const length = line.length;
        const match = line.match('[' + line.slice(length / 2) + ']');
        assert(match != null);
        prioritySum += priorityMapping.indexOf(match[0]) + 1;
    }

    console.log('Sum of all priorities (part 1): ' + prioritySum);
}

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    let prioritySum = 0;
    let lineCount = 1;

    let charCount: number[] = new Array(52);
    charCount.fill(0);

    for await (const line of rl) {
        for (var i = line.length; i-- > 0;) {
            charCount[priorityMapping.indexOf(line.charAt(i))] |= lineCount;
        }
        lineCount <<= 1;
        if (lineCount == 8) {
            prioritySum += charCount.indexOf(7) + 1;
            charCount.fill(0);
            lineCount = 1;
        }
    }

    console.log('Sum of all priorities (part 2): ' + prioritySum);
}

part1('data/day3.txt');
part2('data/day3.txt');