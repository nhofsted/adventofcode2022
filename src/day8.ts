import fs = require('fs');
import readline = require('readline');

const k0 = '0'.charCodeAt(0);

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

    console.log("Part 1 - Streaming");
    console.log(trees + " trees are visible from outside the grid.");
}

class Forest {
    private _forest: number[][] = [];
    private _width = 0;
    private _height = 0;

    async readForest(path: string) {
        const fileStream = fs.createReadStream(path);
        const rl = readline.createInterface(fileStream);

        for await (const line of rl) {
            this._forest.push(line.split("").map(c => c.charCodeAt(0) - k0));
            this._width = line.length;
            this._height++;
        }
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    getTree(x: number, y: number) {
        return this._forest[y][x];
    }

    setTree(x: number, y: number, tree: number) {
        this._forest[y][x] = tree;
    }

    trees() {
        return this._forest.reduce((result, row) => result.concat(row), []);
    }

    static createForest(width: number, height: number, value: number) {
        const forest = new Forest();
        for (let i = 0; i < height; ++i) {
            forest._forest.push(new Array(width).fill(value));
        }
        forest._width = width;
        forest._height = height;
        return forest;
    }
}


interface TreeComputer {
    visitTree(tree: number, dst: number): number;
    reset(): void;
    unity(): number;
}

class VisibilityChecker implements TreeComputer {
    private _maxHeight = -1;

    visitTree(tree: number, dst: number) {
        if (tree > this._maxHeight) {
            this._maxHeight = tree;
            return 1;
        } else {
            return dst;
        }
    }

    reset() {
        this._maxHeight = -1;
    }

    unity() {
        return 0;
    }
}

class ScenicValueMeasurer {
    private _distanceTo: number[] = new Array(10).fill(0);

    visitTree(tree: number, dst: number) {
        const result = dst * this._distanceTo[tree];
        for (let i = 0; i < this._distanceTo.length; ++i) {
            if (i <= tree) {
                this._distanceTo[i] = 1;
            } else {
                this._distanceTo[i]++;
            }
        }
        return result;
    }

    reset() {
        this._distanceTo = new Array(10).fill(0);
    }

    unity() {
        return 1;
    }
}

function scanRight(src: Forest, dst: Forest, c: TreeComputer) {
    for (let y = 0; y < src.height; ++y) {
        c.reset();
        for (let x = 0; x < src.width; ++x) {
            dst.setTree(x, y, c.visitTree(src.getTree(x, y), dst.getTree(x, y)));
        }
    }
}

function scanLeft(src: Forest, dst: Forest, c: TreeComputer) {
    for (let y = 0; y < src.height; ++y) {
        c.reset();
        for (let x = src.width; x-- > 0;) {
            dst.setTree(x, y, c.visitTree(src.getTree(x, y), dst.getTree(x, y)));
        }
    }
}

function scanDown(src: Forest, dst: Forest, c: TreeComputer) {
    for (let x = 0; x < src.width; ++x) {
        c.reset();
        for (let y = 0; y < src.height; ++y) {
            dst.setTree(x, y, c.visitTree(src.getTree(x, y), dst.getTree(x, y)));
        }
    }
}

function scanUp(src: Forest, dst: Forest, c: TreeComputer) {
    for (let x = 0; x < src.width; ++x) {
        c.reset();
        for (let y = src.height; y-- > 0;) {
            dst.setTree(x, y, c.visitTree(src.getTree(x, y), dst.getTree(x, y)));
        }
    }
}

function scanForest(forest: Forest, computer: TreeComputer) {
    const result = Forest.createForest(forest.width, forest.height, computer.unity());
    scanRight(forest, result, computer);
    scanLeft(forest, result, computer);
    scanDown(forest, result, computer);
    scanUp(forest, result, computer);
    return result;
}

async function part2(path: string) {
    console.log("Part 2 - Generic");
    
    // Read the input
    const forest = new Forest();
    await forest.readForest(path);

    // For old times' sake
    const visibleTrees = scanForest(forest, new VisibilityChecker());
    console.log(visibleTrees.trees().filter(x => x == 1).length + " trees are visible from outside the grid.");

    // Actual part 2 question
    const scenicValues = scanForest(forest, new ScenicValueMeasurer());
    console.log("The highest scenic score possible for any tree is " + scenicValues.trees().sort((a, b) => a - b).pop());
}

async function parts() {
    await part1('data/day8.txt'); // This can be done streaming
    await part2('data/day8.txt'); // This can't, unfortunately
}

parts();