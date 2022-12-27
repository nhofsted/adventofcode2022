import fs = require('fs');
import readline = require('readline');

type Value = {
    v: number;
}

function mix(data: Value[], value: Value): Value[] {
    const index = data.indexOf(value);
    const part1 = data.slice(0, index);
    const part2 = data.slice(index + 1, data.length);
    let target = index + value.v;
    target = ((target % (data.length - 1)) + (data.length - 1)) % (data.length - 1);
    if (target <= index) {
        return [...part1.slice(0, target), value, ...part1.slice(target, part1.length), ...part2];
    } else {
        return [...part1, ...part2.slice(0, target - part1.length), value, ...part2.slice(target - part1.length, part2.length)];
    }
}

async function part(path: string, key: number = 1, iterations: number = 1) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const input: Value[] = [];
    let zero: Value | null = null;
    for await (const line of rl) {
        const value = { v: Number.parseInt(line) * key }
        if (value.v == 0) zero = value;
        input.push(value);
    }

    let data = input;
    for (let iteration = 0; iteration < iterations; ++iteration) {
        for (const value of input) {
            data = mix(data, value);
        }
    }

    const i = data.indexOf(zero!);
    const sum = data[(i + 1000) % data.length].v + data[(i + 2000) % data.length].v + data[(i + 3000) % data.length].v;

    console.log("The sum of the three numbers that form the grove coordinates is " + sum);
}

async function parts(path: string) {
    await part(path);
    await part(path, 811589153, 10);
}

parts("data/day20.txt");