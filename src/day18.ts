import fs = require('fs');
import readline = require('readline');

function set(droplet: number[][][], x: number, y: number, z: number, value: number) {
    if (x < 0 || y < 0 || z < 0) return;
    while (droplet.length <= x) droplet.push([]);
    while (droplet[x].length <= y) droplet[x].push([]);
    while (droplet[x][y].length <= z) droplet[x][y].push(0);
    droplet[x][y][z] = value;
}

function get(droplet: number[][][], x: number, y: number, z: number) {
    if (x < 0 || y < 0 || z < 0) return 0;
    if (x >= droplet.length) return 0;
    if (y >= droplet[x].length) return 0;
    if (z >= droplet[x][y].length) return 0;
    return droplet[x][y][z];
}

function add(droplet: number[][][], x: number, y: number, z: number, value: number) {
    set(droplet, x, y, z, get(droplet, x, y, z) + value);
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const droplet: number[][][] = [];
    for await (const line of rl) {
        let [x, y, z] = line.split(",").map(x => Number.parseInt(x));
        add(droplet, x, y, z, 6);
        add(droplet, x + 1, y, z, -1);
        add(droplet, x - 1, y, z, -1);
        add(droplet, x, y + 1, z, -1);
        add(droplet, x, y - 1, z, -1);
        add(droplet, x, y, z + 1, -1);
        add(droplet, x, y, z - 1, -1);
    }

    const area = droplet.reduce((sum, x) => sum + x.reduce((sum, y) => sum + y.reduce((sum, z) => (z > 0) ? sum + z : sum, 0), 0), 0);
    console.log("The surface area of the scanned lava droplet is " + area);
}


function markOutside(droplet: number[][][], x: number, y: number, z: number) {
    set(droplet, x, y, z, -1);
    if (get(droplet, x + 1, y, z) > 0) markExposed(droplet, x + 1, y, z);
    if (get(droplet, x - 1, y, z) > 0) markExposed(droplet, x - 1, y, z);
    if (get(droplet, x, y + 1, z) > 0) markExposed(droplet, x, y + 1, z);
    if (get(droplet, x, y - 1, z) > 0) markExposed(droplet, x, y - 1, z);
    if (get(droplet, x, y, z + 1) > 0) markExposed(droplet, x, y, z + 1);
    if (get(droplet, x, y, z - 1) > 0) markExposed(droplet, x, y, z - 1);
}

function markExposed(droplet: number[][][], x: number, y: number, z: number) {
    let value = get(droplet, x, y, z);
    value = (value & 0b1000) | ((value & 0b111) + 1);
    set(droplet, x, y, z, value);
}

function growExposed(droplet: number[][][], xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number, init = false) {
    let progress = false;
    for (let xidx = xmin; xidx < xmax; ++xidx) {
        for (let yidx = ymin; yidx < ymax; ++yidx) {
            for (let zidx = zmin; zidx < zmax; ++zidx) {
                const idxvalue = get(droplet, xidx, yidx, zidx);
                if (idxvalue < 0) continue;
                if (idxvalue > 0 && init) {
                    markExposed(droplet, xidx, yidx, zidx);
                    continue;
                }
                if (idxvalue == 0 && (init ||
                    get(droplet, xidx + 1, yidx, zidx) < 0 ||
                    get(droplet, xidx - 1, yidx, zidx) < 0 ||
                    get(droplet, xidx, yidx + 1, zidx) < 0 ||
                    get(droplet, xidx, yidx - 1, zidx) < 0 ||
                    get(droplet, xidx, yidx, zidx + 1) < 0 ||
                    get(droplet, xidx, yidx, zidx - 1) < 0)
                ) {
                    markOutside(droplet, xidx, yidx, zidx);
                    progress = true;
                }
            }
        }
    }
    return progress;
}

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const droplet: number[][][] = [];
    let xmax = 0;
    let ymax = 0;
    let zmax = 0;
    for await (const line of rl) {
        let [x, y, z] = line.split(",").map(x => Number.parseInt(x));
        set(droplet, x, y, z, 0b1000);
        xmax = Math.max(x + 1, xmax);
        ymax = Math.max(y + 1, ymax);
        zmax = Math.max(z + 1, zmax);
    }

    // do the sides
    growExposed(droplet, 0, xmax, 0, ymax, 0, 1, true);
    growExposed(droplet, 0, xmax, 0, ymax, zmax - 1, zmax, true);
    growExposed(droplet, 0, xmax, 0, 1, 0, zmax, true);
    growExposed(droplet, 0, xmax, ymax - 1, ymax, 0, zmax, true);
    growExposed(droplet, 0, 1, 0, ymax, 0, zmax, true);
    growExposed(droplet, xmax - 1, xmax, 0, ymax, 0, zmax, true);
    // keep filling until no progress
    while (growExposed(droplet, 0, xmax, 0, ymax, 0, zmax));

    const area = droplet.reduce((sum, x) => sum + x.reduce((sum, y) => sum + y.reduce((sum, z) => (z > 0) ? sum + (z & 0b111) : sum, 0), 0), 0);
    console.log("The external surface area of the scanned lava droplet is " + area);
}

async function parts(path: string) {
    await part1(path);
    await part2(path);
}

parts("data/day18.txt");