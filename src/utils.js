"use strict";

/**
 * @namespace utils
 * @description utils methods
 */

// Require Node.js Dependencies
const { readdir } = require("fs").promises;
const { join, extname } = require("path");

// Require Third-party Dependencies
const semver = require("semver");

// CONSTANTS
const EXCLUDE_DIRS = new Set(["node_modules", ".vscode", ".git", "test", "coverage", ".nyc_output"]);

/**
 * @async
 * @generator
 * @function getFilesRecursive
 * @memberof Utils#
 * @param {!string} dir root directory
 * @returns {AsyncIterableIterator<string>}
 */
async function* getFilesRecursive(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
        if (EXCLUDE_DIRS.has(dirent.name)) {
            continue;
        }

        if (dirent.isFile()) {
            if (extname(dirent.name) !== ".js" || dirent.name === "commitlint.config.js") {
                continue;
            }
            yield [dirent.name, join(dir, dirent.name)];
        }
        else if (dirent.isDirectory()) {
            yield* getFilesRecursive(join(dir, dirent.name));
        }
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

module.exports = { getFilesRecursive, isSemver };
