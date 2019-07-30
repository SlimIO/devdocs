#!/usr/bin/env node
"use strict";

// Require Node.js Dependencies
const { mkdirSync, writeFileSync } = require("fs");
const { join, basename } = require("path");

// Require Internal Dependencies
const Generator = require("../src/generator.class");
const { getRecursifJsFile } = require("../src/utils");

// Require Third-party Dependencies
const { parseFile, groupData } = require("@slimio/jsdoc");
const { argDefinition, parseArg } = require("@slimio/arg-parser");
const Manifest = require("@slimio/manifest");
const kleur = require("kleur");

// if the current working directory is equal to __dirname, then exit!
const cwd = process.cwd();
if (cwd === __dirname) {
    process.exit(0);
}

const arg = parseArg([
    argDefinition("-h --http", "Serve documentation with an HTTP Server")
]);

/**
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    // Open local Manifest file
    const config = Manifest.open();

    console.log(" > Retrieving all Javascript files");
    const jsFiles = [];
    let defaultFile = "";
    // Get all javascript files
    const gen = getRecursifJsFile(cwd);
    for (const jsFile of gen) {
        jsFiles.push(...jsFile);
        const isDefault = jsFile.find((file) => basename(file) === "index.js");
        if (isDefault && defaultFile === "") {
            defaultFile = isDefault;
        }
    }
    // There is no Javascript files to handle (so no documentation available).
    if (jsFiles.length === 0) {
        console.log(" > No Javascript files to handle");
        process.exit(0);
    }

    // Parse ALL JSDoc
    const fileBlocks = [];
    for await (const block of parseFile(defaultFile)) {
        fileBlocks.push(block);
    }
    const docs = groupData(fileBlocks);

    // Get view and generate final HTML Template
    const generator = new Generator(docs);
    const HTMLTemplate = generator.genHTML(docs);

    // if --http argument is requested
    // Create and serv the documentation with an HTTP Server.
    // Included files and http port can be configured in the SlimIO Manifest file (slimio.toml).
    if (arg.get("http")) {
        // Require HTTP Dependencies
        const polka = require("polka");
        const send = require("@polka/send-type");
        const sirv = require("sirv");

        const port = config.doc.port || 1337;

        polka()
            .use(sirv(join(__dirname, "..", "public")))
            .get("/", (req, res) => {
                send(res, 200, HTMLTemplate, { "Content-Type": "text/html" });
            }).listen(port, () => {
                console.log(`HTTP Server now listening: ${kleur.yellow(`http://localhost:${port}`)}`);
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
        console.log(`Documentation writed at: ${kleur.yellow(lDir)}`);
    }
}
main().catch(console.error);
