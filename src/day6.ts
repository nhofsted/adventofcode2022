import { assert } from 'console';
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

async function part2(path: string, size: number) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    for await (const line of rl) {
        outer: for (let i = 0; i < line.length; ++i) {
            for (let j = size - 1; j-- > 0;) {
                for (let k = size; k-- > j + 1;) {
                    if (line.charAt(i + k) == line.charAt(i + j)) {
                        i = i + j;
                        continue outer;
                    }
                }
            }
            console.log(i + size);
            break;
        }
    }
}

async function part2b(path: string, windowSize: number) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    // Create window state
    const charCount: number[] = new Array(255);         // How many times does each character appear in the window?

    line: for await (const line of rl) {
        // Is the line long enough to contain the window?
        if (line.length < windowSize) return;

        charCount.fill(0);                              // Initially the window is empty
        let neededUniqueChars = windowSize;             // How many unique characters do we still need?

        // Fill up the window (unrolled the main loop for the start to avoid checking whether the start of the window is < 0)
        for (let i = 0; i < windowSize; ++i) {
            // Only characters that appear exactly once count towards our goal
            switch (++charCount[line.charCodeAt(i)]) {
                case 1:
                    neededUniqueChars--;
                    break;
                case 2:
                    neededUniqueChars++;
                    break;
            }
        }
        // Do we have windowSize amount of unique characters?
        if (!neededUniqueChars) {
            console.log(windowSize);
            continue;
        }

        // Move window
        for (let i = windowSize; i < line.length; ++i) {
            // Old char drops out
            switch (--charCount[line.charCodeAt(i - windowSize)]) {
                case 0:
                    neededUniqueChars++;
                    break;
                case 1:
                    neededUniqueChars--;
                    break;
            }
            // New char enters
            switch (++charCount[line.charCodeAt(i)]) {
                case 1:
                    neededUniqueChars--;
                    break;
                case 2:
                    neededUniqueChars++;
                    break;
            }
            // Do we have windowSize amount of unique characters?
            if (!neededUniqueChars) {
                console.log(i + 1);
                continue line;
            }
        }
    }
}

async function parts() {
    // part 1
    await part1('data/day6.txt');
    // part 2 (first algorithm)
    await part2('data/day6.txt', 4);
    await part2('data/day6.txt', 14);
    // part 2 (second algorithm)
    await part2b('data/day6.txt', 4);
    await part2b('data/day6.txt', 14);
}

parts();