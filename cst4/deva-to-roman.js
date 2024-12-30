/*
 * deva-to-roman.js
 * Converts XML texts of CST4 from Devanagari script to Roman
 * using least contamination method explained hereafter.
 *   Only Devanagari characters are converted to Roman,
 *   other punctuation marks are visually retained as follows:
 *     - Single danda (U+0964) is converted to vertical line (U+007C).
 *     - Double danda (U+0965) is converted to double vertical line (U+2016).
 *     - Abbreviation sign (U+0970) is converted to middle dot (U+00B7).
 *     - No full stop period is used. Dot (U+002E) appears only with numbers.
 *     - No capitalization is applied.
 *   Some rare Sanskrit vowels have awkward treatments as follows:
 *     - Vowel AI (U+0910, U+0948) is converted to ē (e with macron)
 *     - Vowel AU (U+0914, U+094C) is converted to ō (o with macron)
 * USAGE:
 *   $ node deva-to-roman.js <xml-dir>
 * NOTES:
 *   - The script works only with UTF-8 input files.
 *   - For the CST4 XML data with UTF-16 encoding,
 *     the files have to converted to UTF-8 before processed.
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
const romanVowels = "aāiīuūeēoō";
const romanNumbers = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ];
const romanConsonantsStr = [
	"k", "kh", "g", "gh", "ṅ",
	"c", "ch", "j", "jh", "ñ",
	"ṭ", "ṭh", "ḍ", "ḍh", "ṇ",
	"t", "th", "d", "dh", "n",
	"p", "ph", "b", "bh", "m",
	"y", "r", "l", "v", "s", "h", "ḷ", "ṃ" ];
const devaVowelsInd = [ '\u{0905}', '\u{0906}', '\u{0907}', '\u{0908}', '\u{0909}', '\u{090A}', '\u{090F}', '\u{0910}', '\u{0913}', '\u{0914}' ];
const devaVowelsDep = [ '\u{0905}', '\u{093E}', '\u{093F}', '\u{0940}', '\u{0941}', '\u{0942}', '\u{0947}', '\u{0948}', '\u{094B}', '\u{094C}' ];
const devaNumbers = [ '\u{0966}', '\u{0967}', '\u{0968}', '\u{0969}', '\u{096A}', '\u{096B}', '\u{096C}', '\u{096D}', '\u{096E}', '\u{096F}' ];
const devaVirama = '\u{094D}';
const devaPeriod = '\u{0964}';
const devaDoublePeriod = '\u{0965}';
const devaAbbrev = '\u{0970}';
const devaConsonants = [
	'\u{0915}', '\u{0916}', '\u{0917}', '\u{0918}', '\u{0919}',
	'\u{091A}', '\u{091B}', '\u{091C}', '\u{091D}', '\u{091E}',
	'\u{091F}', '\u{0920}', '\u{0921}', '\u{0922}', '\u{0923}',
	'\u{0924}', '\u{0925}', '\u{0926}', '\u{0927}', '\u{0928}',
	'\u{092A}', '\u{092B}', '\u{092C}', '\u{092D}', '\u{092E}',
	'\u{092F}', '\u{0930}', '\u{0932}', '\u{0935}', '\u{0938}', '\u{0939}', '\u{0933}', '\u{0902}' ];
function devanagariToRoman(input) {
	let output = "";
	let rch = null;
	let dch = null;
	let ind = 0; // general purpose index
	let skipFlag = false;
	for(let index = 0; index<input.length; index++) {
		if(skipFlag) {
			skipFlag = false;
			continue;
		}
		dch = input[index];
		rch = dch;
		if(devaNumbers.indexOf(dch) >= 0) {
			rch = numberMap[dch];
		} else if(dch == devaPeriod) {
			rch = "|";
		} else if(dch == devaDoublePeriod) {
			rch = '\u2016';
		} else if(dch == devaAbbrev) {
			rch = '\u00B7';
		} else if(devaVowelsInd.indexOf(dch) >= 0) {
			rch = indVowelMap[dch];
		} else if(devaVowelsDep.indexOf(dch) >= 0 && dch != '\u0905') {
			rch = depVowelMap[dch];
		} else {
			rch = consonantMap[dch];
			if(rch == undefined)
				rch = dch;
		}
		output += rch;
		if(index < input.length-1) {
			if(input[index+1] == devaVirama) {
				skipFlag = true;
			} else if(consonantMap[dch] != undefined && dch != '\u0902' && input[index+1] != '\u093E' &&
						input[index+1] != '\u093F' && input[index+1] != '\u0940' &&
						input[index+1] != '\u0941' && input[index+1] != '\u0942' &&
						input[index+1] != '\u0947' && input[index+1] != '\u0948' &&
						input[index+1] != '\u094B' && input[index+1] != '\u094C') {
				// double Devanagari consonants, 'a' is added (not anusvara, not followed by vowels)
				output += 'a';
			}
		} else {
			// if the last char is a consonant, not a niggahita, add 'a'
			if(consonantMap[dch] != undefined && dch != '\u0902')
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
for(let i=0; i<devaVowelsInd.length; i++)
	indVowelMap[devaVowelsInd[i]] = romanVowels[i];
let depVowelMap = {};
for(let i=0; i<devaVowelsDep.length; i++)
	depVowelMap[devaVowelsDep[i]] = romanVowels[i];
let consonantMap = {};
for(let i=0; i<devaConsonants.length; i++)
	consonantMap[devaConsonants[i]] = romanConsonantsStr[i];
let numberMap = {};
for(let i=0; i<devaNumbers.length; i++)
	numberMap[devaNumbers[i]] = romanNumbers[i];
const inputdir = process.argv[2];
const outPrefix = "roman_";
const outdir = outPrefix + inputdir;
const devaXsl = "tipitaka-deva.xsl";
const romanXsl = "tipitaka-latn.xsl";
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
			// fix XSL header
			if (line.indexOf(devaXsl) > -1) {
				text += line.replace(devaXsl, romanXsl) + "\n";
				continue;
			}
			// convert to Roman
			line = devanagariToRoman(line);
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
	// make file list
	if (file.endsWith(".xml")) {
		filelist.push(file);
	}
});
