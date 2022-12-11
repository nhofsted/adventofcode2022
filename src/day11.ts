import fs = require('fs');
import readline = require('readline');

class Item {
    private _worryLevel: number;

    constructor(worryLevel: number) {
        this._worryLevel = worryLevel;
    }

    get worryLevel() {
        return this._worryLevel;
    }

    inspect(worryCalculator: WorryCalculator) {
        this._worryLevel = worryCalculator.inspect(this._worryLevel);
    }

    loseInterest() {
        this._worryLevel = Math.floor(this.worryLevel / 3);
    }

    toString(): string {
        return this._worryLevel.toString();
    }
}

type Operand = number | "old";
type Operation = "+" | "*";

function createOperand(s: string): Operand {
    return (s == 'old') ? 'old' : Number.parseInt(s);
}

function createOperation(s: string): Operation | null {
    if (s === "+" || s === "*") return s;
    else return null;
}

class WorryCalculator {
    private leftOperand: Operand;
    private rightOperand: Operand;
    private operation: Operation;

    constructor(left: Operand, right: Operand, operation: Operation) {
        this.leftOperand = left;
        this.rightOperand = right;
        this.operation = operation;
    }

    inspect(oldWorry: number): number {
        const leftValue = (typeof this.leftOperand === "number") ? this.leftOperand : oldWorry;
        const rightValue = (typeof this.rightOperand === "number") ? this.rightOperand : oldWorry;
        switch (this.operation) {
            case "+": return leftValue + rightValue;
            case "*": return leftValue * rightValue;
        }
    }
}

class ItemTargetTester {
    private testValue: number;
    private trueTarget: number;
    private falseTarget: number;

    constructor(testValue: number, trueTarget: number, falseTarget: number) {
        this.testValue = testValue;
        this.trueTarget = trueTarget;
        this.falseTarget = falseTarget;
    }

    test(item: Item): number {
        return (item.worryLevel % this.testValue) ? this.falseTarget : this.trueTarget;
    }
}

class Monkey {
    private id: number | undefined;
    private troop: Monkey[];
    private items: Item[] = [];
    private worryCalculator: WorryCalculator;
    private itemTargetTester: ItemTargetTester;
    private _inspections = 0;

    constructor(id: number, troop: Monkey[], items: Item[], worryCalculator: WorryCalculator, itemTargetTester: ItemTargetTester) {
        this.id = id;
        this.troop = troop;
        this.items = items;
        this.worryCalculator = worryCalculator;
        this.itemTargetTester = itemTargetTester;
    }

    accept(item: Item) {
        this.items.push(item);
    }

    turn() {
        let item;
        while (item = this.items.shift()) {
            ++this._inspections;
            item.inspect(this.worryCalculator);
            item.loseInterest();
            this.troop[this.itemTargetTester.test(item)].accept(item);
        }
    }

    get inspections() {
        return this._inspections;
    }

    toString(): string {
        return "Monkey " + this.id + ": " + this.items.toString();
    }

    static async createMonkey(troop: Monkey[], rl: readline.Interface): Promise<Monkey | null> {
        const items: Item[] = [];
        let id: number | undefined;
        let worryCalculator: WorryCalculator | undefined;
        let itemTargetTestDivisor: number | undefined;
        let trueTarget: number | undefined;
        let falseTarget: number | undefined;

        for await (const line of rl) {
            let m;
            if (line === "") {
                break;
            } else if (m = line.match(/Monkey (\d+):/)) {
                id = Number.parseInt(m[1]);
            } else if (line.match(/Starting items: (([\d-]+)(, )?)*/)) {
                for (const n of line.matchAll(/([\d-]+)/g)) {
                    items.push(new Item(Number.parseInt(n[1])));
                }
            } else if (m = line.match(/  Operation: new = (old|[\d-]+) (\+|\*) (old|[\d-]+)/)) {
                worryCalculator = new WorryCalculator(createOperand(m[1]), createOperand(m[3]), createOperation(m[2])!);
            } else if (m = line.match(/  Test: divisible by (\d+)/)) {
                itemTargetTestDivisor = Number.parseInt(m[1]);
            } else if (m = line.match(/    If true: throw to monkey (\d+)/)) {
                trueTarget = Number.parseInt(m[1]);
            } else if (m = line.match(/    If false: throw to monkey (\d+)/)) {
                falseTarget = Number.parseInt(m[1]);
            }
        }
        if (id !== undefined && worryCalculator !== undefined && itemTargetTestDivisor !== undefined && trueTarget !== undefined && falseTarget !== undefined) {
            return new Monkey(id, troop, items, worryCalculator, new ItemTargetTester(itemTargetTestDivisor, trueTarget, falseTarget));
        } else {
            return null;
        }
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const troop: Monkey[] = [];
    let monkey;
    while ((monkey = await Monkey.createMonkey(troop, rl)) != null) {
        troop.push(monkey);
    }

    for (let i = 0; i < 20; ++i) {
        for (const monkey of troop) {
            monkey.turn();
        }
        console.log("Round " + (i + 1));
        for (const monkey of troop) {
            console.log("" + monkey);
        }
        console.log("");
    }

    troop.sort((m1, m2) => m2.inspections - m1.inspections);

    console.log("The level of monkey business after 20 rounds of stuff-slinging simian shenanigans is " + (troop[0].inspections * troop[1].inspections));
}

part1('data/day11.txt');