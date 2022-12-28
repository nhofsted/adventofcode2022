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

class Environment {
    readonly solved = new Map<string, number>();
    readonly open = new Map<string, Statement[]>();
    readonly requirements = new Map<string, string[]>();
}

function addFact(env: Environment, key: string, value: number) {
    env.solved.set(key, value);
    env.open.delete(key);
    const names = env.requirements.get(key);
    if (names) {
        env.requirements.delete(key);
        for (const name of names) {
            if (env.open.has(name)) {
                for (const statement of env.open.get(name)!) {
                    if (statement.left === key) statement.left = value;
                    if (statement.right === key) statement.right = value;
                    solve(env, name);
                }
            }
        }
    }
}

function addRequirement(env: Environment, name: string, req: string) {
    if (env.requirements.has(req)) {
        env.requirements.get(req)!.push(name);
    } else {
        env.requirements.set(req, [name]);
    }
}

function addOpenStatement(env: Environment, name: string, statement: Statement) {
    if (env.open.has(name)) {
        env.open.get(name)!.push(statement);
    } else {
        env.open.set(name, [statement]);
    }
}

function addStatement(env: Environment, name: string, statement: Statement) {
    addOpenStatement(env, name, statement);
    if (typeof statement.left == "string" && env.solved.has(statement.left)) statement.left = env.solved.get(statement.left)!;
    if (typeof statement.right == "string" && env.solved.has(statement.right)) statement.right = env.solved.get(statement.right)!;
    if (typeof statement.left == "number" && typeof statement.right == "number") solve(env, name);
    if (typeof statement.left == "string") addRequirement(env, name, statement.left);
    if (typeof statement.right == "string") addRequirement(env, name, statement.right);
}

function addStatements(env: Environment, name: string, statement: Statement) {
    addStatement(env, name, statement);
    switch (statement.operation) {
        case '+':
            if (typeof statement.left == "string") addStatement(env, statement.left, { left: name, operation: "-", right: statement.right });
            if (typeof statement.right == "string") addStatement(env, statement.right, { left: name, operation: "-", right: statement.left });
            break;
        case '-':
            if (typeof statement.left == "string") addStatement(env, statement.left, { left: name, operation: "+", right: statement.right });
            if (typeof statement.right == "string") addStatement(env, statement.right, { left: statement.left, operation: "-", right: name });
            break;
        case '*':
            if (typeof statement.left == "string") addStatement(env, statement.left, { left: name, operation: "/", right: statement.right });
            if (typeof statement.right == "string") addStatement(env, statement.right, { left: name, operation: "/", right: statement.left });
            break;
        case '/':
            if (typeof statement.left == "string") addStatement(env, statement.left, { left: name, operation: "*", right: statement.right });
            if (typeof statement.right == "string") addStatement(env, statement.right, { left: statement.left, operation: "/", right: name });
            break;
    }
}

function solve(env: Environment, name: string) {
    if(!env.open.has(name)) return;
    for (const s of env.open.get(name)!) {
        if (typeof s.left == "string" || typeof s.right == "string") continue;
        env.open.delete(name);
        switch (s.operation) {
            case '+':
                addFact(env, name, s.left + s.right);
                break;
            case '-':
                addFact(env, name, s.left - s.right);
                break;
            case '*':
                addFact(env, name, s.left * s.right);
                break;
            case '/':
                addFact(env, name, s.left / s.right);
                break;
        }
    }
}

async function part1(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const env = new Environment();
    for await (const line of rl) {
        const m = line.match(/([a-z]{4}): ((\d+)|([a-z]{4}) ([+*\/-]) ([a-z]{4}))/)!;
        if (m[3]) {
            addFact(env, m[1], Number.parseInt(m[3]));
        } else if (isOperation(m[5])) {
            addStatement(env, m[1], { left: m[4], operation: m[5], right: m[6] });
        }
    }

    console.log("The monkey named root yells " + env.solved.get("root"));
}

async function part2(path: string) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface(fileStream);

    const env = new Environment();
    for await (const line of rl) {
        const m = line.match(/([a-z]{4}): ((\d+)|([a-z]{4}) ([+*\/-]) ([a-z]{4}))/)!;
        if (m[3]) {
            if (m[1] != "humn") {
                addFact(env, m[1], Number.parseInt(m[3]));
            }
        } else if (isOperation(m[5])) {
            if (m[1] == "root") {
                addStatements(env, m[4], { left: m[6], operation: '+', right: 0 });
            } else {
                addStatements(env, m[1], { left: m[4], operation: m[5], right: m[6] });
            }
        }
    }

    console.log("The human needs to yell " + env.solved.get("humn"));
}

async function parts(path: string) {
    await part1(path);
    await part2(path);
}

parts("data/day21.txt");