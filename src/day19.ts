import fs = require('fs');
import readline = require('readline');

class PerResource<Type> {
    readonly ore: Type;
    readonly clay: Type;
    readonly obsidian: Type;
    readonly geode: Type;

    constructor({ ore, clay, obsidian, geode, defaultValue }: { ore?: Type, clay?: Type, obsidian?: Type, geode?: Type, defaultValue: Type }) {
        this.ore = ore ?? defaultValue;
        this.clay = clay ?? defaultValue;
        this.obsidian = obsidian ?? defaultValue;
        this.geode = geode ?? defaultValue;
    }
}

class Resources extends PerResource<number> {
    constructor({ ore, clay, obsidian, geode, defaultValue = 0 }: { ore?: number, clay?: number, obsidian?: number, geode?: number, defaultValue?: number }) {
        super({ ore, clay, obsidian, geode, defaultValue: defaultValue });
    }

    largerOrEqual(other: Resources) {
        return this.ore >= other.ore
            && this.clay >= other.clay
            && this.obsidian >= other.obsidian
            && this.geode >= other.geode;
    }

    subtract(other: Resources): Resources {
        return new Resources({
            ore: this.ore - other.ore,
            clay: this.clay - other.clay,
            obsidian: this.obsidian - other.obsidian,
            geode: this.geode - other.geode
        });
    }

    add(other: Resources): Resources {
        return new Resources({
            ore: this.ore + other.ore,
            clay: this.clay + other.clay,
            obsidian: this.obsidian + other.obsidian,
            geode: this.geode + other.geode
        });
    }
}

class RobotType {
    readonly costs: Resources;

    constructor(costs: Resources) {
        this.costs = costs;
    }
}

class RobotTypes extends PerResource<RobotType>{
    constructor({ ore, clay, obsidian, geode }: { ore?: RobotType, clay?: RobotType, obsidian?: RobotType, geode?: RobotType }) {
        super({ ore, clay, obsidian, geode, defaultValue: new RobotType(new Resources({ defaultValue: Number.POSITIVE_INFINITY })) });
    }
}

type Blueprint = {
    readonly id: number;
    readonly robotTypes: RobotTypes;
}

abstract class SearchNode {
    parent: SearchNode | undefined;

    constructor(parent?: SearchNode) {
        this.parent = parent;
    }

    abstract get value(): number;
    abstract get children(): SearchNode[];
    abstract get optimisticEstimate(): number;
}

class BluePrintSearchNode extends SearchNode {
    readonly time: number;
    readonly maxTime: number;
    readonly inventory: Resources;
    readonly robots: Resources;
    readonly blueprint: Blueprint;

    constructor(time: number, inventory: Resources, robots: Resources, blueprint: Blueprint, maxTime: number, parent?: BluePrintSearchNode) {
        super(parent);
        this.time = time;
        this.maxTime = maxTime;
        this.inventory = inventory;
        this.robots = robots;
        this.blueprint = blueprint;
    }

    get value(): number {
        return this.inventory.geode;
    }

    get children(): BluePrintSearchNode[] {
        const children: BluePrintSearchNode[] = [];
        if (this.time == this.maxTime) return children;
        const buildOptions: { robots: Resources, inventory: Resources }[] = this.getBuildOptions(this.inventory);
        for (const option of buildOptions) {
            const nextRobotOptions = this.robots.add(option.robots);
            const nextInventory = option.inventory.add(this.robots);
            children.push(new BluePrintSearchNode(this.time + 1, new Resources(nextInventory), new Resources(nextRobotOptions), this.blueprint, this.maxTime, this));
        }
        return children;
    }

