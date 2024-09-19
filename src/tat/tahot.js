// Example row
// Eng (Heb) Ref & Type: Gen.12.8#08=Q(K)
// Hebrew: אָהְָל֑/וֹ
// Transliteration: 'o.ho.L/o
// Translation: tent/ his
// dStrongs: {H0168G}/H9023
// Grammar: HNcmsc/Sp3ms
// Meaning Variants: K= 'o.ho.Lo/h (אָהֳלֹ/ה) "tent/ his" (H0168G/H9023=HNcbsc/Sp3ms)
// Spelling Variants: L= אָהֳלֹ֑/ה ¦ ;
// Root dStrong+Instance: H0168G
// Alternative Strongs+Instance:
// Conjoin word:
// Expanded Strong tags: {H0168G=אֹ֫הֶל=: tent»tent:1_tent}/H9023=Ps3m=his

/**
 *
 * @param {ReadlineInterface} lineReader
 * @param {fastcsv.CsvFormatterStream<fastcsv.FormatterRow, fastcsv.FormatterRow>} out
 */
export async function parseTahot(lineReader, out) {
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

			const morphemes = parseFields(
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

				morphemes.push(...parseFields(
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
				const unaligned = parseFields(
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
	const texts = text.split(splitRe);
	const strongs = strong.split(splitRe);
	const grammars = grammar.split(splitRe);
	const transliterations = transliteration.split(splitRe);
	const translations = translation.split(splitRe);

	assert(texts.length, ref);

	let lang;
	if (grammars[0].startsWith('H')) lang = 'heb';
	else if (grammars[0].startsWith('A')) lang = 'arc';
	else if (grammars[0]) throw Error(`unknown grammar prefix ${grammars}`);
	grammars[0] = grammars[0].substring(1);

	const res = [];
	for (let i = 0; i < texts.length; i++) {
		const text = texts[i].trim();
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
