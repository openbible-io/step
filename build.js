import { mkdirSync, createWriteStream } from 'node:fs';
import { similarity } from './jaro-winkler.js';
import fastcsv from 'fast-csv';
import { basename, dirname, join } from 'node:path';
import { open } from 'node:fs/promises';
import assert from 'node:assert';

const outdir = 'dist';
const punctuation = {
	'־': '9014',
	'׀': '9015',
	'׃': '9016',
};

async function parseFile(fname) {
	// Largest file is 28MB, should be fine to load into memory.
	// Besides, we're going to need to take lots of substrings...
	const file = await open(fname);
	const lineReader = file.readLines();

	let firstLine = (await lineReader[Symbol.asyncIterator]().next()).value;
	if (firstLine.charCodeAt(0) == 0xfEFF) firstLine = firstLine.substring(1);

	if (firstLine.startsWith('TAHOT')) return parseTahot(fname, lineReader);
	else throw Error(`${fname} has unknown file type`);
}

async function parseTahot(fname, lineReader) {
	console.log('parsing', fname);
	const outpath = join(outdir, 'bibles', 'heb_tah', `${basename(fname).split(' ')[1]}.csv`);
	const out = fastcsv.format({ headers: true, delimiter: '|' });
	mkdirSync(dirname(outpath), { recursive: true });
	out.pipe(createWriteStream(outpath));

	let lastRef;
	let word = 0;
	for await (const line of lineReader) {
		const fields = line.split('\t');
		let ref;
		try {
			ref = new Ref(fields[0]);
		} catch { continue; }
		if (!lastRef?.eql(ref)) word = 0;
		word++;
		lastRef = ref;

		try {
			const [
				_,
				hebrew,
				transliteration,
				translation,
				strong,
				grammar,
				meaning_variant,
				spelling_variant,
			] = fields;

			const morphemes = parseTahotFields(
				ref.sources,
				ref,
				word,
				hebrew,
				strong,
				grammar,
				transliteration,
				translation,
			);

			meaning_variant.split('¦').filter(Boolean).forEach(variant => {
				// K= 'o.ho.Lo/h (אָהֳלֹ/ה\׃) "tent/ his" (H0168G/H9023\H9016=HNcbsc/Sp3ms)
				const match = variant.match(/([^ ]*)= ([^ ]*) \(([^\)]*)\) "(.*)" \(([^=]*)=([^\)]*)\)/);
				if (match?.length != 7) throw Error(variant);

				morphemes.push(...parseTahotFields(
					match[1],
					ref,
					word,
					match[3],
					match[5],
					match[6],
					match[2],
					match[4],
					'meaning',
				));
			});
			spelling_variant.split('¦').filter(Boolean).forEach(variant => {
				// L= אָהֳלֹֽ/ה\׃ ¦ ;
				if (variant.trim() == ';') return; // idk why these are here

				const match = variant.match(/([^ ]*)= ([^ ]*)/);
				if (match?.length != 3) throw Error(variant);

				// We want to align these. Goal is minimal manual alignment.
				const unaligned = parseTahotFields(
					match[1],
					ref,
					word,
					match[2],
					'',
					'',
					'',
					'',
					'spelling',
				);
				unaligned.forEach(u => align(u, morphemes, {
					lang: true,
					strong: true,
					grammar: true,
					transliteration: true,
					translation: true,
				}));
				morphemes.push(...unaligned);
			});

			morphemes.forEach(m => out.write(m));
			word = morphemes[morphemes.length - 1].word;
		} catch (e) {
			console.error(line);
			throw e;
		}
	}

	out.end();
}

/**
 * @param {sources} string
 * @param {ref} Ref
 * @param {word} string
 * @param {hebrew} string
 * @param {strong} string | undefined
 * @param {grammar} string | undefined
 * @param {transliteration} string | undefined
 * @param {translation} string | undefined
 * @param {variant} string | undefined
 */
