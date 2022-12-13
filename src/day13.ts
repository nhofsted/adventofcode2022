import fs = require('fs');
import readline = require('readline');

type T = T[] | number;

function toArray(item: T): T {
    if (typeof item == "number") return [item];
    else return item;
}

function compare(left: T, right: T): number {
    if (typeof left == "number" && typeof right == "number") {
        return left - right;
    } else if (typeof left == "object" && typeof right == "object") {
        const o = Math.min(left.length, right.length);
        for (let i = 0; i < o; ++i) {
            const r = compare(left[i], right[i]);
            if (r != 0) return r;
        }
        return left.length - right.length;
    } else {
        return compare(toArray(left), toArray(right));
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    let sum = 0;
    let index = 1;
    let left: T | undefined;
    let right: T | undefined;
    for await (const line of rl) {
        if (left === undefined) left = JSON.parse(line);
        else if (right === undefined) right = JSON.parse(line);
        else {
            if (compare(left, right) < 0) sum += index;
            index++;
            left = right = undefined;
        }
    }

    console.log("The sum of the indices of the correctly sorted pairs is " + sum);
}

part1("data/day13.txt");