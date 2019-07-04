/* eslint-disable require-jsdoc */
// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Internal Dependencies
const { isSemver } = require("../src/utils");

// Require Third-party Dependencies
const semver = require("semver");
const zup = require("zup");
const is = require("@slimio/is");
const argc = require("@slimio/arg-checker");

// CONSTANTS
const TEMPLATE_DIR = join(__dirname, "..", "view", "template");
const VALID_PROP = new Set(["desc", "defaultVals", "argsDef", "example", "throws"]);
const TEMPLATE_HEADER = readFileSync(join(TEMPLATE_DIR, "header.html"), { encoding: "utf8" });
const TEMPLATE_METHOD = readFileSync(join(TEMPLATE_DIR, "method.html"), { encoding: "utf8" });
const TEMPLATE_PROP = readFileSync(join(TEMPLATE_DIR, "property.html"), { encoding: "utf8" });

/**
 * @class Generator
 * @classdesc Generate web page from js documentation
 *
 * @author Mark MALAJ <malaj1.mark@gmail.com>
 * @version 0.1.1
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
        const hasMembers = Reflect.has(docs, "members");
        const hasOrphans = Reflect.has(docs, "orphans");
        if (!hasMembers || !hasOrphans) {
            throw new Error("the 'members' or 'orphans' properties of the 'docs' argument are missing");
        }
        const { orphans, members } = docs;
        // Vérifier la contenance de members et orphans
        this.members = members;
        this.orphans = orphans;
        this.selectedClass = "";

        // si members n'est pas null
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
    genHTML() {
        const h3 = "<h3 class='property'><span class='icon-cube-10'></span>Property</h3>";
        const endFile = "</main></body></html>";

        let htmlPage = Generator.genHtmlHeader(null, this.classes[0]);
        const optionsMethods = this.buildMethodOptions(this.classes[0]);
        if (optionsMethods.length === 0) {
            htmlPage += "<div class='empty'>There is no methodes for this class</div>";
        }
        else {
            for (const elem of optionsMethods) {
                htmlPage += Generator.genHtmlMethod(elem.name, elem.options);
            }
        }
        htmlPage += h3;
        const properties = this.buildPropDefinition(this.classes[0]);
        if (properties.length === 0) {
            htmlPage += "<div class='empty'>There is no properties for this class</div>";
        }
        else {
            for (const prop of properties) {
                htmlPage += Generator.genHtmlProperty(prop);
            }
        }
        htmlPage += endFile;

        return htmlPage;
    }

    static genHtmlHeader(namespace, classname) {
        const className = classname || "Orphans";
        const nameSpace = namespace || "No namespace";

        return zup(TEMPLATE_HEADER)({ nameSpace, className });
    }

    buildMethodOptions(className) {
        if (is.nullOrUndefined(className)) {
            return [];
        }
        argc(className, is.string);
        argc(this.members[className], !is.nullOrUndefined);

        const ret = [];
        for (const method of this.members[className]) {
            if (!Reflect.has(method, "method")) {
                continue;
            }
            const options = { params: [] };
            const content = {};
            const defaultVals = [];
            const argsDef = [];
            const { method: { value: name } } = method;

            if (!is.nullOrUndefined(method.static)) {
                options.isStatic = true;
            }

            // Essayer avec les yield & si possibilité de combiner avec la methode paramArgsDescription
            if (is.array(method.param)) {
                for (const param of method.param) {
                    const { name, value: type, required, default: value } = param;
                    if (!is.nullOrUndefined(value)) {
                        defaultVals.push({ name, type, value });
                    }
                    options.params.push([name, type, required]);
                    const ret = this.paramArgsDescription(type);
                    argsDef.push(...ret.entries());
                }
            }
            if (is.plainObject(method.param)) {
                const { name, value: type, required, default: value } = method.param;
                if (!is.nullOrUndefined(value)) {
                    defaultVals.push({ name, type, value });
                }
                options.params.push([name, type, required]);
            }

            if (!is.nullOrUndefined(method.returns) && method.returns.value !== "void") {
                options.typeReturn = method.returns.value;
            }
            if (!is.nullOrUndefined(method.version)) {
                options.version = method.version.value;
            }

            if (is.nullOrUndefined(method.desc)) {
                content.desc = `No description avaible for ${name}`;
            }
            else {
                content.desc = method.desc.value;
            }

            if (!is.nullOrUndefined(method.example)) {
                const ex = method.example.value.replace(/\s{6}/g, "<br>");
                content.example = ex;
            }

            if (is.array(method.throws)) {
                content.throws = method.throws.map((obj) => obj.value);
            }
            else if (is.plainObject(method.throws)) {
                content.throws = [method.throws.value];
            }

            if (!is.nullOrUndefined(method.author)) {
                const authInfos = method.author.value.split(" <");
                content.author = authInfos[0];
            }

            if (defaultVals.length !== 0) {
                content.defaultVals = defaultVals;
            }
            // console.log(argsDef);
            if (argsDef.length !== 0) {
                content.argsDef = argsDef;
                // console.log(content.argsDef);
            }
            options.content = content;
            ret.push({ name, options });
        }

        return ret;
    }

    paramArgsDescription(paramType) {
        const ret = new Map();
        for (const orphan of this.orphans) {
            const isTypedef = Reflect.has(orphan, "typedef");
            const hasProperty = Reflect.has(orphan, "property");
            if (!isTypedef || paramType !== orphan.typedef.name || !hasProperty) {
                continue;
            }
            const properties = [];
            for (const prop of orphan.property) {
                // eslint-disable-next-line max-depth
                if (is.nullOrUndefined(prop.desc)) {
                    prop.desc = "";
                }
                properties.push(prop);
            }
            ret.set(orphan.typedef.name, properties);
        }

        return ret;
    }

    static genHtmlMethod(name, options = Object.create(null)) {
        argc(name, is.string);
        argc(options, is.plainObject);
        const {
            isStatic = false,
            params = [],
            version = "0.1.0",
            typeReturn,
            content
        } = options;
        argc(isStatic, is.boolean);
        argc(params, is.array);
        argc(typeReturn, [is.nullOrUndefined, is.string]);
        argc(content, is.plainObject, (obj) => Object.entries(obj).length > 0);
        argc(version, is.string, isSemver);

        const properties = Object.keys(content);
        const containValidProp = properties.some((item) => VALID_PROP.has(item));
        if (containValidProp === false) {
            throw new Error(`content must contain at least one of properties of the Set: ${Array.from(VALID_PROP).join(", ")}`);
        }

        if (Reflect.has(content, "desc") && !is.string(content.desc)) {
            argc(content.desc, is.string);
        }

        if (Reflect.has(content, "defaultVals")) {
            argc(content.defaultVals, is.array, (arr) => arr.length > 0);
            // eslint-disable-next-line prefer-const
            for (let [i, { name, type, value }] of content.defaultVals.entries()) {
                if (is.undefined(name) || is.undefined(type) || is.undefined(value)) {
                    // eslint-disable-next-line max-len
                    throw new Error("DefaultVals is an array of Object, each object must contain these keys : name, type and value");
                }
                argc(name, is.string);
                argc(type, is.string);
                type = type.toLowerCase();
                if (type === "string" || type === "boolean" || type === "number") {
                    content.defaultVals[i].type = type;
                }
                else {
                    content.defaultVals[i].type = "obj";
                }
                if (is.plainObject(value)) {
                    content.defaultVals[i].value = JSON.stringify(value);
                }
            }
        }
        if (Reflect.has(content, "example")) {
            argc(content.example, is.string);
        }
        if (!is.nullOrUndefined(content.argsDef)) {
            Generator.argumentDefCheck(content.argsDef);
        }

        if (Reflect.has(content, "throws")) {
            argc(content.throws, is.array, (arr) => arr.length > 0);
        }

        return zup(TEMPLATE_METHOD)({
            name, isStatic, params, typeReturn, content, version: isSemver(version)
        });
    }

    buildPropDefinition(className) {
        if (className === undefined) {
            return [];
        }
        const memberClass = this.members[className].find((elem) => Reflect.has(elem, "class"));
        const properties = memberClass.property;
        for (const [index, prop] of properties.entries()) {
            prop.value = /\|/g.test(prop.value) ? prop.value.replace("|", " | ") : prop.value;
            Reflect.set(properties[index], "type", prop.value);
            Reflect.deleteProperty(properties[index], "value");
        }

        return properties;
    }

    static genHtmlProperty(propDefinition) {
        const { required, name, type, desc, version = "0.1.0" } = propDefinition;
        argc(required, is.boolean);
        argc(name, is.string);
        argc(type, is.string);
        argc(desc, is.string);
        argc(version, is.string, isSemver);

        return zup(TEMPLATE_PROP)({ required, name, type, version: isSemver(version), desc });
    }

    static argumentDefCheck(argsDef) {
        argc(argsDef, is.array, (arr) => arr.length > 0);
        for (const [obj, properties] of argsDef) {
            argc(obj, is.string);
            argc(properties, is.array);
            for (const property of properties) {
                const { desc, name, required, value } = property;
                argc(desc, is.string);
                argc(name, is.string);
                argc(required, is.boolean);
                argc(value, is.string);
            }
        }
    }
}

// Export class
module.exports = Generator;
