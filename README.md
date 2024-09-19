# step
[![GitHub license](https://img.shields.io/github/license/openbible-io/en_bsb?style=for-the-badge)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/@openbible/en_bsb.svg?style=for-the-badge)](https://www.npmjs.com/package/@openbible/en_bsb)

Normalization for [STEPBible-Data](https://github.com/STEPBible/STEPBible-Data).

## Schemas
### heb_tht

## Running
Copy data from other branch.
```sh
mkdir tmp && git --work-tree=./tmp checkout upstream -- .
```

## Continuous Integration
The `upstream` branch is a fork pulled daily. If there's a difference will push to master, but
won't build or release until reviewed.

