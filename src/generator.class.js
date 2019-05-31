/* eslint-disable require-jsdoc, no-useless-constructor */
// Require Node.js Dependencies
const { readFileSync, writeFileSync } = require("fs");
const { join, normalize } = require("path");
const is = require("@slimio/is");
const jsdoc = require("@slimio/jsdoc");
// Require Third-party Dependencies
const semver = require("semver");
// Require Third-party Dependencies
const zup = require("zup");

// CONSTANTS
TEMPLATE_DIR = join(__dirname, "..", "view", "template");

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
    constructor(docs) {
        const hasMembers = Object.prototype.hasOwnProperty.call(docs, "members");
        const hasOrphans = Object.prototype.hasOwnProperty.call(docs, "orphans");
        if (!hasMembers || !hasOrphans) {
            throw new Error("the 'members' or 'orphans' properties of the 'docs' argument are missing");
        }
        const { orphans, members } = docs;
        this.members = members;
        this.orphans = orphans;
        this.zupObject = {};
        this.selectedClass = "";
        // this.htmlProp = readFileSync(join(TEMPLATE_DIR, "property.html"), { encoding: "utf8" });;
        this.basicHtmlMethod = readFileSync(join(TEMPLATE_DIR, "method.html"), { encoding: "utf8" });
        this.classes = Object.keys(members);

        this.method = { method: [] };
        this.properties = { properties: [] };

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
        let htmlpage = readFileSync(headerFilePath, { encoding: "utf8" });

        // const template = zup(htmlpage)({ data: { namespace: "New namespace", className: "Manifest" } });

        return htmlpage;
    }

    createMethod(name, options = Object.create(null)) {
        if (!is.string(name)) {
            throw new TypeError("name param must be a type of string");
        }
        if (!is.plainObject(options)) {
            throw new TypeError("options param must be a type of Object");
        }
        const {
            isStatic = false,
            params = [],
            typeReturn
        } = options;
        let { version = "0.1.0" } = options;
        if (!is.boolean(isStatic)) {
            throw new TypeError("isStatic param must be a type of boolean");
        }
        if (!is.array(params)) {
            throw new TypeError("params parameter must be a type of Array<Array>, check doc");
        }
        if (!is.string(typeReturn)) {
            throw new TypeError("typeReturn param must be a type of string");
        }
        if (!is.string(version)) {
            throw new TypeError("version param must be a type of string");
        }
        const { version: coerceVersion } = semver.coerce(version) || { version };
        version = coerceVersion;
        if (!semver.valid(version)) {
            throw new Error("version must match the following pattern : x.x.x");
        }
        // console.log(params);
        const methodTemplate = zup(this.basicHtmlMethod)({
            name,
            isStatic,
            params,
            typeReturn,
            version
        });
        console.log(methodTemplate);
    }

    buildMain() {
        const membersList = Object.keys(this.members);
        for (const member of membersList) {
            // console.log(JSON.stringify(member));
            const propHtmlStr = readFileSync(join(TEMPLATE_DIR, "main.html"), { encoding: "utf8" });
            const data = { member: this.members[member] };
            console.log(JSON.stringify(data, null, 4));
            // const propHtmlTemplate = zup(propHtmlStr)(data);
            // writeFileSync(join(normalize("d:/def-workspace"), "dynamicProp.html"), propHtmlTemplate);
            // for (const elem of this.members[member]) {
            //     const hasProperty = Object.prototype.hasOwnProperty.call(elem, "property");
            //     console.log(hasProperty);
            //     if (hasProperty) {
            //         const propHtmlStr = readFileSync(join(TEMPLATE_DIR, "property.html"), { encoding: "utf8" });
            //         const propHtmlTemplate = zup(propHtmlStr)(elem);
            //     }
            // }
        }
    }
}

const docsStr = readFileSync(join(normalize("d:/def-workspace"), "minifiedDocs.json"), { encoding: "utf8" });
const docs = JSON.parse(docsStr);
const generator = new Generator(docs);

generator.createMethod("blabla", {
    isStatic: false,
    params: [
        ["configFilePath", "string", false],
        ["options", "Config.Option", true]
    ],
    typeReturn: "Manifest",
    version: "salut"
});

// Export class
module.exports = Generator;
