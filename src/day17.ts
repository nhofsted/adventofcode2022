import fs = require('fs');
import readline = require('readline');

const pieces = [
    [
        0b000111100,
    ],
    [
        0b000010000,
        0b000111000,
        0b000010000,
    ],
    [
        0b000111000,
        0b000001000,
        0b000001000,
    ],
    [
        0b000100000,
        0b000100000,
        0b000100000,
        0b000100000,
    ],
    [
        0b000110000,
        0b000110000,
    ]
];

function print(field: number[], height: number) {
    if (height > 30) return;
    for (let h = field.length; h-- > 0;) {
        console.log(h.toString(36) + " " + field[h].toString(2).replaceAll("0", ".").replaceAll("1", "#"));
    }
    console.log("Height = " + height);
}

function checkCycles(deltaHeights: number[], minimumPatternLength: number) {
    p: for (let period = minimumPatternLength; period < Math.floor(deltaHeights.length / 2); ++period) {
        for (let offset = 0; offset < period; ++offset) {
            if (deltaHeights[deltaHeights.length - offset - 1] != deltaHeights[deltaHeights.length - offset - period - 1]) continue p;
        }
        return { cycleFound: true, start: deltaHeights.length - 2 * period - 1, period };
    }
    return { cycleFound: false, start: 0, period: 0 };
}

function calculateTowerHeight(pieces: number, startHeights: number[], cumulativeHeight: number[]) {
    if (pieces < startHeights.length) return startHeights[pieces-1];
    let sum = startHeights[startHeights.length - 1];
    const repeatCount = Math.floor((pieces - startHeights.length) / cumulativeHeight.length)
    sum += repeatCount * cumulativeHeight[cumulativeHeight.length - 1];
    const repeatIndex = (pieces - startHeights.length) % cumulativeHeight.length;
    sum += cumulativeHeight[repeatIndex - 1];
    return sum;
}

async function parts(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    let jetPattern = "";
    for await (const line of rl) {
        jetPattern = jetPattern + line;
    }

    // Not the minimum pattern possible, but if we find a pattern larger than this it isn't a false positive
    // /3 because each piece uses at least 3 jets.
    const minimumPatternLength = Math.floor(jetPattern.length / 3);
    const deltaHeights: number[] = [];
    const field = [0b111111111];
    let pieceIndex = 0;
    let jetIndex = 0;
    let towerHeight = 0;
    let piecesDropped = 0;
    let cycleFound = false;
    let period = 0;
    let start = 0;
    while (!cycleFound) {
        // spawn
        const piece = [...pieces[pieceIndex]];
        for (let e = field.length; e < towerHeight + 1 + 3 + piece.length; ++e) field.push(0b100000001);
        let h = towerHeight + 1 + 3 + 1;
        print(field, towerHeight);
        // fall
        while (h-- > 0) {
            // jet
            switch (jetPattern[jetIndex]) {
                case '<':
                    if (piece.some((p, i) => ((p << 1) & field[h + i]))) break;
                    piece.forEach((p, i) => piece[i] = p << 1);
                    break;
                case '>':
                    if (piece.some((p, i) => ((p >> 1) & field[h + i]))) break;
                    piece.forEach((p, i) => piece[i] = p >> 1);
                    break;
            }
            // drop
            jetIndex = (jetIndex + 1) % jetPattern.length;
            if (piece.some((p, i) => (field[h - 1 + i] & p))) break;
        }
        // settle
        piece.forEach((p, i) => field[h + i] = field[h + i] | p);
        const previousTowerHeight = towerHeight;
        towerHeight = Math.max(towerHeight, h + piece.length - 1);
        deltaHeights.push(towerHeight - previousTowerHeight);
        pieceIndex = (pieceIndex + 1) % pieces.length;

        ++piecesDropped;

        if (piecesDropped == 2022) {
            console.log("The tower's height after 2022 drops is " + towerHeight);
        }

        // look for a pattern from time to time
        if (piecesDropped % minimumPatternLength == 0) {
            ({ cycleFound, start, period } = checkCycles(deltaHeights, minimumPatternLength));
        }
    }

    const startHeights: number[] = [deltaHeights[0]];
    const cumulativeHeight: number[] = [deltaHeights[start]];
    for (let i = 1; i < start; ++i) startHeights.push(startHeights[i - 1] + deltaHeights[i]);
    for (let i = 1; i < period; ++i) cumulativeHeight.push(cumulativeHeight[i - 1] + deltaHeights[i + start]);

    console.log("The tower's height after 2022 drops is " + calculateTowerHeight(2022, startHeights, cumulativeHeight));
    console.log("The tower's height after 1000000000000 drops is " + calculateTowerHeight(1000000000000, startHeights, cumulativeHeight));
}

parts("data/day17.txt");