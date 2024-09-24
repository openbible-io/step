/** @param {string} str english, hebrew, or greek */
export function consonants(str) {
	return str
		.replace(/[aeiou]*/gi, '')
		.replace(/[αεηιουωᾱηῑωῡηω]*/gi, '')
		.replace(/[^\u05d0-\u05ea]*/g, '')
}

/** @param {string} eng english book name */
export function bookFromEnglish(eng) {
	eng = eng.toLowerCase();
	if (eng.startsWith("gen")) return "gen";
	if (eng.startsWith("exo")) return "exo";
	if (eng.startsWith("lev")) return "lev";
	if (eng.startsWith("num")) return "num";
	if (eng.startsWith("deu")) return "deu";
	if (eng.startsWith("jos")) return "jos";
	if (eng.startsWith("judg") || eng == "jdg") return "jdg";
	if (eng.startsWith("rut")) return "rut";
	if (eng.startsWith("1sa") || eng == "samuel1" || eng == "samueli") return "1sa";
	if (eng.startsWith("2sa") || eng == "samuel2" || eng == "samuelii") return "2sa";
	if (eng.startsWith("1ki") || eng == "kings1" || eng == "kingsi" || eng.startsWith("1kg")) return "1ki";
	if (eng.startsWith("2ki") || eng == "kings2" || eng == "kingsii" || eng.startsWith("2kg")) return "2ki";
	if (eng.startsWith("1ch") || eng == "chronicles1" || eng == "chroniclesi") return "1ch";
	if (eng.startsWith("2ch") || eng == "chronicles2" || eng == "chroniclesii") return "2ch";
	if (eng.startsWith("ezr")) return "ezr";
	if (eng.startsWith("neh")) return "neh";
	if (eng.startsWith("est")) return "est";
	if (eng.startsWith("job")) return "job";
	if (eng.startsWith("ps")) return "psa";
	if (eng.startsWith("pr")) return "pro";
	if (eng.startsWith("ecc") || eng.startsWith("qoh")) return "ecc";
	if (eng.startsWith("song") || eng == "sng" || eng.startsWith("cant")) return "sng";
	if (eng.startsWith("isa")) return "isa";
	if (eng.startsWith("jer")) return "jer";
	if (eng.startsWith("lam")) return "lam";
	if (eng.startsWith("eze") || eng == "ezk") return "ezk";
	if (eng.startsWith("dan")) return "dan";
	if (eng.startsWith("hos")) return "hos";
	if (eng.startsWith("joe") || eng == "jol") return "jol";
	if (eng.startsWith("am")) return "amo";
	if (eng.startsWith("oba")) return "oba";
	if (eng.startsWith("jon")) return "jon";
	if (eng.startsWith("mic")) return "mic";
	if (eng.startsWith("na")) return "nam";
	if (eng.startsWith("hab")) return "hab";
	if (eng.startsWith("zep")) return "zep";
	if (eng.startsWith("hag")) return "hag";
	if (eng.startsWith("zec")) return "zec";
	if (eng.startsWith("mal")) return "mal";
	if (eng.startsWith("mat")) return "mat";
	if (eng.startsWith("mar") || eng == "mrk") return "mrk";
	if (eng.startsWith("luk")) return "luk";
	if (eng.startsWith("joh") || eng == "jhn") return "jhn";
	if (eng.startsWith("act")) return "act";
	if (eng.startsWith("rom")) return "rom";
	if (eng.startsWith("1co") || eng == "corinthians1" || eng == "corinthiansi") return "1co";
	if (eng.startsWith("2co") || eng == "corinthians2" || eng == "corinthiansii") return "2co";
	if (eng.startsWith("gal")) return "gal";
	if (eng.startsWith("eph")) return "eph";
	if (eng.startsWith("philip") || eng == "php") return "php";
	if (eng.startsWith("col")) return "col";
	if (eng.startsWith("1th") || eng == "thessalonians1" || eng == "thessaloniansi") return "1th";
	if (eng.startsWith("2th") || eng == "thessalonians2" || eng == "thessaloniansii") return "2th";
	if (eng.startsWith("1ti") || eng == "timothy1" || eng == "timothyi") return "1ti";
	if (eng.startsWith("2ti") || eng == "timothy2" || eng == "timothyii") return "2ti";
	if (eng.startsWith("tit")) return "tit";
	if (eng.startsWith("phile") || eng == "phm" || eng == "phlm") return "phm";
	if (eng.startsWith("heb")) return "heb";
	if (eng.startsWith("ja") || eng == "jas") return "jas";
	if (eng.startsWith("1pe") || eng == "peter1" || eng == "peteri") return "1pe";
	if (eng.startsWith("2pe") || eng == "peter2" || eng == "peterii") return "2pe";
	if (eng.startsWith("1jo") || eng == "1jn" || eng == "john1" || eng == "johni") return "1jn";
	if (eng.startsWith("2jo") || eng == "2jn" || eng == "john2" || eng == "johnii") return "2jn";
	if (eng.startsWith("3jo") || eng == "3jn" || eng == "john3" || eng == "johniii") return "3jn";
	if (eng.startsWith("jud")) return "jud"; // must come after judges
	if (eng.startsWith("rev")) return "rev";
	throw Error(`Unknown book ${eng}`);
}
