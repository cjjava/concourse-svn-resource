#!/usr/bin/env node
"use strict"


const shared = require("./shared");

const success = shared.success;
const fail = shared.fail;
const hide = shared.hide;
const check = shared.check;


process.stdin.on("data", stdin => {
    const data = JSON.parse(stdin);
    check(data);
});
