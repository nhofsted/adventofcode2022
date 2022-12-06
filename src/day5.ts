import fs = require('fs');
import readline = require('readline');

class Stack {
    private s: String[] = [];

    async readStackConfiguration(rl: readline.Interface) {
        for await (const line of rl) {
            if (!line.length) { // Done
                break;
            }
            let index = 0;
            for (const match of line.matchAll(/(   |\[.\]) ?/g)) {
                if (index >= this.s.length) {
                    this.s.push("");
                }
                const box = match[0];
                if (box[0] === '[') {
                    this.s[index] = box.charAt(1) + this.s[index];
                }
                ++index;
            }
        }
    }

    async executeRearrangementScript(rl: readline.Interface, multiBoxFeature: boolean) {
        for await (const line of rl) {
            const match = line.match(/move (\d+) from (\d+) to (\d+)/);
            if (match != null) {
                const amount = Number.parseInt(match[1]);
                const from = Number.parseInt(match[2]);
                const to = Number.parseInt(match[3]);
                const column = this.s[from - 1];
                const bottom = column.substring(0, column.length - amount);
                const top = column.substring(column.length - amount);
                this.s[from - 1] = bottom;
                if(multiBoxFeature) {
                    this.s[to - 1] += top;
                } else {
                    this.s[to - 1] += top.split("").reverse().join("");
                }
            }
        }
    }

    readTop() {
        let topBoxes = '';
        for (const column of this.s) {
            topBoxes += column.charAt(column.length - 1);
        }
        return topBoxes;
    }
}

async function part(path: string, multiBoxFeature: boolean) {
    const fileStream = fs.createReadStream(path);

    const rl = readline.createInterface({
        input: fileStream,
    });

    const s = new Stack();
    await s.readStackConfiguration(rl);
    await s.executeRearrangementScript(rl, multiBoxFeature);
    console.log(s.readTop());
}

part('data/day5.txt', false);
part('data/day5.txt', true);