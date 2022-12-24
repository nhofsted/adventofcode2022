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

part1("data/day18.txt");