function parseTahotFields(
	sources,
	ref,
	word,
	hebrew,
	strong,
	grammar,
	transliteration,
	translation,
	variant,
) {
	const splitRe = /\/|\\/;
	const hebrews = hebrew.split(splitRe);
	const strongs = strong.split(splitRe);
	const grammars = grammar.split(splitRe);
	const transliterations = transliteration.split(splitRe);
	const translations = translation.split(splitRe);

	assert(hebrews.length, ref);

	let lang;
	if (grammars[0].startsWith('H')) lang = 'heb';
	else if (grammars[0].startsWith('A')) lang = 'arc';
	else if (grammars[0]) throw Error(`unknown grammar prefix ${grammars}`);
	grammars[0] = grammars[0].substring(1);

	const res = [];
	for (let i = 0; i < hebrews.length; i++) {
		const text = hebrews[i].trim();
		if (!text) {
			word += 1;
			continue;
		}

		res.push({
			variant,
			sources,
			book: ref.book,
			chapter: ref.chapter,
			verse: ref.verse,
			word,
			lang,
			strong: strongs[i]?.replace(/\{|\}/g, '')?.trim()?.substring(1),
			text,
			grammar: grammars[i]?.trim(),
			transliteration: transliterations[i]?.trim(),
			translation: translations[i]?.trim(),
		});
	}
	return res;
}

class Ref {
	constructor(str) {
		const bcv = str.match(/^([^.]*)\.([^.]*)\.([^.]*)/);
		this.book = bookFromEnglish(bcv[1]);
		this.chapter = parseInt(bcv[2]);
		this.verse = parseInt(bcv[3]);
		this.sources = str.match(/=(.*)$/)[1];
	}

	eql(other) {
		return other.book == this.book && other.chapter == this.chapter && other.verse == this.verse;
	}
}

function bookFromEnglish(eng) {
	eng = eng.toLowerCase();
	if (eng.startsWith("gen")) return "gen";
	if (eng.startsWith("exo")) return "exo";
	if (eng.startsWith("lev")) return "lev";
	if (eng.startsWith("num")) return "num";
	if (eng.startsWith("deu")) return "deu";
	if (eng.startsWith("jos")) return "jos";
	if (eng.startsWith("judg") || eng == "jdg") return "jdg";
	if (eng.startsWith("rut")) return "rut";
	if (eng.startsWith("1sa") || eng == "samuel1" || eng == "samueli") return "1sa";
	if (eng.startsWith("2sa") || eng == "samuel2" || eng == "samuelii") return "2sa";
	if (eng.startsWith("1ki") || eng == "kings1" || eng == "kingsi" || eng.startsWith("1kg")) return "1ki";
	if (eng.startsWith("2ki") || eng == "kings2" || eng == "kingsii" || eng.startsWith("2kg")) return "2ki";
	if (eng.startsWith("1ch") || eng == "chronicles1" || eng == "chroniclesi") return "1ch";
	if (eng.startsWith("2ch") || eng == "chronicles2" || eng == "chroniclesii") return "2ch";
	if (eng.startsWith("ezr")) return "ezr";
	if (eng.startsWith("neh")) return "neh";
	if (eng.startsWith("est")) return "est";
	if (eng.startsWith("job")) return "job";
	if (eng.startsWith("ps")) return "psa";
	if (eng.startsWith("pr")) return "pro";
	if (eng.startsWith("ecc") || eng.startsWith("qoh")) return "ecc";
	if (eng.startsWith("song") || eng == "sng" || eng.startsWith("cant")) return "sng";
	if (eng.startsWith("isa")) return "isa";
	if (eng.startsWith("jer")) return "jer";
	if (eng.startsWith("lam")) return "lam";
	if (eng.startsWith("eze") || eng == "ezk") return "ezk";
	if (eng.startsWith("dan")) return "dan";
	if (eng.startsWith("hos")) return "hos";
	if (eng.startsWith("joe") || eng == "jol") return "jol";
	if (eng.startsWith("am")) return "amo";
	if (eng.startsWith("oba")) return "oba";
	if (eng.startsWith("jon")) return "jon";
	if (eng.startsWith("mic")) return "mic";
	if (eng.startsWith("na")) return "nam";
	if (eng.startsWith("hab")) return "hab";
	if (eng.startsWith("zep")) return "zep";
	if (eng.startsWith("hag")) return "hag";
	if (eng.startsWith("zec")) return "zec";
	if (eng.startsWith("mal")) return "mal";
	if (eng.startsWith("mat")) return "mat";
	if (eng.startsWith("mar") || eng == "mrk") return "mrk";
	if (eng.startsWith("luk")) return "luk";
	if (eng.startsWith("joh") || eng == "jhn") return "jhn";
	if (eng.startsWith("act")) return "act";
	if (eng.startsWith("rom")) return "rom";
	if (eng.startsWith("1co") || eng == "corinthians1" || eng == "corinthiansi") return "1co";
	if (eng.startsWith("2co") || eng == "corinthians2" || eng == "corinthiansii") return "2co";
	if (eng.startsWith("gal")) return "gal";
	if (eng.startsWith("eph")) return "eph";
	if (eng.startsWith("philip") || eng == "php") return "php";
	if (eng.startsWith("col")) return "col";
	if (eng.startsWith("1th") || eng == "thessalonians1" || eng == "thessaloniansi") return "1th";
	if (eng.startsWith("2th") || eng == "thessalonians2" || eng == "thessaloniansii") return "2th";
	if (eng.startsWith("1ti") || eng == "timothy1" || eng == "timothyi") return "1ti";
	if (eng.startsWith("2ti") || eng == "timothy2" || eng == "timothyii") return "2ti";
	if (eng.startsWith("tit")) return "tit";
	if (eng.startsWith("phile") || eng == "phm" || eng == "phlm") return "phm";
	if (eng.startsWith("heb")) return "heb";
	if (eng.startsWith("ja") || eng == "jas") return "jas";
	if (eng.startsWith("1pe") || eng == "peter1" || eng == "peteri") return "1pe";
	if (eng.startsWith("2pe") || eng == "peter2" || eng == "peterii") return "2pe";
	if (eng.startsWith("1jo") || eng == "1jn" || eng == "john1" || eng == "johni") return "1jn";
	if (eng.startsWith("2jo") || eng == "2jn" || eng == "john2" || eng == "johnii") return "2jn";
	if (eng.startsWith("3jo") || eng == "3jn" || eng == "john3" || eng == "johniii") return "3jn";
	if (eng.startsWith("jud")) return "jud"; // must come after judges
	if (eng.startsWith("rev")) return "rev";
	throw Error(`Unknown book ${eng}`);
}

