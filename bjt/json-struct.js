/*
 * json-struct.js
 * Shows simple structure of a JSON file.
 * Elements of an array are counted,
 * but only the first element of it is analyzed.
 * USAGE:
 *   $ node json-struct.js <json-file>
 *
 * Copyright (C) 2025 J. R. Bhaddacak
 *
 * This program is free to use, modify, and redistribute.
 */
let inputFile;
if (process.argv.length < 3) {
	console.log("Please enter a JSON file.");
	process.exit(1);
} else {
	inputFile = process.argv[2];
}
function showObject(obj, level = 1) {
	let indent = "";
	let start = level;
	while (--start > 0) {
		indent += "\t";
	}
	if (typeof obj === "object") {
		for (const key in obj) {
			const nodeStr = Array.isArray(obj[key])
							? indent + key + "[1 of " + obj[key].length + "]"
							: indent + key;
			console.log(nodeStr);
			if (typeof obj[key] === "object") {
				if (Array.isArray(obj[key])) {
					showObject(obj[key][0], level + 1);
				} else {
					showObject(obj[key], level + 1);
				}
			}
		}
	}
}
const fs = require("fs");
const inputJson = JSON.parse(fs.readFileSync(inputFile).toString());
showObject(inputJson);
