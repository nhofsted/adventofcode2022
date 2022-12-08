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
    get calories(): number { return this._calories }

    add(calories: number) { this._calories += calories }
    toString(): string { return "elf " + this._index + " with " + this._calories + " calories" }

    static max(current: Elf, max: Elf) {
        if (current._calories > max._calories) {
            return current;
        }
        return max;
    }

    static compare(e1: Elf, e2: Elf) {
        return e2._calories - e1._calories;
    }
}

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    let elves: Elf[] = [];
    let currentElf = new Elf(1);
    for await (const line of rl) {
        if (line.length) {
            currentElf.add(parseInt(line));
        } else {
            elves.push(currentElf);
            elves = elves.sort(Elf.compare);
            if (elves.length > 3) elves.pop();
            currentElf = new Elf(currentElf.index + 1);
        }
    }
    elves.push(currentElf);
    elves = elves.sort(Elf.compare);
    if (elves.length > 3) elves.pop();

    console.log('Top 3 elves:');
    let totalTopCalories = elves.reduce<number>((total, elf) => { console.log('• ' + elf); return total + elf.calories }, 0);
    console.log('Total calories of top elves: ' + totalTopCalories);
}

part2('data/day1.txt');