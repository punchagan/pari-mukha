#!/bin/bash
set -e
GIT_URL=$(git remote get-url origin)
ABOUT=about.html
PARTIAL=about-partial.html

# Create about page
git checkout -- "${ABOUT}"
markdown -o html5 README.md >> "${PARTIAL}"
sed -i '/XXX/{
    s/XXX//g
    r about-partial.html
}' about.html
rm about-partial.html

# Push to GitHub
mkdir -p resources/data/
cp -a *.html css js images resources/
cp data/faces.json resources/data/
pushd resources/
git init
git add .
git commit -m "Deploy to GitHub Pages"
git push --force --quiet "${GIT_URL}" master:gh-pages
popd

# Clean up
rm -fr resources/
git checkout -- "${ABOUT}"
