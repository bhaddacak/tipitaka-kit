/*
 * cleanup.js
 * Cleans up the Sinhalese version of BJT (tipitaka.lk)
 * by the following criteria:
 *   - Only Pali text is retained.
 *   - Sinhalese translations are removed.
 *   - All footnotes are removed.
 *   - The JSON structure is retained.
 * USAGE:
 *   $ node cleanup.js <text-dir>
 *
 * Copyright (C) 2025 J. R. Bhaddacak
 *
 * This program is free to use, modify, and redistribute.
 */
const fs = require("fs");
function walk(dir, done, emitter) {
	let results = {};
	emitter = emitter || new (require("events").EventEmitter);
	fs.readdir(dir, (err, list) => {
		let pending = list.length;
		if(err || !pending) {
			return done(err, results);
		}
		list.forEach(file => {
			let dfile = `${dir}/${file}`;
			fs.stat(dfile, (err, stat) => {
				if(err) {
					throw err;
				}
				if(stat.isDirectory()) {
					emitter.emit("directory", dfile, stat);
					return walk(dfile, (err, res) => {
						results[file] = res;
						!--pending && done(null, results);
					}, emitter);
				} 
				emitter.emit("file", dfile, stat);
				results[file] = stat;
				!--pending && done(null, results);
			});
		});
	});
	return emitter;
}
// the program starts here
if (process.argv.length < 3) {
	console.log("Please enter a directory");
	process.exit(1);
}
// initialize some variables
const inputdir = process.argv[2];
const outPrefix = "clean_";
const outdir = outPrefix + inputdir;
if (!fs.existsSync(outdir))
	fs.mkdirSync(outdir);
let filelist = [];
walk(inputdir, (err, res) => {
	filelist.forEach(file => {
		const inputJson = JSON.parse(fs.readFileSync(file).toString());
		const root = {};
		for (const key in inputJson) {
			if (key === "pages") {
				root.pages = [];
				for (const p of inputJson.pages) {
					const page = {};
					page.pageNum = p.pageNum;
					page.pali = {};
					page.pali.entries = p.pali.entries;
					root.pages.push(page);
				}
			} else {
				root[key] = inputJson[key];
			}
		}
		const out = JSON.stringify(root, null, 1);
		fs.writeFileSync(outPrefix + file, out);
		console.log(file + " processed");
	});
}).on("file", (file, stat) => {
	if (file.endsWith(".json")) {
		filelist.push(file);
	}
});
