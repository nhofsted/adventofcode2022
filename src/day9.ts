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

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const visited: Set<String> = new Set();

    const head = new Node();
    const tail = new Node();

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
            tail.follow(head);
            visited.add(tail.location);
        }
    }

    console.log("The tail visited at least " + visited.size + " positions once.");
}

part1('data/day9.txt');