#!/usr/bin/env node

// Require Third-party Dependencies
const jsdoc = require("@slimio/jsdoc");
const Manifest = require("@slimio/manifest");
const kleur = require("kleur");

// Globals
const cwd = process.cwd();
if (cwd === __dirname) {
    process.exit(0);
}

/**
 * @async
 * @func main
 * @returns {Promise<void>}
 */
async function main() {
    const config = Manifest.open();
    const include = new Set(config.doc.include);
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

    // TODO: Generate .HTML Doc here
    // TODO: Start HTTP Server?
}
main().catch(console.error);
