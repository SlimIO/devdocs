#!/usr/bin/env node
/* eslint-disable global-require */
"use strict";

require("make-promises-safe");

// Require Node.js Dependencies
const { mkdirSync, writeFileSync } = require("fs");
const { join, relative } = require("path");

// Require Third-party Dependencies
const Manifest = require("@slimio/manifest");
const { parseFile, groupData } = require("@slimio/jsdoc");
const sade = require("sade");
const { white, gray, cyan, yellow } = require("kleur");
const open = require("open");

// Require Internal Dependencies
const Generator = require("../src/generator.class");
const { getFilesRecursive } = require("../src/utils");

// if the current working directory is equal to __dirname, then exit!
const cwd = process.cwd();
if (cwd === __dirname) {
    process.exit(0);
}

sade("", true)
    .option("--http", "Serve documentation with an HTTP Server", false)
    .action(main)
    .parse(process.argv);

/**
 * @async
 * @function parseJSDocOf
 * @param {!string} filePath path to the file we have to parse
 * @returns {Promise<object>}
 */
async function parseJSDocOf(filePath) {
    const fileBlocks = [];

    for await (const block of parseFile(filePath)) {
        fileBlocks.push(block);
    }

    return { path: filePath, docs: groupData(fileBlocks) };
}

/**
 * @async
 * @function main
 * @param {object} [options] CLI options of documentation
 * @param {boolean} [options.http] launch documentation as a http server
 * @returns {Promise<void>}
 */
async function main(options = Object.create(null)) {
    const startHttpServer = Boolean(options.http);

    console.log(gray().bold(`\n > Generating documentation for/at: '${cyan().bold(cwd)}'\n`));
    const filesPaths = [];
    const config = Manifest.open();
    const include = new Set(config.doc.include.map((name) => relative(cwd, name)));

    // Retrieve the files we want to process for the documentation
    for await (const [, filePath] of getFilesRecursive(cwd)) {
        if (include.size !== 0 && !include.has(relative(cwd, filePath))) {
            continue;
        }

        filesPaths.push(filePath);
    }

    // There is no Javascript files, then exit...
    if (filesPaths.length === 0) {
        console.log(yellow().bold("No javascript files detected, exiting because we have nothing to document here!\n"));
        process.exit(0);
    }

    const documentedFiles = await Promise.all(filesPaths.map(parseJSDocOf));

    let HTMLTemplate = "";
    for (const { docs } of documentedFiles) {
        HTMLTemplate = new Generator(docs).genHTML();

        break;
    }

    // if --http argument is requested
    // Create and serv the documentation with an HTTP Server.
    // Included files and http port can be configured in the SlimIO Manifest file (slimio.toml).
    if (startHttpServer) {
        // Require HTTP Dependencies
        const polka = require("polka");
        const send = require("@polka/send-type");
        const sirv = require("sirv");

        const port = config.doc.port || 1337;

        polka()
            .use(sirv(join(__dirname, "..", "public")))
            .get("/", (req, res) => {
                send(res, 200, HTMLTemplate, { "Content-Type": "text/html" });
            }).listen(port, async() => {
                const httpURL = `http://localhost:${port}`;
                console.log(white().bold(`Documentation online at ${yellow(httpURL)}`));
                await open(httpURL);
            });
    }

    // Else, then create a /docs directory at cwd()
    // Generate the documentation in docs/index.html
    else {
        const lDir = join(cwd, "docs");
        try {
            mkdirSync(lDir);
        }
        catch (err) {
            // do nothing
        }

        writeFileSync(join(lDir, "index.html"), HTMLTemplate);
        console.log(white().bold(`Documentation writed on disk at ${yellow(lDir)}`));
    }
}
