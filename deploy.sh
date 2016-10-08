#!/bin/bash
set -e
GIT_URL=$(git remote get-url origin)
ABOUT=resources/public/about.html

# Create abou page
git checkout -- "${ABOUT}"
markdown -o html5 README.md >> "${ABOUT}"
echo "</body>\n</html>" >> "${ABOUT}"

# Build cljs
lein clean
lein cljsbuild once min

# Push to GitHub
pushd resources/public
git init
git add .
git commit -m "Deploy to GitHub Pages"
git push --force --quiet "${GIT_URL}" master:gh-pages
popd

# Clean up
rm -fr resources/public/.git
git checkout -- "${ABOUT}"
