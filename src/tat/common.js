import assert from 'node:assert';
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
