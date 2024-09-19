import { mkdirSync, createWriteStream } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { open } from 'node:fs/promises';
import fastcsv from 'fast-csv';
import { parseTahot } from './tat/tahot.js';
import { parseTagnt } from './tat/tagnt.js';

const outdir = 'dist';

/** @param {string} fname */
async function parseFile(fname) {
	const file = await open(fname);
	const lineReader = file.readLines();

	let firstLine = (await lineReader[Symbol.asyncIterator]().next()).value;
	if (firstLine.charCodeAt(0) == 0xfeff) firstLine = firstLine.substring(1);

	let parser;
	if (firstLine.startsWith('TAHOT')) parser = parseTahot;
	else if (firstLine.startsWith('TAGNT')) parser = parseTagnt;
	else throw Error(`${fname} has unknown file type`);

	const outpath = join(outdir, 'bibles', 'tat', `${basename(fname).split(' ')[1]}.csv`);
	console.log(fname, '->', outpath);

	const out = fastcsv.format({ headers: true, delimiter: '|' });
	mkdirSync(dirname(outpath), { recursive: true });
	out.pipe(createWriteStream(outpath));

	parser(lineReader, out);

	out.end();
}

await Promise.all(process.argv.slice(2).map(parseFile));
