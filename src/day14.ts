import fs = require('fs');
import readline = require('readline');

const ROCK = 8;
const SAND = 1;

type Coordinate = {
    x: number;
    y: number;
}

function createCoordinate(point: string): Coordinate {
    const coords: number[] = point.split(",").map(c => Number.parseInt(c));
    return { x: coords[0], y: coords[1] };
}

function drawRocks(cave: number[][], from: Coordinate, to: Coordinate) {
    if (from.x == to.x) {
        const { start, end } = (from.y < to.y) ? { start: from.y, end: to.y } : { start: to.y, end: from.y };
        for (let p = start; p <= end; ++p) {
            cave[p][from.x] = ROCK;
        }
    } else {
        const { start, end } = (from.x < to.x) ? { start: from.x, end: to.x } : { start: to.x, end: from.x };
        for (let p = start; p <= end; ++p) {
            cave[from.y][p] = ROCK;
        }
    }
}

function dropSand(cave: number[][], sand: Coordinate): Coordinate {
    let retVal = { ...sand };
    while (retVal.y < 500) {
        if (cave[retVal.y + 1][retVal.x] == 0) {
            retVal.y++;
        }
        else if (cave[retVal.y + 1][retVal.x - 1] == 0) {
            retVal.y++;
            retVal.x--;
        }
        else if (cave[retVal.y + 1][retVal.x + 1] == 0) {
            retVal.y++;
            retVal.x++;
        }
        else {
            cave[retVal.y][retVal.x] = SAND;
            return retVal;
        }
    }
    cave[retVal.y][retVal.x] = SAND;
    return retVal;
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const cave: number[][] = [];
    for (let i = 0; i < 501; ++i) {
        cave.push(new Array<number>(1001).fill(0));
    }

    let pen: Coordinate | undefined;
    for await (const line of rl) {
        for (const point of line.split(" -> ")) {
            const p: Coordinate = createCoordinate(point);
            if (pen === undefined) {
                pen = p;
            } else {
                drawRocks(cave, pen, p);
                pen = p;
            }
        }
        pen = undefined;
    }

    let sand = 0;
    while (dropSand(cave, { x: 500, y: 0 }).y != 500) {
        ++sand;
    }

    console.log(sand + " units of sand come to rest before sand starts flowing into the abyss below.");
}

part1("data/day14.txt");