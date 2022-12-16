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

function intersectSensors(sensors: Sensor[], position: number) {
    const segments: HorizontalLineSegment[] = [];
    for (const sensor of sensors) {
        const segment = sensor.intersectHorizontally(position);
        if (segment)
            segments.push(segment);
    }

    const points = segments.reduce<number[]>((acc, cur) => {
        acc.push(cur.x1, cur.x2);
        return acc;
    }, []).sort((a, b) => a - b);
    return { points, segments };
}

function testPoint(segments: HorizontalLineSegment[], point: number, searchZone: number): boolean {
    if (point < 0 || point > searchZone) return false;
    return segments.find(s => s.contains(point)) === undefined;
}

function findDistressBeacon(sensors: Sensor[], position: number, searchZone: number) {
    let distress: Coordinate | undefined;
    for (let y = 0; y <= searchZone; ++y) {
        const { points, segments }: { points: number[]; segments: HorizontalLineSegment[]; } = intersectSensors(sensors, y);
        if (points.length == 0) {
            return { x: 0, y };
        }
        for (const point of points) {
            if (testPoint(segments, point - 1, searchZone)) {
                return { x: point - 1, y };
            }
            if (testPoint(segments, point + 1, searchZone)) {
                return { x: point + 1, y };
            }
        }
    }
    return distress;
}

async function part(path: string, position: number) {
    const searchZone = position * 2;

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

    const { points, segments }: { points: number[]; segments: HorizontalLineSegment[]; } = intersectSensors(sensors, position);

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

    let distress: Coordinate | undefined = findDistressBeacon(sensors, position, searchZone);

    if (distress !== undefined) {
        console.log("The tuning frequency of the distress signal is " + (distress.x * 4000000 + distress.y));
    } else {
        console.log("No distress beacon found");
    }
}

async function parts(path: string) {
    await part(path, 10);
    await part(path, 2000000);
}

parts("data/day15.txt");