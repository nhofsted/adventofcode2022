import fs = require('fs');
import readline = require('readline');

type Elf = {
    x: number;
    y: number;
}

type Cave = {
    elves: Elf[];
}

function nextPosition(elf: Elf, positions: Set<string>, startDirection: number): Elf | null {
    for (let i = 0; i < 4; ++i) {
        const noElfN = !positions.has(JSON.stringify({ x: elf.x, y: elf.y - 1 }));
        const noElfNE = !positions.has(JSON.stringify({ x: elf.x + 1, y: elf.y - 1 }));
        const noElfE = !positions.has(JSON.stringify({ x: elf.x + 1, y: elf.y }));
        const noElfSE = !positions.has(JSON.stringify({ x: elf.x + 1, y: elf.y + 1 }));
        const noElfS = !positions.has(JSON.stringify({ x: elf.x, y: elf.y + 1 }));
        const noElfSW = !positions.has(JSON.stringify({ x: elf.x - 1, y: elf.y + 1 }));
        const noElfW = !positions.has(JSON.stringify({ x: elf.x - 1, y: elf.y }));
        const noElfNW = !positions.has(JSON.stringify({ x: elf.x - 1, y: elf.y - 1 }));

        if (noElfN && noElfNE && noElfE && noElfSE && noElfS && noElfSW && noElfW && noElfNW) return null;

        const direction = (i + startDirection) % 4;
        switch (direction) {
            case 0:
                if (noElfNW && noElfN && noElfNE) return { x: elf.x, y: elf.y - 1 };
                break;
            case 1:
                if (noElfSW && noElfS && noElfSE) return { x: elf.x, y: elf.y + 1 };
                break;
            case 2:
                if (noElfNW && noElfW && noElfSW) return { x: elf.x - 1, y: elf.y };
                break;
            case 3:
                if (noElfNE && noElfE && noElfSE) return { x: elf.x + 1, y: elf.y };
                break;
        }
    }
    return null;
}

function getBounds(cave: Cave) {
    let minx = Number.POSITIVE_INFINITY;
    let maxx = Number.NEGATIVE_INFINITY;
    let miny = Number.POSITIVE_INFINITY;
    let maxy = Number.NEGATIVE_INFINITY;
    cave.elves.forEach(elf => {
        minx = Math.min(minx, elf.x);
        maxx = Math.max(maxx, elf.x);
        miny = Math.min(miny, elf.y);
        maxy = Math.max(maxy, elf.y);
    });
    return { maxx, minx, maxy, miny };
}

function print(cave: Cave, positions: Set<string>) {
    console.log("---");
    let { maxx, minx, maxy, miny } = getBounds(cave);
    for (let y = miny; y <= maxy; ++y) {
        let row = "";
        for (let x = minx; x <= maxx; ++x) {
            row += positions.has(JSON.stringify({ x, y })) ? "#" : ".";
        }
        console.log(row);
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const cave: Cave = { elves: [] };
    let y = 0;
    for await (const line of rl) {
        for (let x = 0; x < line.length; ++x) {
            if (line.charAt(x) == "#") cave.elves.push({ x, y });
        }
        ++y;
    }

    let startDirection = 0;
    for (let round = 0; round < 10; ++round) {
        const positions = new Set<string>();
        cave.elves.forEach(elf => positions.add(JSON.stringify(elf)));
        print(cave, positions);
        const nextElfPositions = new Map<string, Elf>();
        const claims = new Map<string, number>();
        cave.elves.forEach(elf => {
            const nextElf = nextPosition(elf, positions, startDirection);
            if (nextElf) {
                const nextString = JSON.stringify(nextElf);
                const elfString = JSON.stringify(elf);
                nextElfPositions.set(elfString, nextElf);
                let claim = claims.get(nextString) ?? 0;
                claims.set(nextString, ++claim);
            }
        });
        cave.elves.forEach(elf => {
            const elfString = JSON.stringify(elf);
            const nextElf = nextElfPositions.get(elfString)!;
            const nextString = JSON.stringify(nextElf);
            if (claims.get(nextString) == 1) {
                elf.x = nextElf.x;
                elf.y = nextElf.y;
            }
        });
        startDirection = (startDirection + 1) % 4;
    }
    let { maxx, minx, maxy, miny } = getBounds(cave);

    console.log("The number of empty ground tiles is " + ((maxx - minx + 1) * (maxy - miny + 1) - cave.elves.length));
}

part1("data/day23.txt");