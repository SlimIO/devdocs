/* eslint-disable require-jsdoc */
// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

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
        if (!is.string(className)) {
            throw new TypeError("className param must be a type of string");
        }
        if (is.nullOrUndefined(this.members[className])) {
            throw new Error(`There is no class ${className}`);
        }

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
                    // console.log(ret);
                    console.log(...ret.entries());
                    argsDef.push(...ret.entries());
                    // for (const args of ret.entries()) {
                    //     argsDef.push(args);
                    // }
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
        if (!is.nullOrUndefined(typeReturn) && !is.string(typeReturn)) {
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
            // eslint-disable-next-line max-len
            throw new Error(`content must contain at least one of properties of the Set: ${Array.from(VALID_PROP).join(", ")}`);
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

        if (Reflect.has(content, "desc") && !is.string(content.desc)) {
            throw new TypeError("desc property must be a type of String");
        }

        if (Reflect.has(content, "defaultVals")) {
            if (!is.array(content.defaultVals)) {
                throw new TypeError("defaultVals must be a type of Array<Object>, check doc");
            }
            if (content.defaultVals.length === 0) {
                throw new Error("defaultVals must not be an empty Array");
            }
            // eslint-disable-next-line prefer-const
            for (let [i, { name, type, value }] of content.defaultVals.entries()) {
                if (is.undefined(name) || is.undefined(type) || is.undefined(value)) {
                    // eslint-disable-next-line max-len
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
        if (Reflect.has(content, "example") && !is.string(content.example)) {
            throw new TypeError("content.example must be a type of string");
        }
        if (!is.nullOrUndefined(content.argsDef)) {
            Generator.argumentDefCheck(content.argsDef);
        }

        if (Reflect.has(content, "throws")) {
            if (!is.array(content.throws)) {
                throw new TypeError("content.throws must be a type of array");
            }
            if (content.throws.length === 0) {
                throw new Error("content.throws must not be an empty");
            }
        }

        return zup(TEMPLATE_METHOD)({
            name, isStatic, params, typeReturn, content, version
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

        return zup(TEMPLATE_PROP)({ required, name, type, version, desc });
    }

    static argumentDefCheck(argsDef) {
        if (!is.array(argsDef)) {
            throw new TypeError("content.argsDef must be a type of array");
        }
        if (argsDef.length === 0) {
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
            //     console.log(property.desc);
            //     const { name, type, default: dftValue, desc } = property;

            //     if (!is.string("name")) {
            //         throw new TypeError("name ")
            //     }
            // }
        }
    }
}

// Export class
module.exports = Generator;
