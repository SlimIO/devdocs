#!/usr/bin/env node

// Require Node.js Dependencies
const { readFileSync, mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");

// Require Third-party Dependencies
const jsdoc = require("@slimio/jsdoc");
const { argDefinition, parseArg } = require("@slimio/arg-parser");
const Manifest = require("@slimio/manifest");
const zup = require("zup");
const kleur = require("kleur");

// CONSTANTS
const VIEW_DIR = join(__dirname, "..", "view");

// Globals
const cwd = process.cwd();
if (cwd === __dirname) {
    process.exit(0);
}

const arg = parseArg([
    argDefinition("-h --http", "Serve documentation with an HTTP Server")
]);

/**
 * @async
 * @func main
 * @returns {Promise<void>}
 */
async function main() {
    const config = Manifest.open();
    const include = new Set(config.doc.include.map((file) => join(cwd, file)));
    console.log(" > Retrieving all Javascript files");

    const docs = await jsdoc(cwd);
    for (const key of Object.keys(docs)) {
        if (!include.has(key)) {
            delete docs[key];
        }
    }

    if (Object.keys(docs).length === 0) {
        console.log(" > No Javascript files to handle");
        process.exit(0);
    }

    // Get view and generate final HTML Template
    const HTMLStr = readFileSync(join(VIEW_DIR, "doc.html"), { encoding: "utf8" });
    const template = zup(HTMLStr);
    const final = template({ projectName: "test" });

    // console.log(JSON.stringify(docs, null, 4));
    const launchHTTP = arg.get("http");
    if (launchHTTP) {
        // eslint-disable-next-line
        const polka = require("polka");

        const server = polka();
        const port = 1337;
        server.get("/", (req, res) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(final);
        }).listen(port, () => {
            console.log(`HTTP Server now listening: ${kleur.yellow(`http://localhost:${port}`)}`);
        });
    }
    else {
        const lDir = join(cwd, "docs");
        try {
            mkdirSync(lDir);
        }
        catch (err) {
            // do nothing
        }

        writeFileSync(join(lDir, "index.html"), final);
        console.log(`Documentation writed at: ${kleur.yellow(lDir)}`);
    }
}
main().catch(console.error);
