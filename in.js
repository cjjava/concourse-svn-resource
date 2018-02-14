#!/usr/bin/env node
"use strict"

const exec = require("child_process").exec;
const xml2js = require("xml2js");

const shared = require("./shared");

const success = shared.success;
const fail = shared.fail;
const hide = shared.hide;

//node in.js /path
if (process.argv.length < 3) {
    fail(new Error("destination directory must be specified"));
}

// TODO: Must path exist?  Should we try to create it?
const destDir = process.argv[2];
if (destDir === "") {
    fail(new Error("destination directory must be specified"));
}

process.stdin.on("data", stdin => {
    const data = JSON.parse(stdin);
    
    const source = data.source || {};
    const repository = source.repository || null;
    const username = source.username || null;
    const password = source.password || null;
    const trustCert = source["trust_server_cert"];
    const check_only = source.check_only || false;

    if (!repository) {
        fail(new Error("source.repository must be provided"));
    }

    if (check_only) {
        return success({"version":{"ref":"none"}});
    }

    let revision = null;
    if (typeof data.version === 'object' && data.version != null) {
        const revisionType = typeof data.version.revision;
        if (revisionType === 'string' || revisionType === 'number') {
            revision = String(data.version.revision);
        }
    }
    
    let cmdLine = "svn checkout --non-interactive --no-auth-cache";
    
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
        cmdLine += ' -r "' + revision + '"';
    }
    
    // TODO: urlencode
    cmdLine += ' "' + repository + '" .';
    let options = {
        cwd: destDir,
        maxBuffer: Infinity,
        env: {
            LANG: "ja_JP.UTF-8",
            LANGUAGE: "ja_JP:ja",
            LC_ALL: "ja_JP.UTF-8"
        }
    };
    exec(cmdLine, options, (err, stdout, stderr) => {
        // TODO: We can generate an incredible amount of output for large repos.
        //  Stream this and check each line as it passes.
        if (stderr && stderr !== "") {
            fail(new Error(stderr), cmdLine);
        }

        if(err) {
            fail(err, cmdLine);
        }
        
        const lines = stdout.split('\n');
        if (lines.length <= 1) {
            fail(new Error("no output from svn checkout"), cmdLine);
        }

        var dirName = repository.split("/").pop();
        exec(`svn info --show-item revision ${dirName}`, options, (err, stdout, stderr) => {
            if (err) {
                return fail(err, cmdLine);
            }
            success({
                "version": {
                    "revision": parseInt(stdout)
                },
            });
        });
    });
});
