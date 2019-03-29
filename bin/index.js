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
 * @func main
 * @returns {Promise<void>}
 */
async function main() {
    // Open local Manifest file
    const config = Manifest.open();
    const include = new Set(config.doc.include.map((file) => join(cwd, file)));
    console.log(" > Retrieving all Javascript files");

    // Parse ALL JSDoc
    const docs = await jsdoc(cwd);
    for (const key of Object.keys(docs)) {
        if (!include.has(key)) {
            delete docs[key];
        }
    }

    // There is no Javascript files to handle (so no documentation available).
    if (Object.keys(docs).length === 0) {
        console.log(" > No Javascript files to handle");
        process.exit(0);
    }

    // Get view and generate final HTML Template
    const HTMLStr = readFileSync(join(VIEW_DIR, "doc.html"), { encoding: "utf8" });
    const HTMLTemplate = zup(HTMLStr)({ projectName: "test" });

    // if --http argument is requested
    // Create and serv the documentation with an HTTP Server.
    // Included files and http port can be configured in the SlimIO Manifest file (slimio.toml).
    if (arg.get("http")) {
        // Require HTTP Dependencies
        const polka = require("polka");
        const send = require("@polka/send-type");
        const serve = require("serve-static");

        polka()
            .use(serve(join(__dirname, "public")))
            .get("/", (req, res) => {
                send(res, 200, HTMLTemplate, { "Content-Type": "text/html" });
            }).listen(config.doc.port, () => {
                console.log(`HTTP Server now listening: ${kleur.yellow(`http://localhost:${config.doc.port}`)}`);
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
