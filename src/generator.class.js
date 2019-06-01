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
const TEMPLATE_DIR = join(__dirname, "..", "view", "template");

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

        this.VALID_PROP = new Set(["desc", "example", "defaultVals"]);

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
            typeReturn,
            content
        } = options;
        if (!is.boolean(isStatic)) {
            throw new TypeError("isStatic param must be a type of boolean");
        }
        if (!is.array(params)) {
            throw new TypeError("params parameter must be a type of Array<Array>, check doc");
        }
        if (!is.string(typeReturn)) {
            throw new TypeError("typeReturn param must be a type of string");
        }

        if (!is.undefined(content) && !is.plainObject(content)) {
            throw new TypeError("content param must be a type of Object");
        }
        if (Object.entries(content).length === 0) {
            throw new Error("content must not be an empty Object");
        }
        // Verify if content contains at least one of the required properties
        const properties = Object.keys(content);
        const containValidProp = properties.some((item) => this.VALID_PROP.has(item));
        if (!containValidProp) {
            throw new Error(`content must contain at least one of these properties : ${Array.from(this.VALID_PROP).join(", ")}`);
        }

        let { version = "0.1.0" } = options;
        if (!is.string(version)) {
            throw new TypeError("version param must be a type of string");
        }
        // Check if the version complies with the semver standards
        const { version: coerceVersion } = semver.coerce(version) || { version };
        version = coerceVersion;
        if (!semver.valid(version)) {
            throw new Error("version must match the following pattern : x.x.x");
        }
        if (!is.string(content.desc)) {
            throw new TypeError("desc property must be a type of String");
        }

        if (Object.prototype.hasOwnProperty.call(content, "defaultVals")) {
            if (!is.array(content.defaultVals)) {
                throw new TypeError("defaultVals must be a type of Array<Object>, check doc");
            }
            if (content.defaultVals.length === 0) {
                throw new Error("defaultVals must not be an empty Array");
            }
            // eslint-disable-next-line prefer-const
            for (let [i, { name, type, value }] of content.defaultVals.entries()) {
                if (is.undefined(name) || is.undefined(type) || is.undefined(value)) {
                    throw new Error("DefaultVals is an array of Object, each object must contain these keys : name, type and value");
                }

                if (!is.string(name)) {
                    throw new TypeError(`defaultVals.name must be a type of String
                    Look the ${i} element of content.Default array`);
                }
                if (!is.string(type)) {
                    throw new TypeError("defaultVals.type must be a type of String");
                }
                type = type.toLowerCase();
                if (type === "string" || type === "boolean" || type === "number") {
                    content.defaultVals[i].type = type.toLowerCase();
                }
                else {
                    content.defaultVals[i].type = "obj";
                }
                if (is.plainObject(value)) {
                    content.defaultVals[i].value = JSON.stringify(value);
                }
            }
        }

        const methodTemplate = zup(this.basicHtmlMethod)({
            name,
            isStatic,
            params,
            typeReturn,
            content,
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
    version: "0.1",
    content: {
        foo: "fff",
        bar: "bbb",
        foobar: "foobar",
        desc: "desc of the method",
        defaultVals: [
            { name: "nameArg", type: "String", value: "default value" },
            { name: "isSecure", type: "boolean", value: true },
            { name: "nbTime", type: "number", value: 50 },
            { name: "name3", type: "Payload", value: "Payload" },
            { name: "name5", type: "Other", value: [25, 50] },
            { name: "name5", type: "Other", value: { name: "test" } }
        ],
        example: "const foo = true"
    }

});

// Export class
module.exports = Generator;
