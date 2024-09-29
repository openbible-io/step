import assert from 'node:assert';
import { Ref, align, fmtMorpheme, splitVariants, punctuation, type Morpheme } from './common.ts';
import { type LineReader, type Out } from '../main.ts';

// Example row
// Eng (Heb) Ref & Type: Gen.12.8#08=Q(K)
// Hebrew: אָהְָל֑/וֹ
// Transliteration: 'o.ho.L/o
// Translation: tent/ his
// dstrongss: {H0168G}/H9023
// Grammar: HNcmsc/Sp3ms
// Meaning Variants: K= 'o.ho.Lo/h (אָהֳלֹ/ה) "tent/ his" (H0168G/H9023=HNcbsc/Sp3ms)
// Spelling Variants: L= אָהֳלֹ֑/ה ¦ ;
// Root dstrongs+Instance: H0168G
// Alternative strongss+Instance:
// Conjoin word:
// Expanded strongs tags: {H0168G=אֹ֫הֶל=: tent»tent:1_tent}/H9023=Ps3m=his

export async function parse(lineReader: LineReader, out: Out) {
	let lastRef: Ref | undefined;
	let word = 1;
	for await (const line of lineReader) {
		if (line.startsWith('#')) continue;
		const [
			maybe_ref,
			hebrew,
			transliteration_en,
			translation_en,
			strongs,
			grammar,
			meaning_variant,
			spelling_variant,
		] = line.split('\t');
		const ref = new Ref(maybe_ref);
		if (!ref.valid()) continue;

		if (!lastRef?.eql(ref)) word = 1;
		lastRef = ref;

		try {
			const morphemes = parseFields(
				ref.sources,
				ref,
				word,
				hebrew,
				strongs ?? '',
				grammar ?? '',
				transliteration_en ?? '',
				translation_en,
			);

			const lastMorpheme = morphemes[morphemes.length - 1];
			let nextWord = word + 1;
			if (lastMorpheme) {
				nextWord = lastMorpheme.word + (lastMorpheme.text.endsWith('־') ? 0 : 1);
			}

			splitVariants(meaning_variant).forEach(variant => {
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
			splitVariants(spelling_variant).forEach(variant => {
				// L= אָהֳלֹֽ/ה\׃ ¦ ;
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
				unaligned.forEach(u => align(u, morphemes, [
					'lang',
					'strong',
					'grammar',
					'transliteration',
					'translation',
				]));

				morphemes.push(...unaligned);
			});

			morphemes.forEach(m => {
				if (!m.grammar && !punctuation[m.text]) console.warn('missing grammar', fmtMorpheme(m));
				if (!m.strong) console.warn('missing strong', fmtMorpheme(m));

				out.write(m);
			});
			word = nextWord;
		} catch (e) {
			console.error(line);
			throw e;
		}
	}
}

export function parseFields(
	sources: string,
	ref: Ref,
	word: number,
	text: string,
	strongs: string,
	grammar: string,
	transliteration_en: string,
	translation_en: string,
	variant?: string,
) {
	const morphSep = '/';
	// TAHOT does not reliably split morphemes on punctuation, so ignore their splits.
	const texts = text.replace('\\', '').split(morphSep);
	// They include strongss for punctuation. These few strongss are not context-sensitve and
	// can be later hardcoded.
	const strongss = strongs.replace(/\\[^/]*/g, '').split(morphSep);
	const grammars = grammar.split(morphSep);
	const transliterations = transliteration_en.split(morphSep);
	const translations = translation_en.split(morphSep);

	assert(texts.length, ref.toString());

	let lang: string | undefined;
	if (grammars[0].startsWith('H')) lang = 'heb';
	else if (grammars[0].startsWith('A')) lang = 'arc';
	else if (grammars[0]) throw Error(`unknown grammar prefix ${grammars}`);
	grammars[0] = grammars[0].substring(1);

	const res: Morpheme[] = [];
	for (let i = 0; i < texts.length; i++) {
		let text = texts[i].trim();
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
			strong: strongss[i]?.replace(/\{|\}/g, '')?.trim(),
			text,
			grammar: grammars[i]?.trim(),
			transliteration_en: transliterations[i]?.trim(),
			translation_en: translations[i]?.trim(),
		});
	}
	return res;
}
