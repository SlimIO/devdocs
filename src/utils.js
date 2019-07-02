
const { join, extname } = require("path");
const { readdirSync, lstatSync } = require("fs");

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

module.exports = getRecursifJsFile;
