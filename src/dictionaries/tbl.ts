import { books } from '@openbible/core';

export async function parse(lineReader, out) {
	for await (const line of lineReader) {
		const parsed = parseLine(line);
		if (parsed) out.write(parsed);
	}
}

function parseLine(line) {
	let [
		eStrong,
		dStrongAndReason,
		uStrong,
		word,
		transliteration_en,
		morph,
		gloss_en,
		meaning
	] = line.split('\t').map(f => f.trim());

	if (!eStrong.match(/^[HG]\d{4}/)) return;

	const [dStrong, reason] = dStrongAndReason.split('=').map(s => s.trim());

	const notes = [];
	const root = [];
	let cur = root;
	let curDepth = 1;
	const defs = meaning.split(/<br\s*\/?>/i).map(d => d.trim());

	defs.forEach(d => {
		let match = d.match(/^_*((:?[\d]+|[a-z]+|[\(])*)[\)\.] (.*)/);
		const number = match ? match[1] : undefined;
		const text = (match ? match[3] : d)
			.replace(
				/<ref=['"]([A-Za-z]{3})\.(\d+)\.(\d+)[^'"]*['"]>[^<]*<\/ref>/g,
				(_, b, c, v) => `${books.fromEnglish(b)} ${c}:${v}`
			);

		let depth = 0;
		if (number) {
			const re = /[\d]+|[a-z]+/g;
			while ((match = re.exec(number)) != null) depth += 1;
		}

		if (depth < curDepth) {
			cur = root;
			for (let i = 0; i < depth - 1; i++) cur = cur[cur.length - 1];
		} else if (depth > curDepth) {
			const next = [];
			cur.push(next);
			cur = next;
		}

		if (text) {
			if (depth == 0) notes.push(text);
			else cur.push(text);
		}
		curDepth = depth;
	});

	uStrong = uStrong.replaceAll(',', '');
	[eStrong, dStrong, uStrong].forEach(s => {
		if (!s.match(/[HG]\d{4}[A-Za-z]?/)) {
			console.error(s, line);
			throw Error('invalid strong');
		}
	});

	return {
		eStrong,
		dStrong,
		uStrong,
		reason,
		word,
		morph,
		transliteration_en,
		gloss_en,
		meaning_en: JSON.stringify(root),
		notes_en: JSON.stringify(notes),
	}
}

function renderMeaning(depth, m) {
	let res = '';
	if (Array.isArray(m)) {
		const type = 'ol';
		res += `<${type} class="${depth % 2 ? 'odd' : 'even'}">`;
		for (let i = 0; i < m.length; i++) {
			const wrap = !Array.isArray(m[i]);
			if (wrap) res += '<li>';
			res += renderMeaning(depth + 1, m[i]);
			if (wrap) res += '</li>';
		}
		res += `</${type}>`;
	}
	else res += m;

	return res;
}

function render(row) {
	let res = '';
	res += renderMeaning(0, row.meaning);
	if (row.notes.length) {
		res += '<ul>';
		res += row.notes.map(n => `<li>${n}</li>`);
		res += '</ul>';
	}
	return res;
}

//console.log(parseLine(
//`G0032	G0032G =	G0032G	ἄγγελος	angelos	G:N-M	angel	 <b>ἄγγελος</b>, -ου, ὁ, <BR /> [in LXX chiefly for מַלְאָךְ ;] <BR /> __1. <b>a messenger</b>, <b>one sent</b>: <ref='Mat.11.10'>Mat.11:10</ref>, <ref='Jas.22.25'>Jas.22:25</ref>.<BR /> __2. As in LXX, in the special sense of <b>angel</b>, a spiritual, heavenly being, attendant upon God and employed as his messenger to men, to make known his purposes, as <ref='Luk.1.11'>Luk.1:11</ref>, or to execute them, as <ref='Mat.4.6.'>Mat.4:6.</ref> The ἄ. in <ref='Rev.1.20-2:1'>Rev.1:20-2:1</ref>, al., is variously understood as <BR />__(1) <b>a messenger or delegate, </b><BR /> __(2) <b>a bishop or ruler, </b><BR /> __(3) <b>a guardian angel, </b><BR /> __(4) the prevailing spirit of each church, i.e. the Church itself. (Cf. Swete, <i>Ap</i>)., in l.; DB, iv, 991; Thayer, see word; Cremer, 18; MM, <i>VGT</i>, see word)<BR /> (AS)`
//))
