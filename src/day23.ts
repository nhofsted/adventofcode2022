import fs = require('fs');
import readline = require('readline');

type Elf = {
    x: number;
    y: number;
}

type Cave = {
    elves: Elf[];
}

function elfToString(elf: Elf): string {
    return elf.x + "," + elf.y;
}

function nextPosition(elf: Elf, positions: Set<string>, startDirection: number): Elf | null {
    for (let i = 0; i < 4; ++i) {
        const noElfN = !positions.has(elfToString({ x: elf.x, y: elf.y - 1 }));
        const noElfNE = !positions.has(elfToString({ x: elf.x + 1, y: elf.y - 1 }));
        const noElfE = !positions.has(elfToString({ x: elf.x + 1, y: elf.y }));
        const noElfSE = !positions.has(elfToString({ x: elf.x + 1, y: elf.y + 1 }));
        const noElfS = !positions.has(elfToString({ x: elf.x, y: elf.y + 1 }));
        const noElfSW = !positions.has(elfToString({ x: elf.x - 1, y: elf.y + 1 }));
        const noElfW = !positions.has(elfToString({ x: elf.x - 1, y: elf.y }));
        const noElfNW = !positions.has(elfToString({ x: elf.x - 1, y: elf.y - 1 }));

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
            row += positions.has(elfToString({ x, y })) ? "#" : ".";
        }
        console.log(row);
    }
}

async function parts(path: string) {
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
    let round = 0;
    let progress = true;
    const positions = new Set<string>();
    const nextElfPositions = new Map<string, Elf>();
    const claims = new Map<string, number>();
    while (progress) {
        progress = false;
        positions.clear();
        cave.elves.forEach(elf => positions.add(elfToString(elf)));
        //print(cave, positions);
        nextElfPositions.clear();
        claims.clear();
        cave.elves.forEach(elf => {
            const nextElf = nextPosition(elf, positions, startDirection);
            if (nextElf) {
                const elfString = elfToString(elf);
                const nextString = elfToString(nextElf);
                nextElfPositions.set(elfString, nextElf);
                let claim = claims.get(nextString) ?? 0;
                claims.set(nextString, ++claim);
            }
        });
        cave.elves.forEach(elf => {
            const elfString = elfToString(elf);
            const nextElf = nextElfPositions.get(elfString);
            if(nextElf){
                const nextString = elfToString(nextElf);
                if (claims.get(nextString) == 1) {
                    elf.x = nextElf.x;
                    elf.y = nextElf.y;
                    progress = true;
                }
            }
        });
        startDirection = (startDirection + 1) % 4;
        round++;
        if (round == 10) {
            let { maxx, minx, maxy, miny } = getBounds(cave);
            console.log("The number of empty ground tiles after round 10 is " + ((maxx - minx + 1) * (maxy - miny + 1) - cave.elves.length));
        }
    }
    console.log("The number of rounds before no elf moves is " + round);
}

parts("data/day23.txt");