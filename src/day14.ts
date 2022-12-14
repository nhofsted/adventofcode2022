import fs = require('fs');
import readline = require('readline');

const ROCK = 8;
const SAND = 1;
const EMPTY = 0;

type Coordinate = {
    x: number;
    y: number;
}

type Cave = number[][];

function createCoordinate(point: string): Coordinate {
    const coords: number[] = point.split(",").map(c => Number.parseInt(c));
    return { x: coords[0], y: coords[1] };
}

function drawRocks(cave: Cave, from: Coordinate, to: Coordinate) {
    while (cave.length < Math.max(from.y, to.y) + 2) {
        cave.push(new Array<number>(1001).fill(EMPTY));
    }

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

function dropSand(cave: Cave, sand: Coordinate): Coordinate {
    let retVal = { ...sand };
    while (retVal.y < cave.length-1) {
        if (cave[retVal.y + 1][retVal.x] == EMPTY) {
            retVal.y++;
        }
        else if (cave[retVal.y + 1][retVal.x - 1] == EMPTY) {
            retVal.y++;
            retVal.x--;
        }
        else if (cave[retVal.y + 1][retVal.x + 1] == EMPTY) {
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

async function parts(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const cave: Cave = [];

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
    let pos;
    let firstDrop = false;
    while ((pos = dropSand(cave, { x: 500, y: 0 })).y != 0) {
        if (!firstDrop && pos.y == cave.length - 1) {
            console.log(sand + " units of sand come to rest before sand starts flowing into the abyss below.");
            firstDrop = true;
        }
        ++sand;
    }
    console.log((sand + 1)  + " units of sand come to rest.");
}

parts("data/day14.txt");