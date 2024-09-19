import assert from 'node:assert';
import {  Ref } from './common.js';

// Example row
// Word & Type: Rev.9.16#08=N(k)O
// Greek: δισμυριάδες (dismuriades)
// English translation: twice ten thousand
// dStrongs = Grammar: G1364=ADV + G3461=N-NPF
// Dictionary form = Gloss: δίς=twice + μυριάς=myriad
// editions: NA28+NA27+Tyn+SBL+WH
// Meaning variants: δύο μυριάδες (t=duo muriades) twenty thousand - G1417=A-NUI + G3461=N-NPF in: Treg+TR
// Spelling variants: WH: δὶς μυριάδες ;
// Spanish translation: diez miles
// Sub-meaning: twice + myriads
// Conjoin word: #08
// sStrong+Instance: G3461_A, G1364
// Alt Strongs: G1417, G6019
// Note: 

/**
 *
 * Unfortunately cannot split on morphemes like with Hebrew because grammar splits do not follow
 * the greek word. Some are also out of order like:
 * - κἀμοὶ G1473=P-1DS + G2532=CONJ instead of G2532=CONJ + G1473=P-1DS
 *
 * @param {ReadlineInterface} lineReader
 * @param {fastcsv.CsvFormatterStream<fastcsv.FormatterRow, fastcsv.FormatterRow>} out
 */
export async function parseTagnt(lineReader, out) {
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
				greek_and_transliteration,
				translation,
				strong_and_grammars,
				dict_form_and_gloss,
				sources,
				meaning_variant,
				spelling_variant,
				translation_es,
				submeaning,
				conjoin,
				sstrong,
				alt_strong,
				note,
			] = fields;

			let match = greek_and_transliteration.match(/([^\(]*) \(([^\)]*)\)/);
			assert(match.length == 3, greek_and_transliteration);
			const greek = match[1];
			const transliteration = match[2];

			const morphemes = [parseFields(ref, word, sources, greek, {
				strong_and_grammars,
				dict_form_and_gloss, 
				transliteration,
				translation,
				translation_es,
				submeaning,
				conjoin,
				sstrong,
				alt_strong,
				note,
			})];
			
			meaning_variant.split('¦').filter(Boolean).forEach(variant => {
				// δύο μυριάδες (t=duo muriades) twenty thousand - G1417=A-NUI + G3461=N-NPF in: Treg+TR
				const match = variant.match(/([^\(]*) \([^=]*=([^\)]*)\) (.*) - (.*) in: (.*)$/);
				if (match?.length != 6) throw Error(variant);

				morphemes.push(parseFields(ref, word, match[5], match[1], {
					strong_and_grammars: match[4],
					variant: 'meaning',
					transliteration: match[2],
					translation: match[3],
				}));
			});
			
			spelling_variant.split(';').map(v => v.trim()).filter(Boolean).forEach(variant => {
				// WH: δὶς μυριάδες ;
				const match = variant.match(/([^:]*): (.*)$/);
				if (match?.length != 3) throw Error(variant);

				morphemes.push({
					...morphemes[0],
					variant: 'spelling',
					text: match[2],
					sources: fmtSources(match[1]),
				});
			});

			morphemes.forEach(m => out.write(m));
		} catch (e) {
			console.error(line);
			throw e;
		}
	}
}

function parseFields(ref, word, sources, greek, fields) {
	const strongs = [];
	const grammars = [];
	// G2443=CONJ + G5101=I-NSN
	if (fields.strong_and_grammars) {
		fields.strong_and_grammars.split('+').forEach(sg => {
			const split = sg.split('=');
			assert(split.length == 2, sg);
			strongs.push(split[0].trim().substring(1));
			grammars.push(split[1].trim());
		});
		delete fields.strong_and_grammars;
	}
	const dict_forms = [];
	const glosses = [];
	if (fields.dict_form_and_gloss) {
		fields.dict_form_and_gloss.split('+').forEach(dg => {
			const split = dg.split('=');
			assert(split.length == 2, dg);
			dict_forms.push(split[0].trim());
			glosses.push(split[1].trim());
		});
		delete fields.dict_form_and_gloss;
	}
	if (fields.note?.trim() == '^' || fields.note?.trim() == 'v') fields.note = '';

	return {
		variant: fields.variant,
		sources: fmtSources(sources),
		book: ref.book,
		chapter: ref.chapter,
		verse: ref.verse,
		word,
		lang: 'grk',
		text: greek,
		strongs: strongs.join(','),
		grammars: grammars.join(','),
		dict_forms: dict_forms.join(','),
		glosses: glosses.join(','),
		...fields,
	};
}

function fmtSources(sources) {
	return sources.split('+').map(s => s.trim()).join(',');
}
