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
		transliteration,
		morph,
		gloss,
		meaning
	] = line.split('\t').map(f => f.trim());

	if (!eStrong.match(/^[HG]\d{4}/)) return;

	const [dStrong, reason] = dStrongAndReason.split('=').map(s => s.trim());

	const notes = [];
	const root = [];
	let cur = root;
	let curDepth = 1;
	const defs = meaning.split(/<br>/i).map(d => d.trim());

	defs.forEach(d => {
		let match = d.match(/^((:?[\d]+|[a-z]+)*)\) (.*)/);
		const number = match ? match[1] : undefined;
		const text = match ? match[3] : d;

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
		reason,
		uStrong,
		hebrew: word,
		transliteration,
		morph,
		gloss,
		meaning: JSON.stringify(root),
		notes: JSON.stringify(notes),
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
