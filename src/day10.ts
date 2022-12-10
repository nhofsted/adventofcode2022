import fs = require('fs');
import readline = require('readline');

class CPU {
    private time: number = 0;
    private register: number = 1;

    state() {
        return { time: this.time, register: this.register };
    }

    *compute(cycle: number) {
        for (let c = 0; c < cycle; ++c) {
            this.time++;
            yield this.state();
        }
    }

    async *run(input: readline.Interface) {
        let m;
        for await (const line of input) {
            if (line === "noop") {
                yield* this.compute(1);
            } else if (m = line.match(/addx (-?\d+)/)) {
                yield* this.compute(2);
                this.register += Number.parseInt(m[1]);
            }
        }
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);
    const cpu = new CPU();

    let signalStrength = 0;
    for await (const state of cpu.run(rl)) {
        if ((state.time - 20) % 40 == 0) {
            signalStrength += state.time * state.register;
        }
    }

    console.log("The sum of the signal strengths is " + signalStrength);
}

part1('data/day10.txt');