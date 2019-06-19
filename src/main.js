//  Test 1
// const symName = Symbol("name");
// const obj = {};

// console.log("symName");
// console.log(symName);

// const isReflect = Reflect.defineProperty(obj, symName, { value: "marko" });
// console.log(obj);
// console.log("symName 2:");
// console.log(symName);

// Test 2
// const orphan = { orphan: { title: "test1" } };
// const hasName = Object.prototype.hasOwnProperty.call(obj.orphan, "name");
// const hasTitle = Object.prototype.hasOwnProperty.call(obj.test, "title");
// console.log(`${hasName} - ${hasTitle}`);

// Test 3
// const ret = [1, 2, 3];
// {
//     const ret = "string";
//     console.log(ret);
// }

// console.log(ret);

// Test 4 
// const is = require("@slimio/is");
// const argsDef = new Map();
// const ret = new Map();
// ret.set("Payload", { value: "psp", default: null, required: true, name: "psp" });
// ret.set("Payload2", { value: "psp2", default: "true", required: true, name: "psp2" });
// for (const [key, val] of ret.entries()) {
//     argsDef.set(key, val);
// }
// argsDef.set([...ret.keys(), ...ret.values()]);
// console.log(argsDef);
// console.log(ret);

// Test 5 
const argsDef = [
    [
        "Payload",
        [
            {
                value: "String",
                default: null,
                required: true,
                name: "name",
                desc: "Name config"
            },
            {
                value: "String",
                default: null,
                required: true,
                name: "version",
                desc: "Version config"
            }
        ]
    ]
]

for (const [key, vals] of argsDef) {
    console.log(key);
    for (const obj of vals) {
        console.log(obj.name);
        
    }
}
