#!/usr/bin/env bash
set -e

npm ci
node build.js

# Do a release
git fetch --tags
VERSION=$(git tag --points-at HEAD)
if [[ -z $VERSION ]]; then
	VERSION=$(git tag --sort=committerdate | tail -1)
	echo "No manual tag, bumping $VERSION"
	VERSION=$(echo ${VERSION:=v0.0.0} | awk -F. -v OFS=. '{$NF += 1 ; print}')
	git tag $VERSION
	git push --tags origin master
fi
npm version --no-git-tag-version $VERSION
npm publish --provenance --access public
