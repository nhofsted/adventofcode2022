import fs = require('fs');
import readline = require('readline');

function toSNAFU(n: number): string {
    let s = "";
    while (n > 0) {
        const d = n % 5;
        if (d < 3) s = d + s;
        else if (d == 3) s = "=" + s;
        else s = "-" + s;
        n = Math.floor(n / 5);
        if (d > 2) n += 1;
    }
    return s;
}

const charCode0 = "0".charCodeAt(0);

function toDecimal(s: string): number {
    let n = 0;
    for (let i = 0; i < s.length; ++i) {
        n *= 5;
        switch (s.charAt(i)) {
            case '0':
            case '1':
            case '2':
                n += (s.charCodeAt(i) - charCode0);
                break;
            case '=':
                n -= 2;
                break;
            case '-':
                n -= 1;
                break;
        }
    }
    return n;
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    let total = 0;
    for await (const line of rl) {
        total += toDecimal(line);
    }

    console.log("The SNAFU number I supply to Bob's console is ", toSNAFU(total));
}

part1("data/day25.txt");