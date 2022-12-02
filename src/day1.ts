import fs = require('fs');
import readline = require('readline');

class Elf {
    private _index: number;
    private _calories: number;

    constructor(index = 0, calories = 0) {
        this._index = index;
        this._calories = calories;
    }

    get index(): number { return this._index }
    add(calories: number) { this._calories += calories }
    toString(): string { return "elf " + this._index + " with " + this._calories + " calories" }

    static max(current: Elf, max: Elf) {
        if (current._calories > max._calories) {
            return current;
        }
        return max;
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    var maxElf = new Elf();
    var currentElf = new Elf(1);
    for await (const line of rl) {
        if (line.length) {
            currentElf.add(parseInt(line));
        } else {
            maxElf = Elf.max(currentElf, maxElf);
            currentElf = new Elf(currentElf.index + 1);
        }
    }
    maxElf = Elf.max(currentElf, maxElf);

    console.log('Elf with max colories: ' + maxElf);
}

part1('data/day1.txt');