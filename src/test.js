"use strict";

const { readFileSync } = require("fs");
const { join, normalize } = require("path");
// Require Internal Dependencies
const Generator = require("../src/generator.class");

const docsStr = readFileSync(join(normalize("d:/workspace"), "minifiedDocs.json"), { encoding: "utf8" });
const docs = JSON.parse(docsStr);
const gen = new Generator(docs);

const ret = gen.genHTML();
console.log(ret);
