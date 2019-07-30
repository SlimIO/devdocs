"use strict";

/**
 * @namespace utils
 * @description utils methods
 */

// Require Node.js Dependencies
const { join, extname } = require("path");
const { readdirSync, lstatSync } = require("fs");

// Require Third-party Dependencies
const semver = require("semver");
/**
 * @function
 * @generator
 * @param {!string} rootPath path to the root
 */
function* getRecursifJsFile(rootPath) {
    const allFiles = readdirSync(rootPath);
    let jsFiles = allFiles.filter((file) => extname(file) === ".js");
    jsFiles = jsFiles.map((fileName) => join(rootPath, fileName));
    for (const file of allFiles) {
        const filePath = join(rootPath, file);
        const stat = lstatSync(filePath);
        if (stat.isDirectory() && file !== "node_modules") {
            yield* getRecursifJsFile(filePath);
        }
    }
    if (jsFiles.length !== 0) {
        yield jsFiles;
    }
}

/**
 * @function isSemver
 * @memberof utils#
 * @description Check if the version complies with the semver standards
 * @param {!string} version version
 * @returns {string|null}
 *
 * @example
 * isSemver("1.0.5"); // "1.0.5"
 * isSemver("1.2"); // "1.2.0"
 * isSemver("2"); // "2.0.0"
 * isTypeString("world"); // null
 */
function isSemver(version) {
    const result = semver.coerce(version) || { version };

    return semver.valid(result.version);
}

module.exports = { getRecursifJsFile, isSemver };
