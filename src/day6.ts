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

async function parts() {
    await part1('data/day6.txt');
    await part2('data/day6.txt', 14);
}

parts();