/*
 * sinh-to-roman.js
 * Converts XML texts of BJT (tipitaka.lk) from Sinhala script to Roman.
 * USAGE:
 *   $ node sinh-to-roman.js <text-dir>
 * NOTES:
 *   - The script works only with UTF-8 input files.
 *
 * Copyright (C) 2025 J. R. Bhaddacak 
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */
const fs = require("fs");
const romanVowels = "aāiīuūeo";
const romanNumbers = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ];
const romanConsonantsStr = [
	"k", "kh", "g", "gh", "ṅ",
	"c", "ch", "j", "jh", "ñ",
	"ṭ", "ṭh", "ḍ", "ḍh", "ṇ",
	"t", "th", "d", "dh", "n",
	"p", "ph", "b", "bh", "m",
	"y", "r", "l", "v", "s", "h", "ḷ", "ṃ" ];
const sinhalaVowelsInd = [ '\u{0D85}', '\u{0D86}', '\u{0D89}', '\u{0D8A}', '\u{0D8B}', '\u{0D8C}', '\u{0D91}', '\u{0D94}' ];
const sinhalaVowelsDep = [ '\u{0D85}', '\u{0DCF}', '\u{0DD2}', '\u{0DD3}', '\u{0DD4}', '\u{0DD6}', '\u{0DD9}', '\u{0DDC}' ];
const sinhalaVirama = '\u{0DCA}';
const sinhalaConsonants = [
		'\u{0D9A}', '\u{0D9B}', '\u{0D9C}', '\u{0D9D}', '\u{0D9E}',
		'\u{0DA0}', '\u{0DA1}', '\u{0DA2}', '\u{0DA3}', '\u{0DA4}',
		'\u{0DA7}', '\u{0DA8}', '\u{0DA9}', '\u{0DAA}', '\u{0DAB}',
		'\u{0DAD}', '\u{0DAE}', '\u{0DAF}', '\u{0DB0}', '\u{0DB1}',
		'\u{0DB4}', '\u{0DB5}', '\u{0DB6}', '\u{0DB7}', '\u{0DB8}',
		'\u{0DBA}', '\u{0DBB}', '\u{0DBD}', '\u{0DC0}', '\u{0DC3}', '\u{0DC4}', '\u{0DC5}', '\u{0D82}' ];
function sinhalaToRoman(input) {
	let output = "";
	let rch = null;
	let sch = null;
	let ind = 0; // general purpose index
	let skipFlag = false;
	for(let index = 0; index<input.length; index++) {
		if(skipFlag) {
			skipFlag = false;
			continue;
		}
		sch = input[index];
		rch = sch;
		if(sinhalaVowelsInd.indexOf(sch) >= 0) {
			rch = indVowelMap[sch];
		} else if(sinhalaVowelsDep.indexOf(sch) >= 0 && sch != '\u0D85') {
			rch = depVowelMap[sch];
		} else {
			rch = consonantMap[sch];
			if(rch == undefined)
				rch = sch;
		}
		output += rch;
		if(index < input.length-1) {
			if(input[index+1] == sinhalaVirama) {
				skipFlag = true;
			} else if(consonantMap[sch] != undefined && sch != '\u0D82' && input[index+1] != '\u0DCF' &&
						input[index+1] != '\u0DD2' && input[index+1] != '\u0DD3' &&
						input[index+1] != '\u0DD4' && input[index+1] != '\u0DD6' &&
						input[index+1] != '\u0DD9' && input[index+1] != '\u0DDC') {
				// double Sinhala consonants, 'a' is added (not anusvara, not followed by vowels)
				output += 'a';
			}
		} else {
			// if the last char is a consonant, not a niggahita, add 'a'
			if(consonantMap[sch] != undefined && sch != '\u0D82')
				output += 'a';
		}
	}
	return output;
}
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
let indVowelMap = {};
for(let i=0; i<sinhalaVowelsInd.length; i++)
	indVowelMap[sinhalaVowelsInd[i]] = romanVowels[i];
let depVowelMap = {};
for(let i=0; i<sinhalaVowelsDep.length; i++)
	depVowelMap[sinhalaVowelsDep[i]] = romanVowels[i];
let consonantMap = {};
for(let i=0; i<sinhalaConsonants.length; i++)
	consonantMap[sinhalaConsonants[i]] = romanConsonantsStr[i];
const inputdir = process.argv[2];
const outPrefix = "sinhala_";
const outdir = outPrefix + inputdir;
if (!fs.existsSync(outdir))
	fs.mkdirSync(outdir);
let filelist = [];
walk(inputdir, (err, res) => {
	filelist.forEach(file => {
		let text = "";
		const content = fs.readFileSync(file).toString();
		const lines = content.split(/\r?\n/);
		for (let line of lines) {
			// remove zero-width-joiner
			line = line.trim().replaceAll("\u{200D}", "");
			// ignore empty lines
			if (line.length < 1)
				continue;
			// convert to Roman
			line = sinhalaToRoman(line);
			// compress spaces to one
			line = line.replace(/ {2,}/g, " ");
			// fix spaces before periods
			line = line.replace(/ +\./g, ".");
			// fix spaces before commas
			line = line.replace(/ +,/g, ",");
			text += line + "\n";
		}
		fs.writeFileSync(outPrefix + file, text);
		console.log(file + " processed");
	});
}).on("file", (file, stat) => {
	if (file.endsWith(".json")) {
		filelist.push(file);
	}
});