/**
 * Enrich `m` with data from `morphemes`.
 *
 * @param {ReturnType<parseTahotFields>[0]} m
 * @param {ReturnType<parseTahotFields>} morphemes
 */
function align(m, morphemes, fields) {
	// We often see punctuation differences
	if (punctuation[m.text]) {
		if (fields.strong) m.strong = punctuation[m.text];
		return;
	}
	const similarities = morphemes.map(m2 => punctuation[m2.text] ? 0 : Math.max(
		similarity(m.text, m2.text),
		similarity(consonants(m.text), consonants(m2.text)),
	));
	const mostSimilar = similarities.reduce((acc, cur, i) => {
		if (cur > acc.score) {
			acc.score = cur;
			acc.i = i;
		}
		return acc;
	}, { i: -1, score: 0 });
	if (mostSimilar.score >= .7) {
		if (mostSimilar.score != 1.0) {
			console.log(m.book, m.chapter, m.verse, m.word, m.text, 'matches', morphemes[mostSimilar.i].text, mostSimilar.score.toFixed(2));
		}
		Object.entries(fields)
			.filter(([_, v]) => v)
			.forEach(([k]) => m[k] = morphemes[mostSimilar.i][k]);
	} else {
		if (m.variant == 'spelling') {
			console.error(morphemes.map(m2 => ({
				...m2,
				distance1: similarity(m.text, m2.text),
				distance2: similarity(consonants(m.text), consonants(m2.text)),
			})));
			throw Error(`Could not align ${JSON.stringify(m)}`);
		}
	}
}

function consonants(hebrew) {
	return hebrew.replace(/[^\u05d0-\u05ea]*/g, ''); // Vowels rarely change meaning.
}

function* words(morphemes) {
	let word_i = 0;
	let word = morphemes[word_i].word;
	for (let i = 0; i < morphemes.length + 1; i++) {
		if (morphemes[i]?.word == word) continue;

		yield morphemes.slice(word_i, i);

		word = morphemes[i]?.word;
		word_i = i;
	}
}

await Promise.all(process.argv.slice(2).map(parseFile));
