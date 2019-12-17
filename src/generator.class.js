"use strict";

/* eslint-disable require-jsdoc */
// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Internal Dependencies
const { isSemver } = require("../src/utils");

// Require Third-party Dependencies
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
     * @class
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
        this.members = members;
        this.orphans = orphans;
        this.selectedClass = "";
        this.classes = Object.keys(members);
    }

    /**
     * @version 0.1.0
     *
     * @public
     * @function read
     * @description
     * @memberof Generator#
     *
     * @returns {void}
     */
    genHTML() {
        const h3 = "<h3 class='property'><span class='icon-cube-10'></span>Property</h3>";
        const endFile = "</main></body></html>";

        let htmlPage = Generator.genHtmlHeader(null, this.classes[0]);
        if (typeof this.classes[0] !== "undefined") {
            htmlPage += this.genConstructor(this.classes[0]);
        }
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

    genConstructor(className) {
        argc(className, is.string);
        argc(this.members[className], !is.nullOrUndefined);

        const name = "Constructor";
        const construct = this.members[className].find((elem) => Reflect.has(elem, "constructor") || Reflect.has(elem, "class"));
        const content = {};
        const defaultVals = [];
        const params = [];
        const argsDef = [];

        const gen = this.getParams(construct.param);
        for (const [key, value] of gen) {
            switch (key) {
                case "default":
                    defaultVals.push(value);
                    break;
                case "params":
                    params.push(value);
                    break;
                case "argsDesc":
                    argsDef.push(...value.entries());
                    break;
                default:
                    break;
            }
        }

        if (!is.nullOrUndefined(construct.example)) {
            const ex = construct.example.value.replace(/\s{6}/g, "<br>");
            content.example = ex;
        }
        if (!is.nullOrUndefined(construct.author)) {
            const authInfos = construct.author.value.split(" <");
            content.author = authInfos[0];
        }
        if (is.array(construct.throws)) {
            content.throws = construct.throws.map((obj) => obj.value);
        }
        else if (is.plainObject(construct.throws)) {
            content.throws = [construct.throws.value];
        }
        if (defaultVals.length !== 0) {
            content.defaultVals = defaultVals;
        }
        if (argsDef.length !== 0) {
            content.argsDef = argsDef;
        }

        return zup(TEMPLATE_METHOD)({ name, params, content });
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

            const gen = this.getParams(method.param);
            for (const [key, value] of gen) {
                switch (key) {
                    case "default":
                        defaultVals.push(value);
                        break;
                    case "params":
                        options.params.push(value);
                        break;
                    case "argsDesc":
                        argsDef.push(...value.entries());
                        break;
                    default:
                        break;
                }
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
            if (argsDef.length !== 0) {
                content.argsDef = argsDef;
            }
            options.content = content;
            ret.push({ name, options });
        }

        return ret;
    }

    * getParams(params) {
        if (is.array(params)) {
            for (const param of params) {
                const { name, value: type, required, default: value } = param;
                if (!is.nullOrUndefined(value)) {
                    yield ["default", { name, type, value }];
                }
                yield ["params", [name, type, required]];
                yield ["argsDesc", this.paramArgsDescription(type)];
            }
        }
        if (is.plainObject(params)) {
            const { name, value: type, required, default: value } = params;
            if (!is.nullOrUndefined(value)) {
                yield ["default", { name, type, value }];
            }
            yield ["params", [name, type, required]];
        }
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
            argc(content.argsDef, is.array, (arr) => arr.length > 0);
            for (const [obj, properties] of content.argsDef) {
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

        if (Reflect.has(content, "throws")) {
            argc(content.throws, is.array, (arr) => arr.length > 0);
        }

        return zup(TEMPLATE_METHOD)({
            name, isStatic, params, typeReturn, content, version: isSemver(version)
        });
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

    buildPropDefinition(className) {
        if (is.nullOrUndefined(className)) {
            return [];
        }

        const memberClass = this.members[className].find((elem) => Reflect.has(elem, "class"));
        if (!Reflect.has(memberClass, "property")) {
            return [];
        }

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
}

// Export class
module.exports = Generator;
