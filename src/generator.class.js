/* eslint-disable require-jsdoc */
// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Third-party Dependencies
const jsdoc = require("@slimio/jsdoc");

// Require Third-party Dependencies
const zup = require("zup");

// CONSTANTS
TEMPLATE_DIR = join(__dirname, "..", "view", "temlate");

/**
 * @class Generator
 * @classdesc Generate web page from js documentation
 *
 * @author Mark MALAJ <malaj1.mark@gmail.com>
 * @version 0.0.1
 */
class Generator {
    /**
     * @version 0.1.0
     *
     * @constructor
     * @param {LinkedBlock} docs boject result from groupData() method
     *
     * @throws {Error}
     */
    // eslint-disable-next-line no-empty-function, no-useless-constructor
    constructor(docs) {
        const hasMembers = Object.prototype.hasOwnProperty.call(docs, "members");
        const hasOrphans = Object.prototype.hasOwnProperty.call(docs, "orphans");
        if (!hasMembers || !hasOrphans) {
            throw new Error("the 'members' or 'orphans' properties of the 'docs' argument are missing");
        }
        const { orphans, members } = docs;
        const classes = Object.keys(members);
        this.classes = classes;
    }

    /**
     * @version 0.1.0
     *
     * @public
     * @method read
     * @desc
     * @memberof Generator#
     *
     * @returns {void}
     */
    createHTML() {
        const xds = this.docs;

        const headerFilePath = join(TEMPLATE_DIR, "header.html");
        const htmlpage = readFileSync(headerFilePath, { encoding: "utf8" });

        for (const title of this.docs.title) {
            console.log(`title : ${title}`);
        }

        return htmlpage;
    }
}

// Export class
module.exports = Generator;
