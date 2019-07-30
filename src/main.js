"use strict";

const metohd = gen.genHtmlMethod("blabla", {
    isStatic: false,
    params: [
        ["param1", "string"],
        ["param2", "boolean", true]
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
        argsDef: [
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
        ],
        example: "const foo = true",
        throws: ["Error", "TypeError", "Other"]
    }
});
console.log(metohd);


const prop = gen.genHtmlProperty({
    required: true,
    name: "propertyName",
    type: "String",
    version: "0.2",
    desc: "Description of the property"
});
