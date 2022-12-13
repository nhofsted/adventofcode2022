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

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const list: T[] = [];
    for await (const line of rl) {
        if (line.length != 0) list.push(JSON.parse(line));
    }
    const mark2 = [[2]];
    const mark6 = [[6]];
    list.push(mark2);
    list.push(mark6);

    list.sort((a,b) => compare(a,b));
    console.log("The sum of the indices of the correctly sorted pairs is " + (list.indexOf(mark2)+1) * (list.indexOf(mark6)+1));
}

async function parts() {
    await part1("data/day13.txt");
    await part2("data/day13.txt");
}

parts();