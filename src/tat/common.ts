import { books } from '@openbible/core';
import { similarity } from './jaro-winkler.ts';

export class Ref {
	book: books.Book;
	chapter: number;
	verse: number;
	sources: string;

	constructor(str: string) {
		// TAHOT: Gen.1.8(Gen.3.4)#12=L(K)
		// TAGNT: Act.1.8#12=N(K)O
		const bcv = str.match(/^([[A-Z][a-z][a-z]*)\.(\d+)\.(\d+)/);
		try {
			this.book = books.fromEnglish(bcv?.[1] ?? '');
		} catch {
			this.book = 'gen';
		}
		this.chapter = parseInt(bcv?.[2] ?? '');
		this.verse = parseInt(bcv?.[3] ?? '');
		this.sources = str.match(/=(.*)$/)?.[1] ?? '';
	}

	eql(other: Ref) {
		return other.book == this.book && other.chapter == this.chapter && other.verse == this.verse;
	}

	valid() {
		return this.book && this.chapter > 0 && this.verse > 0;
	}
}

export type Morpheme = {
	variant?: string,
	sources: string,
	book: string,
	chapter: number,
	verse: number,
	word: number,
	lang?: string,
	strong: string,
	text: string,
	grammar: string,
	transliteration_en: string,
	translation_en: string,
};

export const punctuation = {
	'־': '9014',
	'׀': '9015',
	'׃': '9016',
};

/**
 * Enrich `m` with data from `morphemes`.
 */
export function align(m: Morpheme, morphemes: Morpheme[], fields: string[]) {
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

export function splitVariants(v: string) {
	return v.split(/¦|;/).map(v => v.trim()).filter(Boolean);
}

export function fmtMorpheme(m: Morpheme) {
	let res = `${m.book}.${m.chapter}.${m.verse}`;
	res += `#${m.word.toString().padStart(2, '0')} ${m.text}`;
	if (m.variant) res += ` (${m.variant})`;
	return res;
}

export function consonants(str: string) {
	return str
		.replace(/[aeiou]*/gi, '')
		.replace(/[αεηιουωᾱηῑωῡηω]*/gi, '')
		.replace(/[^\u05d0-\u05ea]*/g, '')
}
