import fs = require('fs');
import readline = require('readline');

class Coordinate {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    deepEquals(other: Coordinate): boolean {
        return this.x === other.x && this.y === other.y;
    }

    manhattanDistanceTo(other: Coordinate): number {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    toString(): string {
        return this.x + "," + this.y;
    }
}

class HeightMap {
    private map = "";
    private _width = 0;
    private _height = 0;
    private _start: Coordinate = new Coordinate(0, 0);
    private _end: Coordinate = new Coordinate(0, 0);

    async init(path: string) {
        const fileStream = fs.createReadStream(path);
        const rl = readline.createInterface(fileStream);

        for await (const line of rl) {
            this.map += line;
            this._width = line.length;
            ++this._height;
        }

        this._start = this.toCoordinate(this.map.indexOf('S'));
        this._end = this.toCoordinate(this.map.indexOf('E'));

        this.map = this.map.replace(/E/, 'z').replace(/S/, 'a');
    }

    elevation(position: Coordinate) {
        return (this.map.charCodeAt(this.toIndex(position)));
    }

    get start() {
        return this._start;
    }

    get end() {
        return this._end;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    private toCoordinate(index: number): Coordinate {
        return new Coordinate(index % this.width, Math.floor(index / this.width));
    }

    private toIndex(pos: Coordinate): number {
        return pos.y * this.width + pos.x;
    }
}

class PathNode {
    private map: HeightMap;
    private heuristic: (map: HeightMap, position: Coordinate) => number;
    private elevationCheck: (from: number, to: number) => boolean;
    readonly parent: PathNode | undefined;
    readonly distance: number;
    readonly position: Coordinate;
    readonly heuristicValue: number;

    constructor(map: HeightMap, heuristic: (map: HeightMap, position: Coordinate) => number, elevationCheck: (from: number, to: number) => boolean, position: Coordinate, distance: number, parent?: PathNode) {
        this.map = map;
        this.heuristic = heuristic;
        this.elevationCheck = elevationCheck;
        this.position = position;
        this.distance = distance;
        this.parent = parent;
        this.heuristicValue = this.distance + heuristic(map, position);
    }

    *getChildren() {
        const thisElevation = this.map.elevation(this.position);
        if (this.position.x > 0) {
            const left = new Coordinate(this.position.x - 1, this.position.y);
            const elevation = this.map.elevation(left);
            if (this.elevationCheck(thisElevation, elevation)) yield new PathNode(this.map, this.heuristic, this.elevationCheck, left, this.distance + 1, this);
        }
        if (this.position.x < this.map.width - 1) {
            const right = new Coordinate(this.position.x + 1, this.position.y);
            const elevation = this.map.elevation(right);
            if (this.elevationCheck(thisElevation, elevation)) yield new PathNode(this.map, this.heuristic, this.elevationCheck, right, this.distance + 1, this);
        }
        if (this.position.y > 0) {
            const up = new Coordinate(this.position.x, this.position.y - 1);
            const elevation = this.map.elevation(up);
            if (this.elevationCheck(thisElevation, elevation)) yield new PathNode(this.map, this.heuristic, this.elevationCheck, up, this.distance + 1, this);
        }
        if (this.position.y < this.map.height - 1) {
            const down = new Coordinate(this.position.x, this.position.y + 1);
            const elevation = this.map.elevation(down);
            if (this.elevationCheck(thisElevation, elevation)) yield new PathNode(this.map, this.heuristic, this.elevationCheck, down, this.distance + 1, this);
        }
    }
}

class NodeList {
    // Ideally, this should be implemented using a heap and a hashmap, or maybe something fancy like a fibonacciheap.
    // I'm not going to import npm modules (feels like cheating - why not import pathfinding while I'm at it?),
    // nor am I going to implement a binary heap, so please ignore the runtime complexity here.
    private list: PathNode[] = [];
    private listIndex: Map<String, PathNode> = new Map();

    addIfSmaller(n: PathNode) {
        let existing: PathNode | undefined;
        const key = n.position.toString();
        if (existing = this.listIndex.get(key)) {
            if (existing.distance > n.distance) {
                for (let i = 0; i < this.list.length; ++i) {
                    if (n.position.deepEquals(this.list[i].position)) {
                        this.list[i] = n;
                        break;
                    }
                    this.listIndex.set(key, n);
                }
            }
        } else {
            this.list.push(n);
            this.listIndex.set(key, n);
        }
    };

    removeIfSmaller(n: PathNode) {
        let existing: PathNode | undefined;
        const key = n.position.toString();
        if (existing = this.listIndex.get(key)) {
            if (existing.distance > n.distance) {
                for (let i = 0; i < this.list.length; ++i) {
                    if (n.position.deepEquals(this.list[i].position)) {
                        this.list.splice(i, 1);
                        break;
                    }
                    this.listIndex.delete(key);
                }
            }
        }
    }

    pop(): PathNode | undefined {
        return this.list.sort((a, b) => b.heuristicValue - a.heuristicValue).pop();
    }
}

async function part(map: HeightMap, startPosition: Coordinate, heuristic: (map: HeightMap, position: Coordinate) => number, elevationCheck: (from: number, to: number) => boolean, stopCondition: (map: HeightMap, position: Coordinate) => boolean) {
    const todo: NodeList = new NodeList();
    const visited: NodeList = new NodeList();
    todo.addIfSmaller(new PathNode(map, heuristic, elevationCheck, startPosition, 0));

    let current: PathNode | undefined;
    while (current = todo.pop()) {
        if (stopCondition(map, current.position)) {
            let pathLength = 0;
            while (current = current.parent) {
                ++pathLength;
            }
            return pathLength;
        }
        visited.addIfSmaller(current);
        for (let child of current.getChildren()) {
            visited.removeIfSmaller(child);
            todo.addIfSmaller(child);
        }
    }

    return null;
}

async function parts(path: string) {
    const map = new HeightMap();
    await map.init(path);

    const length1 = await part(map, map.start, (map, position) => map.end.manhattanDistanceTo(position), (from, to) => to <= from + 1, (map: HeightMap, position: Coordinate): boolean => position.deepEquals(map.end));
    if (length1 !== null) {
        console.log("At least " + length1 + " steps are required to move from the current position to the location that should get the best signal.");
    }

    const length2 = await part(map, map.end, (map, position) => 0, (from, to) => to >= from - 1, (map: HeightMap, position: Coordinate): boolean => map.elevation(position) == 'a'.charCodeAt(0));
    if (length2 !== null) {
        console.log("There are at least " + length2 + " steps required to move from any square with elevation a to the location that should get the best signal.");
    }
}


parts("data/day12.txt");