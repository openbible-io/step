import { books } from '@openbible/core';
import { similarity } from './jaro-winkler.js';

export class Ref {
	constructor(str) {
		// TAHOT: Gen.1.8(Gen.3.4)#12=L(K)
		// TAGNT: Act.1.8#12=N(K)O
		const bcv = str.match(/^([^.]*)\.([^.]*)\.([^.]*)/);
		this.book = books.fromEnglish(bcv[1]);
		this.chapter = parseInt(bcv[2]);
		this.verse = parseInt(bcv[3]);
		this.sources = str.match(/=(.*)$/)[1];
	}

	eql(other) {
		return other.book == this.book && other.chapter == this.chapter && other.verse == this.verse;
	}
}

export const punctuation = {
	'־': '9014',
	'׀': '9015',
	'׃': '9016',
};

/**
 * Enrich `m` with data from `morphemes`.
 *
 * @param {ReturnType<parseFields>[0]} m
 * @param {ReturnType<parseFields>} morphemes
 * @param {string[]} fields
 */
export function align(m, morphemes, fields) {
	// We often see punctuation differences
	if (punctuation[m.text]) {
		if (fields.includes('strong')) m.strong = punctuation[m.text];
		if (fields.includes('lang')) m.lang = morphemes[0].lang;
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
		fields.forEach(f => m[f] = morphemes[mostSimilar.i][f]);
	} else {
		if (m.variant == 'spelling') {
			// If we don't enrich these we are missing too much.
			console.error(morphemes.map(m2 => ({
				...m2,
				distance1: similarity(m.text, m2.text),
				distance2: similarity(consonants(m.text), consonants(m2.text)),
			})));
			throw Error(`Could not align ${JSON.stringify(m)}`);
		}
	}
}

/** @param {string} v */
export function splitVariants(v) {
	return v.split(/¦|;/).map(v => v.trim()).filter(Boolean);
}

export function fmtMorpheme(m) {
	let res = `${m.book}.${m.chapter}.${m.verse}`;
	res += `#${m.word.toString().padStart(2, '0')} ${m.text}`;
	if (m.variant) res += ` (${m.variant})`;
	return res;
}

/** @param {string} str english, hebrew, or greek */
export function consonants(str) {
	return str
		.replace(/[aeiou]*/gi, '')
		.replace(/[αεηιουωᾱηῑωῡηω]*/gi, '')
		.replace(/[^\u05d0-\u05ea]*/g, '')
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
