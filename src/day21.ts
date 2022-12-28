import fs = require('fs');
import readline = require('readline');

type Operation = "+" | "-" | "*" | "/";

function isOperation(str: string): str is Operation {
    return str == "+" || str == "-" || str == "*" || str == "/";
}

type Statement = {
    operation: Operation;
    left: string | number;
    right: string | number;
}

const solved = new Map<string, number>();
const open = new Map<string, Statement>();
const requirements = new Map<string, string[]>();

function addFact(key: string, value: number) {
    solved.set(key, value);
    const names = requirements.get(key);
    if (names) {
        requirements.delete(key);
        for (const name of names) {
            const statement = open.get(name)!;
            if (statement.left === key) statement.left = value;
            if (statement.right === key) statement.right = value;
            if (typeof statement.left == "number" && typeof statement.right == "number") solve(name);
        };
    }
}

function addRequirement(name: string, req: string) {
    if (requirements.has(req)) {
        requirements.get(req)!.push(name);
    } else {
        requirements.set(req, [name]);
    }
}

function addStatement(name: string, statement: Statement) {
    open.set(name, statement);
    if (typeof statement.left == "string" && solved.has(statement.left)) statement.left = solved.get(statement.left)!;
    if (typeof statement.right == "string" && solved.has(statement.right)) statement.right = solved.get(statement.right)!;
    if (typeof statement.left == "number" && typeof statement.right == "number") solve(name);
    if (typeof statement.left == "string") addRequirement(name, statement.left);
    if (typeof statement.right == "string") addRequirement(name, statement.right);
}

function solve(name: string) {
    const s = open.get(name)!;
    if (typeof s.left == "string" || typeof s.right == "string") return;
    open.delete(name);
    switch (s.operation) {
        case '+':
            addFact(name, s.left + s.right);
            break;
        case '-':
            addFact(name, s.left - s.right);
            break;
        case '*':
            addFact(name, s.left * s.right);
            break;
        case '/':
            addFact(name, s.left / s.right);
            break;
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    for await (const line of rl) {
        const m = line.match(/([a-z]{4}): ((\d+)|([a-z]{4}) ([+*\/-]) ([a-z]{4}))/)!;
        if (m[3]) {
            addFact(m[1], Number.parseInt(m[3]));
        } else if (isOperation(m[5])) {
            addStatement(m[1], { left: m[4], operation: m[5], right: m[6] });
        }
    }

    console.log("The monkey named root yells " + solved.get("root"));
}

part1("data/day21.txt");