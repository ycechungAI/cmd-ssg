## Prerequiste for development

```text
   "node": ">=16.9.1",
   "npm": ">=7.23.0"

   if you are developing,
   run npm install
```

## How to Use

```text
git clone <this repo>

npm install -g . or npm install if you are just testing

ssgy <command option>    or    ./bin/index.js <command option> to be safe

Example Use:
ssgy -i examples
ssgy -i <file/folder with .txt or .md files> -s <stylesheet.css>

# If you dont like typing commands use json file
ssgy -c config.json
```

## Development Checks

```text
scripts to run from package.json
-----------------------------------------------------------------
1. "npm run prepare"         - install Husky hooks
2. "npm run prettier-check"  - prettier check
     "npm run prettier"      - tries to fix
3. "npm run pretest"         - run lint / eslint
     "npm run eslint/lint"   - same as above
     "npm run eslint-fix"    - tries to fix all errors
```
