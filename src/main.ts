import { mkdirSync, createWriteStream } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { type Interface } from 'node:readline';
import { open } from 'node:fs/promises';
import { books } from '@openbible/core';
import fastcsv from 'fast-csv';
import { parse as parseTahot } from './tat/tahot.ts';
import { parse as parseTagnt } from './tat/tagnt.ts';
import { parse as parseTbl } from './dictionaries/tbl.ts';

const outdir = 'dist';

export type LineReader = Interface;
export type Out = fastcsv.CsvFormatterStream<fastcsv.FormatterRow, fastcsv.FormatterRow>;

async function parseFile(fname: string) {
	const file = await open(fname);
	const lineReader = file.readLines();

	let firstLine = (await lineReader[Symbol.asyncIterator]().next()).value;
	if (firstLine.charCodeAt(0) == 0xfeff) firstLine = firstLine.substring(1);

	let outpath: string;
	let parser: (lineReader: LineReader, out: Out) => Promise<void>;

	const bookRange = basename(fname).split(' ')?.[1];
	const firstBook = bookRange?.split('-')?.[0]?.toLowerCase();
	const n = (books.protestant as unknown as string[]).indexOf(firstBook);

	if (firstLine.startsWith('TAHOT')) {
		parser = parseTahot;
		if (n == -1) throw Error(`could not extract book from ${basename(fname)}`);
		outpath = join(outdir, 'heb_tat', `${(n + 1).toString().padStart(2, '0')}-${bookRange}.csv`);
	} else if (firstLine.startsWith('TAGNT')) {
		parser = parseTagnt;
		if (n == -1) throw Error(`could not extract book from ${basename(fname)}`);
		outpath = join(outdir, 'grc_tat', `${(n + 1).toString().padStart(2, '0')}-${bookRange}.csv`);
	} else if (firstLine.startsWith('TBESH')) {
		parser = parseTbl;
		outpath = join(outdir, 'tbesh.csv');
	} else if (firstLine.startsWith('TBESG')) {
		parser = parseTbl;
		outpath = join(outdir, 'tbesg.csv');
	} else {
		throw Error(`${fname} has unknown file type`);
	}

	console.log(fname, '->', outpath);

	const out = fastcsv.format({ headers: true });
	mkdirSync(dirname(outpath), { recursive: true });
	out.pipe(createWriteStream(outpath));

	await parser(lineReader, out);

	out.end();
}

for (let file of process.argv.slice(2)) await parseFile(file);
