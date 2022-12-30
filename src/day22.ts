import assert = require('assert');
import fs = require('fs');
import readline = require('readline');

type Tile = " " | "#" | ".";

function isTile(str: string): str is Tile {
    return str == " " || str == "#" || str == ".";
}

abstract class Board {
    protected data: string[];

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

    moveForwardOnMap(position: Position): Position {
        const nextPosition = this.getNextPosition(position);
        if (this.getTile(nextPosition) == "#") {
            return position;
        } else {
            return nextPosition;
        }
    }

    private getNextPosition(position: Position): Position {
        if (this.getTile(position) == " ") {
            throw new Error("You need to start in the map to calculate the next position");
        }

        let nextPosition = moveForward(position);
        if (this.getTile(nextPosition) != " ") return nextPosition;

        return this.getNextOffMapPosition(position);
    }

    abstract getNextOffMapPosition(position: Position): Position;

}

class FlatBoard extends Board {
    constructor(data: string[]) {
        super(data);
    }

    getNextOffMapPosition(position: Position): Position {
        let nextPosition = { ...position };

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

class CubeBoard extends Board {
    private stitchMap = new Map<string, Position>();

    constructor(data: string[]) {
        super(data);
        this.stitch();
    }

    private getInnerCorners(): Pair<Position>[] {
        const corners: Pair<Position>[] = [];
        const start = this.startingPosition;
        let walk = { ...start };
        do {
            let { position, innerCorner } = this.walkClockWise(walk);
            if (innerCorner) {
                corners.push({ first: turnLeft(moveForward(walk)), second: turnLeft(turnLeft(moveForward(walk))) });
            }
            walk = position;
        } while (walk.row != start.row || walk.column != start.column)
        assert(corners.length > 0);
        return corners;
    }

    private stitch() {
        const corners = this.getInnerCorners();
        let progress = true;
        while (progress) {
            progress = false;
            corner: for (const pair of corners) {
                // find next step for first clockwise
                let { position: nextFirst, outerCorner: outerCornerFirst } = this.walkClockWise(pair.first);
                // find next step for second counterclockwise
                let { position: nextSecond, outerCorner: outerCornerSecond } = this.walkCounterClockWise(pair.second);
                // if this bumps into an already stitched section, skip
                if (this.stitchMap.has(positionToString(turnLeft(nextFirst)))) {
                    let skipTo = nextFirst;
                    while (this.stitchMap.has(positionToString(turnLeft(skipTo)))) {
                        if (skipTo.column == nextFirst.column && skipTo.row == nextFirst.row) continue corner;
                        ({ position: skipTo } = this.walkClockWise(skipTo));
                    }
                    nextFirst = skipTo;
                    outerCornerFirst = false;
                }
                if (this.stitchMap.has(positionToString(turnRight(nextSecond)))) {
                    let skipTo = nextSecond;
                    while (this.stitchMap.has(positionToString(turnRight(skipTo)))) {
                        if (skipTo.column == nextSecond.column && skipTo.row == nextSecond.row) continue corner;
                        ({ position: skipTo } = this.walkCounterClockWise(skipTo));
                    }
                    nextSecond = skipTo;
                    outerCornerSecond = false;
                }
                // if this reaches two outer corners simultaneously, stop stitching
                if (outerCornerFirst && outerCornerSecond) continue;
                // move
                pair.first = nextFirst;
                pair.second = nextSecond;
                progress = true;
                // add stitch
                this.stitchMap.set(positionToString(turnLeft(pair.first)), turnLeft(pair.second));
                this.stitchMap.set(positionToString(turnRight(pair.second)), turnRight(pair.first));
            }
        }
    }

    getNextOffMapPosition(position: Position): Position {
        assert(this.stitchMap.has(positionToString(position)));
        return this.stitchMap.get(positionToString(position))!;
    }

    walkClockWise(position: Position) {
        const forwardTile = this.getTile(moveForward(position));
        const leftTile = this.getTile(moveForward(turnLeft(moveForward(position))));
        let innerCorner = false;
        let outerCorner = false;
        if (forwardTile == " ") {
            // turn right
            position = turnRight(position);
            outerCorner = true;
        } else if (leftTile != " ") {
            // advance turn left and advance
            position = moveForward(turnLeft(moveForward(position)));
            innerCorner = true;
        } else {
            position = moveForward(position);
        }
        return ({ position, innerCorner, outerCorner });
    }

    walkCounterClockWise(position: Position) {
        const forwardTile = this.getTile(moveForward(position));
        const rightTile = this.getTile(moveForward(turnRight(moveForward(position))));
        let innerCorner = false;
        let outerCorner = false;
        if (forwardTile == " ") {
            // turn left
            position = turnLeft(position);
            outerCorner = true;
        } else if (rightTile != " ") {
            // advance turn right and advance
            position = moveForward(turnRight(moveForward(position)));
            innerCorner = true;
        } else {
            position = moveForward(position);
        }
        return ({ position, innerCorner, outerCorner });
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

type Pair<T> = {
    first: T;
    second: T;
}

type Position = {
    row: number;
    column: number;
    direction: Direction;
}

function positionToString(position: Position) {
    return position.row + "," + position.column + "," + position.direction.value;
}

function moveForward(position: Position): Position {
    let nextPosition = { ...position };
    if (position.direction == Direction.E) nextPosition.column++;
    else if (position.direction == Direction.S) nextPosition.row++;
    else if (position.direction == Direction.W) nextPosition.column--;
    else if (position.direction == Direction.N) nextPosition.row--;
    return nextPosition;
}

function turnLeft(position: Position): Position {
    return {
        row: position.row,
        column: position.column,
        direction: position.direction.left,
    }
}

function turnRight(position: Position): Position {
    return {
        row: position.row,
        column: position.column,
        direction: position.direction.right,
    }
}

async function parts(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const data: string[] = [];
    let flatMap: FlatBoard | undefined;
    let cubeMap: CubeBoard | undefined;
    let directions: string | undefined;
    for await (const line of rl) {
        if (flatMap === undefined && line != "") {
            data.push(line);
        } else if (flatMap === undefined) {
            flatMap = new FlatBoard(data);
            cubeMap = new CubeBoard(data);
        } else {
            directions = line;
        }
    }
    assert(flatMap != undefined);
    assert(cubeMap != undefined);
    assert(directions != undefined);

    let p1 = flatMap.startingPosition;
    let p2 = cubeMap.startingPosition;
    while (directions.length) {
        const m = directions.match(/(\d+)|(L)|(R)/)!;
        if (m[1]) {
            const distance = Number.parseInt(m[1]);
            for (let i = 0; i < distance; ++i) {
                p1 = flatMap.moveForwardOnMap(p1);
                p2 = cubeMap.moveForwardOnMap(p2);
            }
        } else if (m[2]) {
            p1 = turnLeft(p1);
            p2 = turnLeft(p2);
        } else if (m[3]) {
            p1 = turnRight(p1);
            p2 = turnRight(p2);
        }
        directions = directions.slice(m[0].length, directions.length);
    }

    console.log("Part 1: The final password is " + (1000 * p1.row + 4 * p1.column + p1.direction.value));
    console.log("Part 2: The final password is " + (1000 * p2.row + 4 * p2.column + p2.direction.value));
}

parts("data/day22.txt");