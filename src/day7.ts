import fs = require('fs');
import readline = require('readline');

abstract class INode implements Iterable<INode> {
    private _parent: Directory | null;
    private _name: string;

    constructor(parent: Directory | null, name?: string) {
        this._parent = parent ?? null;
        this._name = name ?? "/";
    }

    get parent() {
        return this._parent;
    }

    set parent(parent: Directory | null) {
        this._parent = parent;
    }

    get name() {
        return this._name;
    }

    get isRoot() {
        return this._parent === null;
    }

    abstract [Symbol.iterator](): Iterator<INode>;
}

class File extends INode {
    private _size: number;

    constructor(parent: Directory, name: string, size: number) {
        super(parent, name);
        this._size = size;
    }

    get size() {
        return this._size;
    }

    [Symbol.iterator]() {
        return [][Symbol.iterator]();
    }
}

class Directory extends INode {
    private _children: INode[] = [];

    constructor(parent: Directory | null, name: string) {
        super(parent, name);
    }

    addChild(child: INode) {
        this._children.push(child);
        child.parent = this;
    }

    findChild(name: string) {
        return this._children.find(a => a.name == name);
    }

    [Symbol.iterator]() {
        return this._children[Symbol.iterator]();
    }

    static createRoot() {
        return new Directory(null, "");
    }
}

async function constructFileSystem(rl: readline.Interface) {
    const root = Directory.createRoot();
    let cwd: Directory = root;

    for await (const line of rl) {
        let m: RegExpMatchArray | null = null;
        if (m = line.match(/\$ cd (.+)/)) {
            let dir = m[1];
            if (dir == "/") {
                cwd = root;
            } else if (dir == "..") {
                const parent = cwd.parent;
                if (parent !== null) cwd = parent!;
            } else {
                const child = cwd.findChild(dir);
                if (child instanceof Directory) cwd = child;
            }
        } else if (m = line.match(/\$ ls/)) {
            // we can recognize the ls output, no need for a state machine
        } else if (m = line.match(/dir (.+)/)) {
            cwd.addChild(new Directory(cwd, m[1]));
        } else if (m = line.match(/(\d+) (.+)/)) {
            cwd.addChild(new File(cwd, m[2], Number.parseInt(m[1])));
        }
    }

    return root;
}

function printFileSystem(n: INode, indent: number = 0) {
    if (n instanceof File) {
        console.log(' '.repeat(indent) + "- " + n.name + " (file, size=" + n.size + ")");
    } else if (n instanceof Directory) {
        console.log(' '.repeat(indent) + "- " + n.name + " (dir)");
        for (const child of n) {
            printFileSystem(child, indent + 2);
        }
    }
}

type DirectoryInformation = {
    directory: Directory;
    recursiveSize: number;
}

function directorySizes(cwd: Directory) {
    let result: DirectoryInformation[] = [];
    let sum = 0;
    for (const child of cwd) {
        if (child instanceof File) {
            sum += child.size;
        } else if (child instanceof Directory) {
            const { sum: _sum, result: _result } = directorySizes(child);
            sum += _sum;
            result = result.concat(_result);
        }
    }
    result.push({ directory: cwd, recursiveSize: sum });
    return { sum, result };
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);
    const root = await constructFileSystem(rl);
    printFileSystem(root);
    console.log("The sum of the total sizes of all of the directories with a total size of at most 100000 is " +
        directorySizes(root).result
            .filter(info => info.recursiveSize <= 100_000)
            .reduce((sum, info) => info.recursiveSize + sum, 0));
}

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);
    const root = await constructFileSystem(rl);
    const directoryInformation = directorySizes(root).result;
    const inUse = directoryInformation.find(info => info.directory.isRoot)?.recursiveSize ?? 0;
    const free = 70_000_000 - inUse;
    const toFree = 30_000_000 - free;
    console.log("The total size of the smallest directory that, if deleted, would free up enough space (" + toFree + ") on the filesystem to run the update is " +
        directoryInformation
            .filter(info => info.recursiveSize > toFree)
            .sort((i1, i2) => i1.recursiveSize - i2.recursiveSize)
            [0]
            .recursiveSize);
}

async function parts() {
    await part1('data/day7.txt');
    await part2('data/day7.txt');
}

parts();