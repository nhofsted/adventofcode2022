import assert = require('assert');
import fs = require('fs');
import readline = require('readline');

type Tile = " " | "#" | ".";

function isTile(str: string): str is Tile {
    return str == " " || str == "#" || str == ".";
}

class Map {
    private data: string[];

    constructor(data: string[]) {
        this.data = data;
    }

    get startingPosition() {
        return {
            row: 1,
            column: this.data[0].indexOf(".") + 1,
            direction: Direction.E,
        }
    }

    getTile(position: Position): Tile {
        const row = position.row - 1;
        const column = position.column - 1;
        if (row < 0) return " ";
        if (row >= this.data.length) return " ";
        if (column < 0) return " ";
        if (column >= this.data[row].length) return " ";
        const tile = this.data[row].charAt(column);
        assert(isTile(tile));
        return tile;
    }

    getNextPosition(position: Position): Position {
        if (this.getTile(position) == " ") {
            throw new Error("You need to start in the map to calculate the next position");
        }

        let nextPosition = { ...position };
        if (position.direction == Direction.E) nextPosition.column++;
        else if (position.direction == Direction.S) nextPosition.row++;
        else if (position.direction == Direction.W) nextPosition.column--;
        else if (position.direction == Direction.N) nextPosition.row--;

        if (this.getTile(nextPosition) != " ") return nextPosition;

        // Off map, wrap around
        if (position.direction == Direction.E) {
            nextPosition.column = this.data[nextPosition.row - 1].search(/\.|#/) + 1;
        } else if (position.direction == Direction.S) {
            for (let r = 0; r < this.data.length; ++r) {
                nextPosition.row = r + 1;
                if (this.getTile(nextPosition) != " ") {
                    break;
                }
            }
        } else if (position.direction == Direction.W) {
            nextPosition.column = this.data[nextPosition.row - 1].length;
        } else if (position.direction == Direction.N) {
            for (let r = this.data.length; r-- > 0;) {
                nextPosition.row = r + 1;
                if (this.getTile(nextPosition) != " ") {
                    break;
                }
            }
        }
        return nextPosition;
    }
}

class Direction {
    static readonly E: Direction = new Direction(0);
    static readonly S: Direction = new Direction(1);
    static readonly W: Direction = new Direction(2);
    static readonly N: Direction = new Direction(3);

    readonly value: 0 | 1 | 2 | 3;

    private constructor(direction: number) {
        if (direction == 0 || direction == 1 || direction == 2 || direction == 3) {
            this.value = direction;
        } else {
            throw new Error('Not a valid direction');
        }
    }

    get right(): Direction {
        switch (this.value) {
            case 0: return Direction.S;
            case 1: return Direction.W;
            case 2: return Direction.N;
            case 3: return Direction.E;
        }
    }

    get left(): Direction {
        switch (this.value) {
            case 0: return Direction.N;
            case 1: return Direction.E;
            case 2: return Direction.S;
            case 3: return Direction.W;
        }
    }
}

type Position = {
    row: number;
    column: number;
    direction: Direction;
}

function moveForward(map: Map, position: Position): Position {
    const nextPosition = map.getNextPosition(position);
    if (map.getTile(nextPosition) == "#") {
        return position;
    } else {
        return nextPosition;
    }
}

function turnLeft(map: Map, position: Position): Position {
    return {
        row: position.row,
        column: position.column,
        direction: position.direction.left,
    }
}

function turnRight(map: Map, position: Position): Position {
    return {
        row: position.row,
        column: position.column,
        direction: position.direction.right,
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const data: string[] = [];
    let map: Map | undefined;
    let directions: string;
    for await (const line of rl) {
        if (map === undefined && line != "") {
            data.push(line);
        } else if (map === undefined) {
            map = new Map(data);
        } else {
            directions = line;
        }
    }
    map = map!;
    directions = directions!;

    let p = map.startingPosition;
    while (directions.length) {
        const m = directions.match(/(\d+)|(L)|(R)/)!;
        if (m[1]) {
            const distance = Number.parseInt(m[1]);
            for (let i = 0; i < distance; ++i) {
                p = moveForward(map, p);
            }
        } else if (m[2]) {
            p = turnLeft(map, p);
        } else if (m[3]) {
            p = turnRight(map, p);
        }
        directions = directions.slice(m[0].length, directions.length);
    }

    console.log("The final password is " + (1000 * p.row + 4 * p.column + p.direction.value));
}

part1("data/day22.txt");