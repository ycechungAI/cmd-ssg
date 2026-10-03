## Prerequiste for development

```text
   "node": ">=18" (development tooling needs >=18.18)

   if you are developing,
   run npm install
```

## How to Use

```text
git clone <this repo>

npm install -g . or npm install if you are just testing

ssg <command option>    or    ./bin/index.js <command option> to be safe

Example Use:
ssg -i sample_txt
ssg -i <file/folder with .txt or .md files> -s <stylesheet.css>

# If you dont like typing commands use json file
ssg -c config.json
```

## Development Checks

```text
scripts to run from package.json
-----------------------------------------------------------------
1. "npm run prepare"         - install the Husky pre-commit hook (runs lint-staged)
2. "npm run prettier-check"  - prettier check
     "npm run prettier"      - tries to fix
3. "npm run pretest"         - run lint / eslint
     "npm run eslint/lint"   - same as above
     "npm run eslint-fix"    - tries to fix all errors
4. "npm run jest"            - run tests
5. "npm run test"            - lint, then tests with coverage (thresholds: 80% lines, 70% branches)

Golden files for rendering live in test/fixtures/. After an intended change to the
HTML output, regenerate the expected/*.html files and review the diff.
```
