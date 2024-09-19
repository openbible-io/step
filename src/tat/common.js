import { consonants, bookFromEnglish } from '../common.js';
import { similarity } from './jaro-winkler.js';

export class Ref {
	constructor(str) {
		// TAHOT: Gen.1.8(Gen.3.4)#12=L(K)
		// TAGNT: Act.1.8#12=N(K)O
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

/**
 * @param {sources} string
 * @param {ref} Ref
 * @param {word} string
 * @param {text} string
 * @param {strong} string | undefined
 * @param {grammar} string | undefined
 * @param {transliteration} string | undefined
 * @param {translation} string | undefined
 * @param {variant} string | undefined
 */
export function parseFields(
	sources,
	ref,
	word,
	text,
	strong,
	grammar,
	transliteration,
	translation,
	variant,
) {
	const splitRe = /\/|\\/;
	const hebrews = text.split(splitRe);
	const strongs = strong.split(splitRe);
	const grammars = grammar.split(splitRe);
	const transliterations = transliteration.split(splitRe);
	const translations = translation.split(splitRe);

	assert(hebrews.length, ref);

	let lang;
	if (grammars[0].startsWith('H')) lang = 'heb';
	else if (grammars[0].startsWith('A')) lang = 'arc';
	else if (grammars[0].startsWith('G')) lang = 'grk';
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

/**
 * Enrich `m` with data from `morphemes`.
 *
 * @param {ReturnType<parseFields>[0]} m
 * @param {ReturnType<parseFields>} morphemes
 */
export function align(m, morphemes, fields) {
	const punctuation = {
		'־': '9014',
		'׀': '9015',
		'׃': '9016',
	};

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

/**
 * @param {ReturnType<parseFields>} morphemes
 */
//function* words(morphemes) {
//	let word_i = 0;
//	let word = morphemes[word_i].word;
//	for (let i = 0; i < morphemes.length + 1; i++) {
//		if (morphemes[i]?.word == word) continue;
//
//		yield morphemes.slice(word_i, i);
//
//		word = morphemes[i]?.word;
//		word_i = i;
//	}
//}
