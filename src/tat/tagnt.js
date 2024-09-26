import assert from 'node:assert';
import {  Ref, splitVariants } from './common.js';

// Example row
// Word & Type: Rev.9.16#08=N(k)O
// Greek: δισμυριάδες (dismuriades)
// English translation: twice ten thousand
// dstrongss = Grammar: G1364=ADV + G3461=N-NPF
// Dictionary form = Gloss: δίς=twice + μυριάς=myriad
// editions: NA28+NA27+Tyn+SBL+WH
// Meaning variants: δύο μυριάδες (t=duo muriades) twenty thousand - G1417=A-NUI + G3461=N-NPF in: Treg+TR
// Spelling variants: WH: δὶς μυριάδες ;
// Spanish translation: diez miles
// Sub-meaning: twice + myriads
// Conjoin word: #08
// strongs+Instance: G3461_A, G1364
// Alt strongss: G1417, G6019
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
		const [
			_,
			greek_and_transliteration_en,
			translation_en,
			strongs_and_grammars,
			dict_form_and_gloss,
			sources,
			meaning_variant,
			spelling_variant,
			translation_es,
			submeaning,
			conjoin,
			amb_strongs,
			alt_strongs,
			note,
		] = line.split('\t').map(f => f.trim());
		let ref;
		try {
			ref = new Ref(fields[0]);
		} catch { continue; }
		if (!lastRef?.eql(ref)) word = 0;
		word++;
		lastRef = ref;

		try {
			const match = greek_and_transliteration_en.match(/([^\(]*) \(([^\)]*)\)/);
			assert(match.length == 3, greek_and_transliteration_en);
			const greek = match[1];
			const transliteration_en = match[2];

			const words = [parseFields(ref, word, sources, greek, {
				strongs_and_grammars,
				dict_form_and_gloss, 
				transliteration_en,
				translation_en,
				translation_es,
				submeaning,
				conjoin,
				amb_strongs,
				alt_strongs,
				note,
			})];
			
			splitVariants(meaning_variant).forEach(variant => {
				// δύο μυριάδες (t=duo muriades) twenty thousand - G1417=A-NUI + G3461=N-NPF in: Treg+TR
				const match = variant.match(/([^\(]*) \([^=]*=([^\)]*)\) (.*) - (.*) in: (.*)$/);
				if (match?.length != 6) throw Error(variant);

				words.push(parseFields(ref, word, match[5], match[1], {
					variant: 'meaning',
					strongs_and_grammars: match[4],
					transliteration_en: match[2],
					translation_en: match[3],
				}));
			});
			
			splitVariants(spelling_variant).forEach(variant => {
				// WH: δὶς μυριάδες ;
				const match = variant.match(/([^:]*): (.*)$/);
				if (match?.length != 3) throw Error(variant);

				words.push({
					...words[0],
					variant: 'spelling',
					text: match[2],
					sources: fmtSources(match[1]),
				});
			});

			words.forEach(w => {
				if (!w.grammars) console.warn('missing grammar', w); 
				if (!w.strongss) console.warn('missing strongss', w);

				out.write(w);
			});
		} catch (e) {
			console.error(line);
			throw e;
		}
	}
}

/**
 * @param {Ref} ref
 * @param {string} word
 * @param {string} sources
 * @param {string} greek
 * @param {any} fields
 */
function parseFields(ref, word, sources, greek, fields) {
	const strongs = [];
	const grammars = [];
	// G2443=CONJ + G5101=I-NSN
	if (fields.strongs_and_grammars) {
		fields.strongs_and_grammars.split('+').forEach(sg => {
			const split = sg.split('=');
			assert(split.length == 2, sg);
			strongs.push(split[0].trim());
			grammars.push(split[1].trim());
		});
		delete fields.strongs_and_grammars;
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

	const fmtStrongs = s => s
		.split(/\.|,/)
		.map(s => s.trim())
		.join(',');

	return {
		variant: fields.variant,
		sources: fmtSources(sources),
		book: ref.book,
		chapter: ref.chapter,
		verse: ref.verse,
		word,
		lang: 'grc',
		text: greek,
		strongss: strongs.join(','),
		grammars: grammars.join(','),
		dict_forms: dict_forms.join(','),
		glosses: glosses.join(','),
		transliteration_en: fields.transliteration_en,
		translation_en: fields.translation_en,
		translation_es: fields.translation_es,
		submeaning: fields.submeaning,
		conjoin: fields.conjoin,
		amb_strongs: fmtStrongs(fields.amb_strongs ?? ''),
		alt_strongs: fmtStrongs(fields.alt_strongs ?? ''),
		note: fields.note,
	};
}

function fmtSources(sources) {
	return sources
		.split('+')
		.filter(Boolean)
		.map(s => s.trim())
		.join(',')
}
