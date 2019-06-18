/* eslint-disable require-jsdoc, no-useless-constructor */
// Require Node.js Dependencies
const { readFileSync, writeFileSync } = require("fs");
const { join, normalize } = require("path");
const is = require("@slimio/is");
const jsdoc = require("@slimio/jsdoc");
const argc = require("@slimio/arg-checker");

// Require Third-party Dependencies
const semver = require("semver");

// Require Third-party Dependencies
const zup = require("zup");

// CONSTANTS
const TEMPLATE_DIR = join(__dirname, "..", "view", "template");
const VALID_PROP = new Set(["desc", "defaultVals", "argsDef", "example", "throws"]);

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

        this.selectedClass = "";
        // this.htmlProp = readFileSync(join(TEMPLATE_DIR, "property.html"), { encoding: "utf8" });;
        this.basicHtmlMethod = readFileSync(join(TEMPLATE_DIR, "method.html"), { encoding: "utf8" });
        this.basicHtmlProp = readFileSync(join(TEMPLATE_DIR, "property.html"), { encoding: "utf8" });
        this.classes = Object.keys(members);
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
        const h3 = "<h3 class='property'><span class='icon-cube-10'></span>Property</h3>";
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
        // problem empty params
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
        const containValidProp = properties.some((item) => VALID_PROP.has(item));
        if (!containValidProp) {
            throw new Error(`content must contain at least one of properties of the Set: ${Array.from(this.VALID_PROP).join(", ")}`);
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

        if (Object.prototype.hasOwnProperty.call(content, "desc") && !is.string(content.desc)) {
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
        if (Object.prototype.hasOwnProperty.call(content, "example") && !is.string(content.example)) {
            throw new TypeError("content.example must be a type of string");
        }
        
        this.argumentDefCheck(content.argsDef);

        if (Object.prototype.hasOwnProperty.call(content, "throws")) {
            if (!is.array(content.throws)) {
                throw new TypeError("content.throws must be a type of array");
            }
            if (content.throws.length === 0) {
                throw new Error("content.throws must not be an empty");
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
        // console.log(methodTemplate);
    }

    // eslint-disable-next-line class-methods-use-this
    createProperty(propDefinition) {
        const { required, name, type, desc } = propDefinition;
        if (!is.boolean(required)) {
            throw new TypeError("required param must be a type of Boolean");
        }
        if (!is.string(name)) {
            throw new TypeError("name param must be a type of string");
        }
        if (!is.string(type)) {
            throw new TypeError("type param must be a type of string");
        }
        if (!is.string(desc)) {
            throw new TypeError("desc param must be a type of string");
        }

        // duplicate code !
        let { version = "0.1.0" } = propDefinition;
        if (!is.string(version)) {
            throw new TypeError("version param must be a type of string");
        }
        // Check if the version complies with the semver standards
        const { version: coerceVersion } = semver.coerce(version) || { version };
        version = coerceVersion;
        if (!semver.valid(version)) {
            throw new Error("version must match the following pattern : x.x.x");
        }
        
        return zup(this.basicHtmlProp)({ required, name, type, version, desc });
    }

    // eslint-disable-next-line class-methods-use-this
    argumentDefCheck(argsDef) {
        if (!is.map(argsDef)) {
            throw new TypeError("content.argsDef must be a type of Map");
        }
        if (argsDef.size === 0) {
            throw new Error("content.argsDef must not be empty");
        }
        // for of argsdef to verify type of map values
        for (const [obj, properties] of argsDef) {
            if (!is.string(obj)) {
                throw new TypeError("content.argsDef keys must be type of string");
            }
            if (!is.array(properties)) {
                throw new TypeError(`${obj} value must be an array`);
            }
            // for (const property of properties) {
            //     const { name, type, default: dftValue, desc } = property;

            //     if (!is.string("name")) {
            //         throw new TypeError("name ")
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
    params: [],
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
        argsDef: new Map([
            ["object1",
                [
                    { name: "Prop1", type: "String", default: "default", desc: "description" },
                    { name: "Prop2", type: "Boolean", default: true, desc: "description" },
                    { name: "Prop3", type: "Number", default: 52, desc: "description" }
                ]
            ],
            ["object2",
                [
                    { name: "Prop2", type: "String", default: "default", desc: "description" }
                ]
            ]
        ]),
        example: "const foo = true",
        throws: ["Error", "TypeError", "Other"]
    }
});

generator.createProperty({
    required: true,
    name: "propertyName",
    type: "String",
    version: "0.2",
    desc: "Description of the property"
});

// Export class
module.exports = Generator;
