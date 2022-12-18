import fs = require('fs');
import readline = require('readline');

class Valve {
    readonly name: string;
    readonly flowRate: number;
    readonly neighbours: string[] = [];

    constructor(name: string, flowrate: number, neighbours: string[]) {
        this.name = name;
        this.flowRate = flowrate;
        this.neighbours = neighbours;
    }
}

class StrategyNode {
    readonly parent: StrategyNode | undefined;
    readonly time: number;
    readonly released: number;
    readonly flowRate: number;
    readonly position: Valve;
    private _closedValves: Valve[];
    private releaseValves: Valve[];
    private valveDistances: Map<string, Map<string, number>>;

    constructor(parent: StrategyNode | undefined, time: number, released: number, flowRate: number, position: Valve, closedValves: Valve[], releaseValves: Valve[], valveDistances: Map<string, Map<string, number>>) {
        this.parent = parent;
        this.time = time;
        this.released = released;
        this.flowRate = flowRate;
        this.position = position;
        this._closedValves = [...closedValves];
        this.releaseValves = releaseValves;
        this.valveDistances = valveDistances;
    }

    getChildren(): StrategyNode[] {
        const children: StrategyNode[] = [];

        // open
        if (this._closedValves.some(c => c.name == this.position.name)) {
            if (this.time < 30) {
                children.push(new StrategyNode(this, this.time + 1, this.released + this.flowRate + this.position.flowRate, this.flowRate + this.position.flowRate, this.position, this._closedValves.filter(v => v.name != this.position.name), this.releaseValves, this.valveDistances));
            }
        }

        // move
        for (const v of this._closedValves) {                                   // move to an unopened valve
            if (v.name != this.position.name) {                                 // (that is't yourself)
                const distance = this.valveDistances.get(this.position.name)!.get(v.name)!;
                if (this.time + distance < 30) {                            // and only visit valves you can reach in time
                    children.push(new StrategyNode(this, this.time + distance, this.released + this.flowRate * distance, this.flowRate, v, this._closedValves, this.releaseValves, this.valveDistances));
                }
            }
        }

        // wait
        if (children.length == 0 && this.time < 30) {
            const waitTime = 30 - this.time;
            children.push(new StrategyNode(this, 30, this.released + this.flowRate * waitTime, this.flowRate, this.position, this._closedValves, this.releaseValves, this.valveDistances));
        }

        // sort somewhat greedy
        children.sort((n1, n2) => n2.flowRate - n1.flowRate);   // TODO n2.position.flowRate - n1.position.flowRate

        return children;
    }

    getOptimisticEstimate(): number {
        let time = this.time;
        let released = this.released;
        let flowRate = this.flowRate;
        this._closedValves.sort((v1, v2) => v2.flowRate - v1.flowRate);
        for (const v of this._closedValves) {
            // open
            if (time > 30) break;
            time++;
            released += flowRate + v.flowRate;
            flowRate += v.flowRate;
            // move
            if (time > 30) break;
            time++;
            released += flowRate;
        }
        while (time++ < 30) {
            released += flowRate;
        }
        return released;
    }
}

function findShortestPath(valves: Map<string, Valve>, v1: string, v2: string): number | undefined {
    let openNodes: string[] = [];
    let nextNodes: string[] = [];
    const visitedNodes = new Set<String>();
    openNodes.push(v1);
    let distance = 0;
    while (openNodes.length) {
        for (const v of openNodes) {
            if (v == v2) return distance;
            if (!visitedNodes.has(v)) {
                nextNodes.push(...valves.get(v)!.neighbours)
                visitedNodes.add(v);
            }
        }
        openNodes = nextNodes;
        nextNodes = [];
        distance++;
    }
    return undefined;
}

function largestRelease(n: StrategyNode, largest: number = 0): number {
    if (n.time == 30) return Math.max(n.released, largest);
    for (const c of n.getChildren()) {
        if (c.getOptimisticEstimate() > largest) {
            largest = Math.max(largest, largestRelease(c, largest));
        }
    }
    return largest;
}

async function readValves(rl: readline.Interface) {
    const valves: Map<string, Valve> = new Map();
    for await (const line of rl) {
        // Valve AA has flow rate=0; tunnels lead to valves DD, II, BB
        const data = line.matchAll(/\d+|[A-Z]{2}/g);
        const name = data.next().value[0];
        const flowRate = Number.parseInt(data.next().value[0]);
        const neighbours: string[] = [];
        let value = data.next();
        while (!value.done) {
            neighbours.push(value.value[0]);
            value = data.next();
        }
        valves.set(name, new Valve(name, flowRate, neighbours));
    }
    return valves;
}

function filterReleaseValves(valves: Map<string, Valve>) {
    const releaseValves: Valve[] = [];
    for (const valveEntry of valves) {
        const valve = valveEntry[1];
        if (valve.flowRate > 0) {
            releaseValves.push(valve);
        }
    }
    return releaseValves;
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const valves: Map<string, Valve> = await readValves(rl);
    const releaseValves: Valve[] = filterReleaseValves(valves);

    const valveDistances: Map<string, Map<string, number>> = new Map();
    for (const valveEntry1 of valves) {
        const valve1 = valveEntry1[1];
        if (!valveDistances.has(valve1.name)) valveDistances.set(valve1.name, new Map());
        for (const valveEntry2 of valves) {
            const valve2 = valveEntry2[1];
            valveDistances.get(valve1.name)!.set(valve2.name, findShortestPath(valves, valve1.name, valve2.name)!);
        }
    }

    const root = new StrategyNode(undefined, 1, 0, 0, valves.get("AA")!, releaseValves, releaseValves, valveDistances);
    const result = largestRelease(root);

    console.log("The largest release possible is " + result);
}

part1("data/day16.txt");