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

async function parts(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    let jetPattern = "";
    for await (const line of rl) {
        jetPattern = jetPattern + line;
    }

    const field = [0b111111111];
    let pieceIndex = 0;
    let jetIndex = 0;
    let towerHeight = 0;
    for (let i = 0; i < 2022; ++i) {
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
        towerHeight = Math.max(towerHeight, h + piece.length - 1);
        pieceIndex = (pieceIndex + 1) % pieces.length;
    }

    console.log("The tower's height after 2022 drops is " + towerHeight);
}

parts("data/day17.txt");