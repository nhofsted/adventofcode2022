import fs = require('fs');
import readline = require('readline');

class ScanLine {
    private AIR = -1;
    private TRUNK = -2;
    private DUPLICATE = -3;

    private _forward: number[] = Array(10);
    private _backward: number[] = Array(10);

    constructor() {
        this._forward.fill(this.AIR);
        this._backward.fill(this.AIR);
    }

    scan(index: number, tree: number) {
        if (this._forward[tree] == this.AIR) {
            this._forward[tree] = index;
            for (let i = tree; i-- > 0;) {
                if (this._forward[i] == this.AIR) {
                    this._forward[i] = this.TRUNK;
                } else {
                    break;
                }
            }
        }
        this._backward[tree] = index;
        for (let i = tree; i-- > 0;) {
            this._backward[i] = this.TRUNK;
        }
    }

    markDuplicate(index: number) {
        this._forward = this._forward.map(x => x == index ? this.DUPLICATE : x);
        this._backward = this._backward.map(x => x == index ? this.DUPLICATE : x);
    }

    countTrees() {
        return this.trees().length;
    }

    trees() {
        const uniqTrees = this._forward.concat(this._backward).filter(x => x >= 0).sort();
        return uniqTrees.filter((v, i) => uniqTrees.indexOf(v) === i);  // dedup
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const k0 = '0'.charCodeAt(0);
    let state: ScanLine[] | undefined;

    let trees = 0;

    let rowIndex = 0;
    for await (const line of rl) {
        // set up vertical scanlines
        state = state ?? Array.from({ length: line.length }, () => new ScanLine());

        // horizontal scanline
        const row = new ScanLine();
        for (let i = 0; i < line.length; ++i) {
            const tree = line.charCodeAt(i) - k0;
            state[i].scan(rowIndex, tree);
            row.scan(i, tree);
        }

        // count horizontal trees
        // mark trees as duplicate in vertical scans to avoid counting trees twice
        row.trees().forEach(tree => {
            trees++;
            state?.[tree].markDuplicate(rowIndex);
        });
        rowIndex++;
    }

    // count vertical trees
    state?.forEach(scanline => { trees += scanline.countTrees(); });

    console.log(trees + " trees are visible from outside the grid.");
}

part1('data/day8.txt');