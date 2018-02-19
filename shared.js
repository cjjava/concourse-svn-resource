"use strict"

function prettyJson(obj) {
    return JSON.stringify(obj, null, 2);
}
exports.prettyJson = prettyJson;

function fail(err, cmd) {
    if (cmd) {
        console.error('Error while executing command:', filter_hidden(cmd));
    }
    if (err) {
        console.error(filter_hidden(err.stack));
    }
    process.exitCode = 1;
}
exports.fail = fail;


function success(result) {
    console.log(prettyJson(result));
}
exports.success = success;


var _hidden = {};
function hide(content, replace) {
    _hidden[content] = replace || "******";
}
exports.hide = hide;


function filter_hidden(content) {
    const keys = Object.keys(_hidden);
    
    for(let i = 0; i < keys.length; i++) {
        const h = keys[i];
        const r = _hidden[h];
        content = content.replace(h, r);
    }
    return content;
}


const exec = require("child_process").exec;
const xml2js = require("xml2js");

exports.check = function(data) {
    const source = data.source || {};
    const repository = source.repository || null;
    const username = source.username || null;
    const password = source.password || null;
    const trustCert = source["trust_server_cert"];

    if (!repository) {
        fail(new Error("source.repository must be provided"));
    }

    let revision = null;
    if (typeof data.version === 'object' && data.version != null) {
        const revisionType = typeof data.version.revision;
        if (revisionType === 'string' || revisionType === 'number') {
            revision = String(data.version.revision);
        }
    }

    let cmdLine = "svn log --non-interactive --no-auth-cache --xml";

    if (username) {
        // TODO: escape quotes in username
        cmdLine += ' --username "' + username + '"';
    }

    if (password) {
        // TODO: escape quotes in password
        const passwdCmd = '--password "' + password + '"';
        cmdLine += ' ' + passwdCmd;
        hide(passwdCmd, '--password "*****"');
    }

    if (trustCert) {
        cmdLine += ' --trust-server-cert';
    }

    if (revision) {
        // TODO: Check targetVersion format.  Escape quotes
        cmdLine += ' -r ' + revision + ':HEAD';
    }

    // TODO: encode
    cmdLine += ' "' + repository + '"';

    let options = {
        maxBuffer: Infinity,
        env: {
            LANG: "ja_JP.UTF-8",
            LANGUAGE: "ja_JP:ja",
            LC_ALL: "ja_JP.UTF-8"
        }
    };

    exec(cmdLine, options, (err, stdout, stderr) => {
        if (err) fail(err);
        const parser = new xml2js.Parser({
            explicitRoot: false
        });
        parser.parseString(stdout, (err, info) => {
            if (err) fail(err);

            const entries = info.logentry;
            const versions = entries.map(x => x['$']).sort((a, b) => Number(a.revision) - Number(b.revision));

            success(versions);
        });
    });
};



exports.getLatestVersion = function(data) {

    const source = data.source || {};
    const repository = source.repository || null;
    const username = source.username || null;
    const password = source.password || null;

    if (!repository) {
        fail(new Error("source.repository must be provided"));
    }

    let cmdLine = "svn info --non-interactive --no-auth-cache";

    if (username) {
        // TODO: escape quotes in username
        cmdLine += ' --username "' + username + '"';
    }

    if (password) {
        // TODO: escape quotes in password
        const passwdCmd = '--password "' + password + '"';
        cmdLine += ' ' + passwdCmd;
        hide(passwdCmd, '--password "*****"');
    }

    // TODO: encode
    cmdLine += ' "' + repository + '"';

    let options = {
        maxBuffer: Infinity,
        env: {
            LANG: "ja_JP.UTF-8",
            LANGUAGE: "ja_JP:ja",
            LC_ALL: "ja_JP.UTF-8"
        }
    };

    exec(cmdLine + " | grep '^リビジョン:' | cut -d ':' -f2", options, (err, stdout, stderr) => {
        if (err) {
            return fail(err, cmdLine);
        }
        success({
            "version": {
                "revision": `${parseInt(stdout)}`
            },
        });
    });
};