    private getBuildOptions(resources: Resources) {
        const buildOptions = [];
        if (resources.largerOrEqual(this.blueprint.robotTypes.ore.costs)) buildOptions.push({ robots: new Resources({ ore: 1 }), inventory: resources.subtract(this.blueprint.robotTypes.ore.costs) });
        if (resources.largerOrEqual(this.blueprint.robotTypes.clay.costs)) buildOptions.push({ robots: new Resources({ clay: 1 }), inventory: resources.subtract(this.blueprint.robotTypes.clay.costs) });
        if (resources.largerOrEqual(this.blueprint.robotTypes.obsidian.costs)) buildOptions.push({ robots: new Resources({ obsidian: 1 }), inventory: resources.subtract(this.blueprint.robotTypes.obsidian.costs) });
        if (resources.largerOrEqual(this.blueprint.robotTypes.geode.costs)) buildOptions.push({ robots: new Resources({ geode: 1 }), inventory: resources.subtract(this.blueprint.robotTypes.geode.costs) });
        buildOptions.push({ robots: new Resources({}), inventory: new Resources(resources) });
        return buildOptions;
    }

    get optimisticEstimate(): number {
        let robots = new Resources(this.robots);
        let inventory = new Resources(this.inventory);
        let time = this.time;
        while (time < this.maxTime) {
            let newInventory = inventory.add(robots);
            if (inventory.largerOrEqual(this.blueprint.robotTypes.ore.costs)) robots = robots.add(new Resources({ ore: 1 }));
            if (inventory.largerOrEqual(this.blueprint.robotTypes.clay.costs)) robots = robots.add(new Resources({ clay: 1 }));
            if (inventory.largerOrEqual(this.blueprint.robotTypes.obsidian.costs)) robots = robots.add(new Resources({ obsidian: 1 }));
            if (inventory.largerOrEqual(this.blueprint.robotTypes.geode.costs)) {
                robots = robots.add(new Resources({ geode: 1 }));
                newInventory = newInventory.subtract(this.blueprint.robotTypes.geode.costs);
            }
            inventory = newInventory;
            time++;
        }
        return inventory.geode;
    }
}

function findLargestLeaf(n: SearchNode, largest: number = 0): number {
    const children = n.children;
    if (children.length == 0) return Math.max(n.value, largest);
    for (const c of children) {
        if (c.optimisticEstimate > largest) {
            largest = Math.max(largest, findLargestLeaf(c, largest));
        }
    }
    return largest;
}

async function parts(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    let qualitySum24 = 0;
    let maxProduct32 = 1;
    for await (const line of rl) {
        const m = line.match(/Blueprint (\d+): Each ore robot costs (\d+) ore. Each clay robot costs (\d+) ore. Each obsidian robot costs (\d+) ore and (\d+) clay. Each geode robot costs (\d+) ore and (\d+) obsidian./)!.map(s => Number.parseInt(s));
        const bluePrint = {
            id: m[1],
            robotTypes: new RobotTypes({
                ore: new RobotType(new Resources({ ore: m[2] })),
                clay: new RobotType(new Resources({ ore: m[3] })),
                obsidian: new RobotType(new Resources({ ore: m[4], clay: m[5] })),
                geode: new RobotType(new Resources({ ore: m[6], obsidian: m[7] })),
            })
        }
        const mostObsidian24 = findLargestLeaf(new BluePrintSearchNode(1, new Resources({}), new Resources({ ore: 1 }), bluePrint, 25));
        console.log("Blueprint " + bluePrint.id + " collects " + mostObsidian24 + " geodes in 24 minutes");
        qualitySum24 += bluePrint.id * mostObsidian24;

        if (bluePrint.id < 4) {
            const mostObsidian32 = findLargestLeaf(new BluePrintSearchNode(1, new Resources({}), new Resources({ ore: 1 }), bluePrint, 33));
            console.log("Blueprint " + bluePrint.id + " collects " + mostObsidian32 + " geodes in 32 minutes");
            maxProduct32 = maxProduct32 * mostObsidian32;
        }
    }

    console.log("The quality level of all of the blueprints in 24 minutes is " + qualitySum24);
    console.log("The maximum one of the first three blueprints can collect is " + maxProduct32);
}

parts("data/day19.txt");