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
    private _start: Coordinate = new Coordinate(0,0);
    private _end: Coordinate = new Coordinate(0,0);

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
    readonly parent: PathNode | undefined;
    readonly distance: number;
    readonly position: Coordinate;
    readonly heuristic: number;

    constructor(map: HeightMap, position: Coordinate, distance: number, parent?: PathNode) {
        this.map = map;
        this.position = position;
        this.distance = distance;
        this.parent = parent;
        this.heuristic = this.distance + map.end.manhattanDistanceTo(position);
    }

    *getChildren() {
        const thisElevation = this.map.elevation(this.position);
        if (this.position.x > 0) {
            const left = new Coordinate(this.position.x - 1, this.position.y);
            const elevation = this.map.elevation(left);
            if (elevation <= thisElevation + 1) yield new PathNode(this.map, left, this.distance + 1, this);
        }
        if (this.position.x < this.map.width - 1) {
            const right = new Coordinate(this.position.x + 1, this.position.y);
            const elevation = this.map.elevation(right);
            if (elevation <= thisElevation + 1) yield new PathNode(this.map, right, this.distance + 1, this);
        }
        if (this.position.y > 0) {
            const up = new Coordinate(this.position.x, this.position.y - 1);
            const elevation = this.map.elevation(up);
            if (elevation <= thisElevation + 1) yield new PathNode(this.map, up, this.distance + 1, this);
        }
        if (this.position.y < this.map.height - 1) {
            const down = new Coordinate(this.position.x, this.position.y + 1);
            const elevation = this.map.elevation(down);
            if (elevation <= thisElevation + 1) yield new PathNode(this.map, down, this.distance + 1, this);
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
        return this.list.sort((a, b) => b.heuristic - a.heuristic).pop();
    }
}

async function part1(path: string) {
    const map = new HeightMap();
    await map.init(path);

    const todo: NodeList = new NodeList();
    const visited: NodeList = new NodeList();
    todo.addIfSmaller(new PathNode(map, map.start, 0));

    let current: PathNode | undefined;
    while (current = todo.pop()) {
        if (current.position.deepEquals(map.end)) {
            let pathLength = 0;
            while (current = current.parent) {
                ++pathLength;
            }
            console.log("At least " + pathLength + " steps are required to move from the current position to the location that should get the best signal.");
            return;
        }
        visited.addIfSmaller(current);
        for (let child of current.getChildren()) {
            visited.removeIfSmaller(child);
            todo.addIfSmaller(child);
        }
    }

    console.log("No path found");
}

part1("data/day12.txt");