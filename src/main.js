// Require Node.js Dependencies
const { readFileSync, writeFileSync } = require("fs");
const { join, normalize } = require("path");
const { parseFile, groupData } = require("@slimio/jsdoc");


const docsStr = readFileSync(join(normalize("d:/def-workspace"), "docs.json"), { encoding: "utf8" });

const docs = JSON.parse(docsStr);

const hasMembers = Object.prototype.hasOwnProperty.call(docs, "members");
console.log(hasMembers);
if (hasMembers) {
    const { members } = docs;
    const keys = Object.keys(members);
    // console.log(JSON.stringify(keys));
    for (const key of keys) {
        // console.log(members[key], null, 4);
        for (const property of members[key]) {

        }
    }
    
}
const className = "Manifest";

// members[className].length;
/*
// CONSTANTS
const PROJECT_DIR = join(__dirname, "..");
const TEMPLATE_DIR = join(PROJECT_DIR, "view", "template");
const MANIFEST_PATH = join(PROJECT_DIR, "..", "Manifest");
const HEADER_FILE = join(TEMPLATE_DIR, "header.html");


async function main() {
    const header = readFileSync(HEADER_FILE, { encoding: "utf8" });
    const fileBlocks = [];
    const indexPath = join(MANIFEST_PATH, "index.js");
    for await (const block of parseFile(indexPath)) {
        fileBlocks.push(block);
    }
    const finalResult = groupData(fileBlocks);
    // writeFileSync(join(normalize("d:/def-workspace"), "docs.json"), JSON.stringify(finalResult, null, 4));
    // console.log(JSON.stringify(finalResult, null, 4));
}

main().catch(console.error);

*/
