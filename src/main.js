import { mkdirSync, createWriteStream } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { open } from 'node:fs/promises';
import fastcsv from 'fast-csv';
import { parseTahot } from './tat/tahot.js';
import { parseTagnt } from './tat/tagnt.js';
import { parseTbesh } from './dictionaries/tbesh.js';

const outdir = 'dist';

const order = [
"gen",
"exo",
"lev",
"num",
"deu",
"jos",
"jdg",
"rut",
"1sa",
"2sa",
"1ki",
"2ki",
"1ch",
"2ch",
"ezr",
"neh",
"est",
"job",
"psa",
"pro",
"ecc",
"sng",
"isa",
"jer",
"lam",
"ezk",
"dan",
"hos",
"jol",
"amo",
"oba",
"jon",
"mic",
"nam",
"hab",
"zep",
"hag",
"zec",
"mal",
"mat",
"mrk",
"luk",
"jhn",
"act",
"rom",
"1co",
"2co",
"gal",
"eph",
"php",
"col",
"1th",
"2th",
"1ti",
"2ti",
"tit",
"phm",
"heb",
"jas",
"1pe",
"2pe",
"1jn",
"2jn",
"3jn",
"jud",
"rev",
];

/** @param {string} fname */
async function parseFile(fname) {
	const file = await open(fname);
	const lineReader = file.readLines();

	let firstLine = (await lineReader[Symbol.asyncIterator]().next()).value;
	if (firstLine.charCodeAt(0) == 0xfeff) firstLine = firstLine.substring(1);

	let outpath;
	let parser;

	const bookRange = basename(fname).split(' ')?.[1];
	const firstBook = bookRange?.split('-')?.[0]?.toLowerCase();
	const n = order.indexOf(firstBook);

	if (firstLine.startsWith('TAHOT')) {
		parser = parseTahot;
		if (n == -1) throw Error(`could not extract book from ${basename(fname)}`);
		outpath = join(outdir, 'heb_tat', `${(n + 1).toString().padStart(2, '0')}-${bookRange}.csv`);
	} else if (firstLine.startsWith('TAGNT')) {
		parser = parseTagnt;
		if (n == -1) throw Error(`could not extract book from ${basename(fname)}`);
		outpath = join(outdir, 'grc_tat', `${(n + 1).toString().padStart(2, '0')}-${bookRange}.csv`);
	} else if (firstLine.startsWith('TBESH')) {
		parser = parseTbesh;
		outpath = join(outdir, 'tbesh.csv');
	} else if (firstLine.startsWith('TBESG')) {
		parser = parseTbesh;
		outpath = join(outdir, 'tbesg.csv');
	} else {
		throw Error(`${fname} has unknown file type`);
	}

	console.log(fname, '->', outpath);

	const out = fastcsv.format({ headers: true, delimiter: '|' });
	mkdirSync(dirname(outpath), { recursive: true });
	out.pipe(createWriteStream(outpath));

	await parser(lineReader, out);

	out.end();
}

await Promise.all(process.argv.slice(2).map(parseFile));
