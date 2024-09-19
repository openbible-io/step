const similar = [
	// Hebrew
	new Set(['׀', 'ן', 'י', 'ו']),
	new Set(['ה',  'ת', 'ח',  'ן', 'י', 'ו']),
	new Set(['ה',  'ת', 'ח',  'א']),
];
const character_sets = similar.reduce((acc, cur) => {
	cur.forEach(v => {
		acc[v] = acc[v] || [];
		acc[v].push(cur);
	});
	return acc;
}, {});

/**
 * Fork of strcmp95 made to work better for Hebrew.
 * http://web.archive.org/web/20100227020019/http://www.census.gov/geo/msb/stand/strcmp.c
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} similarity score between 0 (dissimilar) and 1 (similar)
 */
export function similarity(a, b) {
	if (!a || !b) return 0;

	a = a.trim().toUpperCase();
	b = b.trim().toUpperCase();
	if (a == b) return 1;

	const minv = Math.min(a.length, b.length);

	// Count and flag the matched pairs within a small search range.
	// Flag 1 = exact match
	// Flag 2 = similar match based on `adjustments`
	const range = Math.floor(Math.max(a.length, b.length) / 2);
	let n_common = 0;
	const a_flag = new Array(a.length);
	const b_flag = new Array(b.length);
	for (let i = 0; i < a.length; i++) {
		const low  = (i >= range) ? i - range : 0;
		const high = (i + range <= b.length) ? Math.min(i + range, b.length) : b.length;

		for (let j = low; j <= high; j++) {
			if (!a_flag[i] && !b_flag[j] && a[i] == b[j]) {
				n_common += 1;
				a_flag[i] = b_flag[j] = 1;
				break;
			}
		}
	}

	let n_transpositions = 0;
	let k = 0;
	for (let i = 0; i < a.length; i++) {
		if (a_flag[i] === 1) {
			let j;
			for (j = k; j < b.length; j++) {
				if (b_flag[j] === 1) {
					k = j + 1;
					break;
				}
			}
			if (a[i] !== b[j]) n_transpositions += 1;
		}
	}
	n_transpositions = Math.floor(n_transpositions / 2);

	// Adjust for similarities in nonmatched characters
	let n_similar = 0;
	if (minv > n_common) {
		for (let i = 0; i < a.length; i++) {
			if (a_flag[i]) continue;
			for (let j = 0; j < b.length; j++) {
				if (b_flag[j]) continue;
				
				if ((character_sets[a[i]] || []).some(set => set.has(b[j]))) {
					n_similar += 1;
					a_flag[i] = 2;
					b_flag[j] = 2;
					break;
				}
			}
		}
	}

	const weight0 = n_similar / minv + n_common;
	let weight = weight0 / a.length + weight0 / b.length;
	if (n_common) weight += (n_common - n_transpositions) / n_common;
	weight /= 3;

	// Boost first and last characters with exponential falloff.
	const n_char_boost = 2;
	for (let i = 0; i < Math.min(minv, n_char_boost); i++) {
		if (!a_flag[i] && !b_flag[i]) break;
		weight += 0.15 * (1.0 - weight);
	}
	for (let i = 0; i < Math.min(minv, n_char_boost); i++) {
		const ai = a.length - i - 1;
		const bi = b.length - i - 1;
		if (!a_flag[ai] && !b_flag[bi]) break;
		weight += 0.15 * (1.0 - weight);
	}

	return weight;
}

function consonants(hebrew) {
	return hebrew.replace(/[^\u05d0-\u05ea]*/g, ''); // Vowels rarely change meaning.
}

// console.log(similarity(consonants('וֹ֙'), consonants('ה֙')));
// console.log(similarity(consonants('ךְ'), consonants('יךְ')));
// console.log(similarity(consonants('נְטוּ֣וֹת'), consonants('נְטוּי֣וֹת')));
