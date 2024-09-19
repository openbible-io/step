import { parseFields, Ref } from './common.js';

// Example row
// Word & Type: Act.1.8#12=N(K)O
// Greek: μου (mou)
// English translation: My
// dStrongs = Grammar: G3165=P-1GS
// Dictionary form =  Gloss: ἐγώ=I/we
// editions: NA28+NA27+Tyn+SBL+WH+Treg
// Meaning variants: μοι (T=moi) to Me - G3427=P-1DS in: TR+Byz
// Spelling variants: WH: Ῥομφά ; +Tyn: ̔Ρεφάν ; +Treg: Ῥεφάν ; +Byz+TR: Ῥεμφάν ;
// Spanish translation: de mí
// Sub-meaning: my
// Conjoin word: #12«11:G1510
// sStrong+Instance: G3165
// Alt Strongs: G3427, , G3450
// ???: v μοι  (<i>moi</i>) 'to Me' occurs in traditional manuscripts (TR+Byz) instead of μου  (<i>mou</i>) 'My' in older manuscripts (NA28+NA27+Tyn+SBL+WH+Treg)

/**
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
				strong_and_grammar,
				dict_form_and_gloss,
				editions,
				meaning_variant,
				spelling_variant,
				translation_spanish,
				submeaning,
				conjoin,
				sstrong,
				alt_strong,
				note,
			] = fields;

			if (spelling_variant) console.log(spelling_variant);

			// const morphemes = parseFields(
			// 	ref.sources,
			// 	ref,
			// 	word,
			// 	greek_and_transliteration,
			// 	strong,
			// 	grammar,
			// 	translation,
			// 	translation,
			// );

			// meaning_variant.split('¦').filter(Boolean).forEach(variant => {
			// 	// K= 'o.ho.Lo/h (אָהֳלֹ/ה\׃) "tent/ his" (H0168G/H9023\H9016=HNcbsc/Sp3ms)
			// 	const match = variant.match(/([^ ]*)= ([^ ]*) \(([^\)]*)\) "(.*)" \(([^=]*)=([^\)]*)\)/);
			// 	if (match?.length != 7) throw Error(variant);

			// 	morphemes.push(...parseFields(
			// 		match[1],
			// 		ref,
			// 		word,
			// 		match[3],
			// 		match[5],
			// 		match[6],
			// 		match[2],
			// 		match[4],
			// 		'meaning',
			// 	));
			// });
			// spelling_variant.split(';').filter(Boolean).forEach(variant => {
			// 	// L= אָהֳלֹֽ/ה\׃ ¦ ;
			// 	if (variant.trim() == ';') return; // idk why these are here

			// 	const match = variant.match(/([^ ]*)= ([^ ]*)/);
			// 	if (match?.length != 3) throw Error(variant);

			// 	// We want to align these. Goal is minimal manual alignment.
			// 	const unaligned = parseFields(
			// 		match[1],
			// 		ref,
			// 		word,
			// 		match[2],
			// 		'',
			// 		'',
			// 		'',
			// 		'',
			// 		'spelling',
			// 	);
			// 	unaligned.forEach(u => align(u, morphemes, {
			// 		lang: true,
			// 		strong: true,
			// 		grammar: true,
			// 		transliteration: true,
			// 		translation: true,
			// 	}));
			// 	morphemes.push(...unaligned);
			// });

			// morphemes.forEach(m => out.write(m));
			// word = morphemes[morphemes.length - 1].word;
		} catch (e) {
			console.error(line);
			throw e;
		}
	}
}

