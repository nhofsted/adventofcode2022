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

class WorldFacts {
    readonly maxTime = 30;
    readonly releaseValves: string[];
    readonly valves: Map<string, Valve>;
    private valveDistances: Map<string, Map<string, number>>;

    constructor(valves: Map<string, Valve>) {
        this.valves = valves;
        this.releaseValves = WorldFacts.filterReleaseValves(valves).map(v => v.name);
        this.valveDistances = new Map();
        for (const valveEntry1 of valves) {
            const valve1 = valveEntry1[1];
            if (!this.valveDistances.has(valve1.name)) this.valveDistances.set(valve1.name, new Map());
            for (const valveEntry2 of valves) {
                const valve2 = valveEntry2[1];
                this.valveDistances.get(valve1.name)!.set(valve2.name, WorldFacts.findShortestPath(valves, valve1.name, valve2.name)!);
            }
        }
    }

    getValve(name: string): Valve {
        return this.valves.get(name)!;
    }

    getDistance(valve1: string, valve2: string): number {
        return this.valveDistances.get(valve1)!.get(valve2)!;
    }

    private static filterReleaseValves(valves: Map<string, Valve>) {
        const releaseValves: Valve[] = [];
        for (const valveEntry of valves) {
            const valve = valveEntry[1];
            if (valve.flowRate > 0) {
                releaseValves.push(valve);
            }
        }
        return releaseValves;
    }

    private static findShortestPath(valves: Map<string, Valve>, v1: string, v2: string): number | undefined {
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
}

type Action = {
    readonly type: "OPEN" | "MOVE" | "WAIT";
    readonly valve: string;
    readonly time: number;
}

class WorldState {
    private facts: WorldFacts;
    readonly time;
    readonly released;
    readonly flowRate;
    readonly _closedValves: string[];

    constructor(facts: WorldFacts, time: number, released: number, flowRate: number, closedValves: string[]) {
        this.facts = facts;
        this.time = time;
        this.released = released;
        this.flowRate = flowRate;
        this._closedValves = [...closedValves];
    }

    nextState(actions: Action[]): WorldState {
        let newFlowRate = this.flowRate;
        let newClosedValves = this.closedValves;
        for (const action of actions) {
            if (action.type == "OPEN" && action.time == this.time) {
                if (newClosedValves.find(v => v == action.valve) != undefined) {
                    newFlowRate += this.facts.getValve(action.valve).flowRate;
                    newClosedValves = newClosedValves.filter(v => v != action.valve);
                }
            }
        }
        return new WorldState(this.facts, this.time + 1, this.released + newFlowRate, newFlowRate, newClosedValves);
    }

    get closedValves(): string[] {
        return [...this._closedValves];
    }
}

class MultiPersonStrategyNode {
    readonly parent: MultiPersonStrategyNode | undefined;
    readonly facts: WorldFacts;
    readonly state: WorldState;
    readonly actions: Action[];

    constructor(parent: MultiPersonStrategyNode | undefined, actions: Action[], state: WorldState, facts: WorldFacts) {
        this.parent = parent;
        this.state = state;
        this.facts = facts;
        this.actions = [...actions];
    }

    get time() { return this.state.time };

    get maxTime() { return this.facts.maxTime - ((this.actions.length - 1) * 4) };

    get released() { return this.state.released };

    get children(): MultiPersonStrategyNode[] {
        let actionOptions: Action[][] = [];
        actionOptions.push([]);
        for (const action of this.actions) {
            const expandedActionOptions: Action[][] = [];
            for (const nextAction of this.nextPossibleActions(action)) {
                for (const option of actionOptions) {
                    const expandedOption = [...option, nextAction];
                    expandedActionOptions.push(expandedOption);
                }
            }
            actionOptions = expandedActionOptions;
        }

        const children: MultiPersonStrategyNode[] = [];
        if (this.time < this.maxTime) {
            for (const actions of actionOptions) {
                children.push(new MultiPersonStrategyNode(this, actions, this.state.nextState(actions), this.facts));
            }
        }

        children.sort((n1, n2) => n2.state.flowRate - n1.state.flowRate);
        return children;
    }

    private nextPossibleActions(action: Action): Action[] {
        const actions: Action[] = [];
        if (action.time <= this.state.time) {
            if (this.state.time && this.state.closedValves.some(c => c == action.valve)) {
                actions.push({ type: "OPEN", valve: action.valve, time: this.state.time });
            }
            for (const v of this.state.closedValves) { // move to an unopened valve
                if (v != action.valve) { // (that isn't where you are now)
                    const distance = this.facts.getDistance(action.valve, v);
                    if (this.state.time + distance < this.facts.maxTime) { // and only visit valves you can reach in time
                        actions.push({ type: "MOVE", valve: v, time: this.state.time + distance });
                    }
                }
            }
        } else {
            actions.push(action);
        }
        if (actions.length == 0 && this.state.time < this.facts.maxTime) {
            actions.push({ type: "WAIT", valve: action.valve, time: this.facts.maxTime - this.state.time });
        }
        return actions;
    }

    get optimisticEstimate(): number {
        let time = this.time;
        let released = this.released;
        let flowRate = this.state.flowRate;
        const valves = this.state.closedValves;
        valves.sort((v1, v2) => this.facts.getValve(v2).flowRate - this.facts.getValve(v1).flowRate);
        let i = 0;
        while (i < valves.length) {
            // Everyone open a valve
            if (time > this.maxTime) break;
            for (const action of this.actions) {
                if (i < valves.length) {
                    const v = valves[i++];
                    flowRate += this.facts.getValve(v).flowRate;
                }
            }
            time++;
            released += flowRate;

            // move
            if (time > this.maxTime) break;
            time++;
            released += flowRate;
        }
        while (time++ < this.maxTime) {
            released += flowRate;
        }
        return released;
    }
}

function largestRelease(n: MultiPersonStrategyNode, largest: number = 0): number {
    if (n.time == n.maxTime) return Math.max(n.released, largest);
    for (const c of n.children) {
        if (c.optimisticEstimate > largest) {
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

async function parts(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const valves: Map<string, Valve> = await readValves(rl);

    const actions: Action[] = [];
    for (let i = 0; i < 2; ++i) {
        actions.push({ type: "MOVE", time: 1, valve: "AA" });
        const facts = new WorldFacts(valves);
        const root = new MultiPersonStrategyNode(undefined, actions, new WorldState(facts, 0, 0, 0, facts.releaseValves), facts);
        const result = largestRelease(root);

        console.log("The largest release possible with " + actions.length + " actors is " + result);
    }
}

parts("data/day16.txt");