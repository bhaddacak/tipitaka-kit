---
---

# Tipiṭaka Kit

This project grew out of my attempt to utilize Tipiṭaka collections in `Pāli Platform 3` (PP3). A similar approach can be found in my former [CST-Kit](https://github.com/bhaddacak/cst-kit), which is the base of CSTR collection in the program.

The target corpora here by now are the CST4 XML data and the tipitaka.lk's BJT collection. The former has a better edited version at [Tipitaka.org XML](https://github.com/vipassanatech/tipitaka-xml) maintained by [Vipassana Research Institute](https://tipitaka.org). The latter has its web base maintained by [Path Nirvana Foundation](https://pathnirvana.org) at this [Github](https://github.com/pathnirvana/tipitaka.lk/tree/master/public/static/text).

I will explain the process that I use to make these collections applicable to PP3 in a hope that anyone can do the job by himself/herself ahead of me when the corpora are updated.

## Requirements

GNU/Linux is my working environment and it has very simple and powerful tools such as `bash`, `sed`, `awk`. So, I mainly use this Unix toolkit for most works. However, script transformation is too complicated for those. I use `Node.js` (JavaScript) in this case.

To summarize in tool part, it is advisable to use a Linux distribution with `bash`, `GNU sed`, and `Gawk` installed, together with other basic tools like `grep` and `iconv` (typically all these are always available). In the system you also have to install `nodejs` (the package name may be different in your Linux distribution, but `npm` is not needed).

For the collections, you have to download all texts from their Github site. For Tipitaka-XML we need only Devanagari, and BJT has only Sinhala script version. To avoid downloading the whole repository, use [DownGit](https://downgit.github.io/) or [download-directory](https://download-directory.github.io/) to download a selected directory. These are very convenient tools.

When data files are available, unpack them and move to the relevant directory (`cst4` or `bjt`). All source files have to be under one directory (not levels of directories) in both cases, typically `xml` for CST4 and `text` for BJT. When working in either collection, you have to be in that directory first.

## CST4 XML Data

This is the most complete collection we have. The very source of this collection is in Devanagari script. When applied to PP3, all files (217 totally) have to be converted to Roman script (explained below). Since the file structure in the CST4 bundle and Tipitaka-XML is identical, the process can be used with both sets. But the latter is preferable because it is more up-to-date. Here are the process:

> 1. Change encoding of Devanagari source files to UTF-8
> 2. Do character analysis to the Devanagari source files (optional)
> 3. Convert to Roman script
> 4. Do character analysis to the Roman source files (optional)
> 5. Create nti-fixed version (if needed)
> 6. Manually fix some nti instances (when nti-version is created)

### Changing to UTF-8

Universally in Linux we use UTF-8 encoding, but the XML files in CST4 collection are made from Windows, which uses UTF-16 normally. The first step then is converting all files to UTF-8. The main utility used here is `iconv`, but I make a wrapper to ease the use. So, the command to use here is:

```
$ ./to_utf8 <xml-dir>
```

The `<xml-dir>` is the directory containing the Devanagari source files. If not specified, `xml` is expected (you may need to rename `deva` to `xml` or use `deva` directly). The output of this process is a directory with `_utf8` added to its name.

### Character Analysis

Character stat can discover textual errors. I found a lot of them myself in this way. We can do this with a group of texts regardless of their script. There are two steps involved: one is to generate stat files, and another is to show the result. The commands used are:

```
$ ./gencharstat <input-dir>
$ ./showcharstat
```

The `<input-dir>` is the directory of your UTF-8 source files. It may be in any script, Devanagari or Roman or whatever. When the first command is issued, it will create stat files in a directory. The second command reads the stat files and calculates the report which shows all characters used in the texts with their frequency. Look closely to the least frequent occurrences upwards. Unexpected characters often show up there.

To find the files that have an unexpected character, simply use `grep`. The following example shows how to find the files containing an unexpected caret (^) character. Note that the caret (^) is a meta-character of regular expression. When finding it literally, you have to escape it.

```
$ grep '\^' xml/*.xml
```

When you are not sure about a character or symbol, particularly a peculiar one, you have to see it by character code. If you use `vim`, it will be easy to see the character code under the cursor in normal mode by pressing `ga`. In this case, you may need to issue the following command instead to see the report.

```
$ ./showcharstat | vim
```

### Roman script conversion

I normally work with Roman script texts, simply because I cannot read other scripts except Thai. And I think most students of Pāli in the world feel comfortable in the same way. Roman script may have some inconvenient points in programming, such as the representations of one Pāli letter with two in the cases of 'kh', 'gh', 'ch', etc. But Roman script is the easiest to read and process.

Thanks to standardization of Devanagari, the conversion from it to Roman is simple and straightforward. However, with the different mechanics used in textual composition in both scripts, when converting Devanagari text to Roman with English system, we lose a lot of things. So, we cannot revert the conversion completely.

Here comes my system of conversion, called *least contamination method*. This is its specification:

> 1. Only Devanagari characters (not symbols) are converted to Roman. No capitalization is applied.
> 2. Punctuation marks and symbols are visually retained as follows:
>     - Single daṇḍa (U+0964) is converted to vertical line (U+007C).
>     - Double daṇḍa (U+0965) is converted to double vertical line (U+2016).
>     - Abbreviation sign (U+0970) is converted to middle dot (U+00B7).
>     - No full stop period is used. Dot (U+002E) appears only with numbers.
> 3. Some rare Sanskrit vowels have awkward treatments as follows:
>     - Vowel AI (U+0910, U+0948) is converted to ē (e with macron).
>     - Vowel AU (U+0914, U+094C) is converted to ō (o with macron).

By the way of conversion above, we can convert Devanagari to Roman, then convert Roman back to Devanagari with 100% as original. Here is the command to use.

```
$ node deva_to_roman.js <xml-utf8-dir>
```

The `<xml-utf8-dir>` is the output directory of the UTF-8 conversion step described above. The program does not work with the UTF-16 original source files. So, we need to convert them to UTF-8 first. After we enter the command, we will get one new directory with Roman texts in it.

### Nti fixing

When text is composed in Devanagari with a quote (’ or ”) inserted, particularly to mark an *iti* clause, it inevitably or naturally produces *’nti* or *”nti*. For example, *saṅgītinti* becomes *saṅgīti’nti*. When this text undergoes an indexing process, the quote breaks the word into two, hence *saṅgīti* and *nti*. As a result, the accusative marker, in this case, is lost. When we list terms later, we will find only *saṅgīti* not *saṅgītiṃ* as implied in the text.

To fix this problem, we have to move the quote to the position after '*n*', hence *saṅgītin’ti*. By this way, after indexing we now get *saṅgītin*, which is easily converted back to *saṅgītiṃ*.

Most if not all of Pāli corpora based on Devanagari or Sinhala (in BJT case) have this problem. And it seems there is no easy way to solve this. (The corpus of SuttaCentral does not have this problem.) Lucky us who work with Roman texts, we can fix this in an unexpectedly simple way.

To fix *nti* of the Roman texts, use this command:

```
$ ./make_ntifixed <roman-dir>
```

The `<roman-dir>` is the output directory we get from the Devanagari-to-Roman conversion process. After this we will get a new directory with nti-fixed texts.

Unfortunately, our job has not finished yet. For the complications in the text itself, we have to do some fixes manually. Find a spreadsheet report named *manually\_nti\_fixing\_report* (available in Excel and Gnumeric format) and follow that.

### Conclusion

If we leave out character analysis which often comes with manually text fixing and focus only Roman texts production, here are the commands summarized:

```
$ ./to_utf8 <xml-dir>
$ node deva_to_roman.js <xml-utf8-dir>

(optional)
$ ./make_ntifixed <roman-dir>
```

To make use of the final product with PP3, zip the whole directory and rename it to `cst4roman_utf8.zip`. Put the file in directory `data/text/cst4` of PP3.

## Buddha Jayanthi Tripitaka (BJT)

Having several corpora for Pāli studies enables us to do textual comparison. If the texts are gathered into one place, it will be very convenient to students. The tipitaka.lk's BJT collection maintained by *Path Nirvana Foundation* is well-organized and seems to be actively updated. So, this is another corpus we should use in our study. One problem with this corpus is it is available only in Sinhala script. To use these texts (285 totally), we have to do the following process:

> 1. Clean up the text by removing Sinhalese translations and footnotes
> 2. Do character analysis to the Sinhala source files (optional)
> 3. Convert to Roman script
> 4. Do character analysis to the Roman source files (optional)
> 5. Create nti-fixed version (if needed)

### Cleaning up

To make the corpus size smaller, we will remove unused portions. These are mainly Sinhalese translations of the texts. Unfortunately, even though the Pāli text also has its footnotes, these footnotes are sometimes written in Sinhalese. By this reason, we have to remove the Pāli footnotes as well to prevent the contamination of non-Pāli characters. To clean up the source text, use this command:

```
$ node cleanup.js <text-dir>
```

The `<text-dir>` is the directory of BJT text in its full form. After this we will get a new directory containing only with Sinhala Pāli text.

### Character Analysis

If micro-analysis is needed, you may check the corpus with character stat. This step is the same as the CST4 case above, except the BJT files are in JSON format not XML. You can use the procedure described above with some adaptation.

### Roman script conversion

Conversion Sinhala text to Roman is more straightforward than that of CST4 Devanagari text. There is no special treatment for this. The command is:

```
$ node sinh_to_roman.js <text-dir>
```
The `<text-dir>` is the output directory obtained by the cleaning step above. Then we will get a new directory of BJT Roman.

### Nti fixing

If needed, you can further create a nti-fixed version of the text simply by this command:

```
$ ./make_ntifixed <roman-dir>
```

The `<roman-dir>` is the output directory we get from the Sinhala-to-Roman conversion process. The we will get a new directory in return. No manually fixes are needed.

### Conclusion

Here are the steps summarized, in case character analysis is not required.

```
$ node cleanup.js <text-dir>
$ node sinh_to_roman.js <clean-text-dir>

(optional)
$ ./make_ntifixed <roman-dir>
```

To make use of the final product with PP3, zip the whole directory and rename it to `bjt_pali.zip`. Put the file in directory `data/text/bjt` of PP3.

## Notes on textual corrections

When I worked on the both corpora, I found several points worth correcting. I made the reports and put them here. For the corpus maintainers, these will be helpful to recheck or enhance their corrections. See my summary at [Tipiṭaka Correction Report](https://bhaddacak.github.io/correport).

## Licenses

This repository stores none of Pāli texts. For the license of the texts, please consult their source. For the programs written by the author, except stated otherwise, are unlicensed. The exceptions are the JavaScript programs for script transformation. These are licensed under [GPL](https://www.gnu.org/licenses/) version 3.
