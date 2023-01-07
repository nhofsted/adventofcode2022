import assert = require('assert');
import fs = require('fs');
import readline = require('readline');

type Direction = "<" | ">" | "^" | "v";

type Coordinate = {
    readonly x: number;
    readonly y: number;
}

function coordinateEquals(c1: Coordinate, c2: Coordinate) {
    return c1.x == c2.x && c1.y == c2.y;
}

type TimeCoordinate = {
    readonly x: number;
    readonly y: number;
    readonly time: number;
}

function timeCoordinateToString(c: TimeCoordinate) {
    return c.x + "," + c.y + "," + c.time;
}

function manhattanDistance(c1: Coordinate, c2: Coordinate) {
    return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
}

interface Terrain {
    width: number;
    height: number;
    scan(scan: string): void;
    isOccupied(c: TimeCoordinate): boolean;
}

class Valley implements Terrain {
    private readonly layers: Terrain[] = [];

    constructor() {
        this.layers.push(new Wall());
        this.layers.push(new Blizzard("<"));
        this.layers.push(new Blizzard(">"));
        this.layers.push(new Blizzard("^"));
        this.layers.push(new Blizzard("v"));
    }

    scan(scan: string) {
        this.layers.forEach(layer => layer.scan(scan));
    }

    isOccupied(c: TimeCoordinate): boolean {
        return this.layers.some(layer => layer.isOccupied(c));
    }

    get width() {
        return this.layers.reduce((max, l) => Math.max(max, l.width), 0);
    }

    get height() {
        return this.layers.reduce((max, l) => Math.max(max, l.height), 0);
    }

    get entrance(): Coordinate {
        const width = this.width;
        for (let x = 0; x < width; ++x) {
            if (!this.layers[0].isOccupied({ x, y: 0, time: 0 })) return { x, y: 0 };
        }
        assert(false);
    }

    get exit(): Coordinate {
        const width = this.width;
        const bottom = this.height - 1;
        for (let x = 0; x < width; ++x) {
            if (!this.layers[0].isOccupied({ x, y: bottom, time: 0 })) return { x, y: bottom };
        }
        assert(false);
    }
}

class TerrainLayer implements Terrain {
    protected pattern: boolean[][] = [];
    protected readonly type: string;

    constructor(type: string) {
        this.type = type;
    }

    scan(scan: string) {
        this.pattern.push([]);
        for (const c of scan) {
            this.pattern[this.pattern.length - 1].push(c == this.type);
        }
    }

    isOccupied(c: TimeCoordinate): boolean {
        return this.pattern[c.y][c.x];
    }

    get width() {
        return this.pattern.reduce((max, l) => Math.max(max, l.length), 0);
    }

    get height() {
        return this.pattern.length;
    }
}

class Wall extends TerrainLayer {
    constructor() {
        super("#");
    }
}

function modulo(n: number, d: number) {
    return ((n % d) + d) % d;
}

class Blizzard extends TerrainLayer {
    private readonly dx;
    private readonly dy;

    constructor(type: Direction) {
        super(type);
        switch (type) {
            case "<":
                this.dx = -1;
                this.dy = 0;
                break;
            case ">":
                this.dx = 1;
                this.dy = 0;
                break;
            case "^":
                this.dx = 0;
                this.dy = -1;
                break;
            case "v":
                this.dx = 0;
                this.dy = 1;
                break;
        }
    }

    isOccupied(c: TimeCoordinate): boolean {
        if (c.y == 0 || c.y == this.pattern.length - 1) return false;
        if (c.x == 0 || c.x == this.pattern[c.y].length - 1) return false;
        const ty = modulo(c.y - 1 - c.time * this.dy, this.pattern.length - 2) + 1;
        const tx = modulo(c.x - 1 - c.time * this.dx, this.pattern[ty].length - 2) + 1;
        return this.pattern[ty][tx];
    }
}

class PathNode {
    private readonly valley: Valley;
    private readonly target: Coordinate;
    readonly position: TimeCoordinate;
    readonly heuristic: number;

    constructor(valley: Valley, target: Coordinate, position: TimeCoordinate) {
        this.valley = valley;
        this.target = target;
        this.position = position;
        this.heuristic = this.position.time + manhattanDistance(this.position, this.target);
    }

    get children() {
        const children = [];
        const wait = { x: this.position.x, y: this.position.y, time: this.position.time + 1 };
        if (!this.valley.isOccupied(wait)) children.push(new PathNode(this.valley, this.target, wait));
        const north = { x: this.position.x, y: this.position.y - 1, time: this.position.time + 1 };
        if (north.y >= 0 && !this.valley.isOccupied(north)) children.push(new PathNode(this.valley, this.target, north));
        const south = { x: this.position.x, y: this.position.y + 1, time: this.position.time + 1 };
        if (south.y < this.valley.height && !this.valley.isOccupied(south)) children.push(new PathNode(this.valley, this.target, south));
        const east = { x: this.position.x + 1, y: this.position.y, time: this.position.time + 1 };
        if (east.x < this.valley.width && !this.valley.isOccupied(east)) children.push(new PathNode(this.valley, this.target, east));
        const west = { x: this.position.x - 1, y: this.position.y, time: this.position.time + 1 };
        if (west.x >= 0 && !this.valley.isOccupied(west)) children.push(new PathNode(this.valley, this.target, west));
        return children;
    }
}

class SortedPathNodeSet {
    private list: PathNode[] = [];
    private listIndex: Map<String, PathNode> = new Map();

    add(n: PathNode) {
        const key = timeCoordinateToString(n.position);
        if (!this.listIndex.has(key)) {
            this.list.push(n);
            this.listIndex.set(key, n);
        }
    };

    pop(): PathNode | undefined {
        this.list.sort((a, b) => b.heuristic - a.heuristic)
        const node = this.list.pop();
        if (node) this.listIndex.delete(timeCoordinateToString(node.position));
        return node;
    }
}

function searchShortestPath(valley: Valley, from: TimeCoordinate, to: Coordinate) {
    const todo: SortedPathNodeSet = new SortedPathNodeSet();
    const visited: Set<string> = new Set<string>();
    todo.add(new PathNode(valley, to, from));

    let current: PathNode | undefined;
    while (current = todo.pop()) {
        if (current.position.x == to.x && current.position.y == to.y) {
            return current.position.time;
        }
        visited.add(timeCoordinateToString(current.position));
        for (let child of current.children) {
            if (!visited.has(timeCoordinateToString(child.position))) {
                todo.add(child);
            }
        }
    }

    return null;
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const valley = new Valley();
    for await (const line of rl) {
        valley.scan(line);
    }

    const shortestPath = searchShortestPath(valley, { ...valley.entrance, time: 0 }, valley.exit);

    console.log("The minimum amount of time needed to pass the blizzard is " + shortestPath);
}

part1("data/day24.txt");