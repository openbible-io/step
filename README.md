# step
[![GitHub license](https://img.shields.io/github/license/openbible-io/en_bsb?style=for-the-badge)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/@openbible/en_bsb.svg?style=for-the-badge)](https://www.npmjs.com/package/@openbible/en_bsb)

Normalization for [STEPBible-Data](https://github.com/STEPBible/STEPBible-Data).

## Schemas
### heb_tat
Each row is a morpheme which may include punctuation.

- variant
    - meaning: has different strongs
    - spelling: has same strongs
- sources: CAPITAL means significant, lowercase means insignificant
    - L: [Leningrad codex](https://archive.org/details/leningradcodexcomplete/)
    - K: [Written Ketiv](https://en.wikipedia.org/wiki/Qere_and_Ketiv)
    - Q: [Spoken Qere](https://en.wikipedia.org/wiki/Qere_and_Ketiv)
    - X: [LXX (Septuagint)](https://www.septuagint.bible/)
    - P: Alternative punctuation in major manuscripts
    - A: [Aleppo codex](https://archive.org/details/Aleppo_Codex)
    - B: [Biblia Hebraica Stuttgartensia](https://archive.org/details/biblia-hebraica-stuttgartensia-bhs)
    - H: [Ben Chaim](https://archive.org/details/The_Second_Rabbinic_Bible_Vol_1)
    - R: Restored text based on Leningrad parallels
    - S: [Scribal traditions](https://www.google.co.uk/books/edition/On_the_Correction_of_the_Text_of_the_Heb/fmfE-R0b2UgC)
    - F: Formatting pointing or word divisions
    - V: Variant in some manuscripts
    - E: Emandation (a guess)
    - C: [Codex Cairensis](https://archive.org/details/CodexCairensis)
    - D: Dead sea manuscript
- book
- chapter
- verse
- word: separated by a space in original text. resets to 1 on new (book, chapter, verse)
- text
- lang
    - heb: Hebrew
    - arc: Aramaic
- strong: Strong's number with [sense extensions](https://tinyurl.com/STEP-Disambiguated) and a `+` to mean the tag covers the next word.
- grammar: [codes](https://tinyurl.com/HebMorph)
- transliteration_en
- translation_en

### grc_tat
Each row is a word which may include punctuation. While there are some prefix/suffix splits, they
are not consistent and hence not parsable. See [methodology](https://docs.google.com/document/d/1a24mPFzfAEkDbGvNXvmTzVk5NawntoEozYYAgzM5VmE).

- variant
    - meaning: has different strongs
    - spelling: has same strongs
- sources:
    - TR:  Scrivener's 1894 Textus Receptus with corrections:
        - 158 words not normally translated (eg articles), that are found in all or most editions including Byz
        - 77 words in NA and most or all other editions including Byz that are clearly translated in KJV
        - 7 words in Byz though (though in NA) that appear to be translated in KJV (eg "but" in Mat.26.33)  
    - Byz: Byzantine Majority text by Robinson + Pierpont 2005
    - Tyn: Tyndale Greek New Testament 2017
    - WH: Westcott + Hort 1881
    - NA27: Nestle Aland 1993
    - NA28: Nestle Aland 2012
    - Treg: Tregelles 1879 + Jongkind 2009
    - SBL: Holmes 2010, Society of Biblical Literature
    - KJV: Published English...
    - NIV: Published English...
    - 05, 03, 01, 02, 06, 04: [Nestle-Aland Uncials](http://textus-receptus.com/wiki/List_of_New_Testament_uncials)
    - P66* P46: [Nestle-Aland Papyri](http://textus-receptus.com/wiki/List_of_New_Testament_Papyri)
- book
- chapter
- verse
- word: separated by a space in original text. resets to 1 on new (book, chapter, verse)
- lang: always 'grc'
- text
- strongss: Strong's number with [sense extensions](https://tinyurl.com/STEP-Disambiguated) for morphemes separated by commas.
- grammars: Grammars separated by commas.
- dict_forms: Dictionary forms separated by commas.
- glosses: English glosses separated by commas
- transliteration_en
- translation_en
- translation_es
- submeaning: Context-sensitive alternative meaning.
- conjoin: Grammatical link to untranslated word (eg articles and particles).
- amb_strongs: Single ambiguous Strong's number
    - Repeat occurences in verse are suffixed with `_A` to `_Z` and `_a` to `_z` to flag possible
    omission by some tagging schemes.
- alt_strongs: Alternative Strong's number
    - Repeat occurences in verse are suffixed with `_A` to `_Z` and `_a` to `_z` to flag possible
    omission by some tagging schemes.
- note: Notes for variants
    - v: Variant
   - ^: Extra text

## Running
Optionally pull the latest data.
```sh
cd data && git pull
```

Parse files from `data` into `dist`
```sh
npm install
npm run build
```

## Continuous Integration
The `upstream` branch is a fork pulled daily. If there's a difference will push to master, but
won't build or release until reviewed.

