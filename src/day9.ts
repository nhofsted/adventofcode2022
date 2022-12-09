import fs = require('fs');
import readline = require('readline');

class Node {
    private x = 0;
    private y = 0;

    moveRight() {
        this.x += 1;
    }
    moveLeft() {
        this.x -= 1;
    }
    moveUp() {
        this.y += 1;
    }
    moveDown() {
        this.y -= 1;
    }

    follow(n: Node) {
        const deltaX = n.x - this.x;
        const deltaY = n.y - this.y;
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            this.y += Math.sign(deltaY);
            this.x += Math.sign(deltaX);
        }
    }

    get location() {
        return this.x + "," + this.y;
    }
}

async function part(path: string, length: number) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const visited: Set<String> = new Set();

    const rope = Array.from({ length: length }, () => new Node());
    const head = rope[0];
    const tail = rope[length - 1];

    const k0 = '0'.charCodeAt(0);

    for await (const line of rl) {
        const data = line.match(/([LRUD]) (\d+)/);
        const times = Number.parseInt(data![2]);
        for (let i = 0; i < times; ++i) {
            switch (data![1]) {
                case 'R':
                    head.moveRight();
                    break;
                case 'L':
                    head.moveLeft();
                    break;
                case 'U':
                    head.moveUp();
                    break;
                case 'D':
                    head.moveDown();
                    break;
            }
            for (let n = 1; n < length; ++n) {
                rope[n].follow(rope[n - 1]);
            }
            visited.add(tail.location);
        }
    }

    console.log("The tail of a rope with length " + length + " visited at least " + visited.size + " positions once.");
}

async function parts() {
    await part('data/day9.txt', 2);
    await part('data/day9.txt', 10);
}

parts();