#!/bin/bash
set -e
GIT_URL=$(git remote get-url origin)
lein clean
lein cljsbuild once min
pushd resources/public
git init
git add .
git commit -m "Deploy to GitHub Pages"
git push --force --quiet "${GIT_URL}" master:gh-pages
popd
rm -fr resources/public/.git
