import fs = require('fs');
import readline = require('readline');

type Coordinate = {
    x: number;
    y: number;
}

function manhattanDistance(p1: Coordinate, p2: Coordinate): number {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

class HorizontalLineSegment {
    readonly x1: number;
    readonly x2: number;

    constructor(x1: number, x2: number) {
        this.x1 = Math.min(x1, x2);
        this.x2 = Math.max(x1, x2);
    }

    contains(x: number): boolean {
        return x >= this.x1 && x <= this.x2;
    }
}

class Sensor {
    readonly pos: Coordinate;
    readonly size: number;

    constructor(pos: Coordinate, size: number) {
        this.pos = pos;
        this.size = size;
    }

    intersectHorizontally(y: number): HorizontalLineSegment | null {
        const yDistance = Math.abs(this.pos.y - y);
        if (yDistance > this.size) return null;
        const yDiff = yDistance - this.size;
        return new HorizontalLineSegment(this.pos.x - yDiff, this.pos.x + yDiff);
    }
}

async function part1(path: string, position: number) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const sensors: Sensor[] = [];
    const beaconPositions: Coordinate[] = [];

    for await (const line of rl) {
        const numbers = line.match(/Sensor at x=([0-9-]+), y=([0-9-]+): closest beacon is at x=([0-9-]+), y=([0-9-]+)/);
        const sensorPosition = { x: Number.parseInt(numbers![1]), y: Number.parseInt(numbers![2]) };
        const beaconPosition = { x: Number.parseInt(numbers![3]), y: Number.parseInt(numbers![4]) };
        beaconPositions.push(beaconPosition);
        sensors.push(new Sensor(sensorPosition, manhattanDistance(sensorPosition, beaconPosition)));
    }

    const segments: HorizontalLineSegment[] = [];
    for (const sensor of sensors) {
        const segment = sensor.intersectHorizontally(position);
        if (segment) segments.push(segment);
    }

    const points = segments.reduce<number[]>((acc, cur) => {
        acc.push(cur.x1, cur.x2);
        return acc;
    }, []).sort((a, b) => a - b);

    let currentPos: number | undefined;
    let filled = 0;
    for (const point of points) {
        if (currentPos !== undefined && segments.find(s => s.contains(currentPos! + 1))) {
            filled += point - currentPos - 1;
        }
        ++filled;
        currentPos = point;
    }

    filled -= sensors.filter(s => s.pos.y == position).length;
    filled -= new Set(beaconPositions.filter(b => b.y == position).map(p => p.x)).size;

    console.log("In the row where y=" + position + ", " + filled + " position" + ((filled != 0) ? "s" : "") + " cannot contain a beacon.");
}

async function parts() {
    await part1("data/day15.txt", 10);
    await part1("data/day15.txt", 2000000);
}

parts();