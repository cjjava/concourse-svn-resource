"use strict"

function prettyJson(obj) {
    return JSON.stringify(obj, null, 2);
}
exports.prettyJson = prettyJson;

exports.fail = function fail(err, cmd) {
    if (cmd) {
        console.error('Error while executing command:', filter_hidden(cmd));
    }
    if (err) {
        console.error(filter_hidden(err.stack));
    }
    process.exitCode = 1;
}

exports.success = function success(result) {
    console.log(prettyJson(result));
}


var _hidden = {};
exports.hide = function hide(content, replace) {
    _hidden[content] = replace || "******";
}

function filter_hidden(content) {
    const keys = Object.keys(_hidden);
    
    for(let i = 0; i < keys.length; i++) {
        const h = keys[i];
        const r = _hidden[h];
        content = content.replace(h, r);
    }
    return content;
}