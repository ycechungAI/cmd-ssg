# cmd-ssg Roadmap

This roadmap comes from a code audit done on 2026-10-02 against `main` at `0d52c35`. At that commit `package.json` says `1.0.3` and the CLI reports `1.0.2`. All 24 tests pass. The XSS and symlink hardening is solid, but the CLI flow has crash bugs, destructive defaults and path bugs. There is also dependency and tooling debt.

| Release | Theme                                                                       | Type  | Spec                   |
| ------- | --------------------------------------------------------------------------- | ----- | ---------------------- |
| v1.0.4  | Stabilization: no crashes, correct paths, dependency cleanup                | patch | [v1.0.4.md](v1.0.4.md) |
| v1.1.0  | Correct rendering and safer output: Markdown, txt, stylesheet, `--clean`    | minor | [v1.1.0.md](v1.1.0.md) |
| v2.0.0  | Architecture and config: core library, schema config, front matter, layouts | major | [v2.0.0.md](v2.0.0.md) |
| v2.x+   | Unscheduled backlog: dev server, incremental builds, sitemap/RSS, plugins   | —     | [future.md](future.md) |

## Bug index

Each spec refers to bugs by ID.

| ID  | Location (at `0d52c35`)                          | Summary                                                                                                                              | Fixed in |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| B1  | `bin/index.js:45`                                | `ssg -v` prints the `program.version` **function source**. Hard-coded `1.0.2` doesn't match package.json `1.0.3`.                    | v1.0.4   |
| B2  | `bin/index.js:85,94`, `bin/helper.js:332`        | No `-i`: `checkInput(undefined)` returns `true`, then `isFileCheck(undefined)` throws a TypeError.                                   | v1.0.4   |
| B3  | `bin/index.js:85,91`                             | `testInput`/`testOutput` are implicit globals.                                                                                       | v1.0.4   |
| B4  | `bin/index.js:97`, `bin/helper.js:23`            | `convertToHtml` is not awaited and `displayError` throws, giving unhandled rejections.                                               | v1.0.4   |
| B5  | `bin/helper.js:153-166`, `bin/outputCheck.js:7`  | `"./dist"` and `"dist"` compared as strings. The config default `dist` breaks output creation.                                       | v1.0.4   |
| B6  | `bin/outputCheck.js:12`                          | Missing custom output dir: logs, returns `undefined`, then shows the misleading "No supported file or folder!".                      | v1.0.4   |
| B7  | `bin/helper.js:153-155`                          | `./dist` in the CWD is recursively deleted with no confirmation.                                                                     | v1.1.0   |
| B8  | `bin/helper.js:197,222`                          | Only the first path segment is stripped from the input root. Nested and absolute inputs produce wrong output paths.                  | v1.0.4   |
| B9  | `bin/helper.js:48`                               | `split(".")[0]` truncates dotted names, and `a.txt` and `a.md` collide.                                                              | v1.0.4   |
| B10 | `bin/helper.js:103`                              | Source `index.txt`/`index.md` is overwritten by the generated menu.                                                                  | v1.0.4   |
| B11 | `bin/helper.js:9`                                | `.css` files become empty HTML pages in folder mode.                                                                                 | v1.0.4   |
| B12 | `generateHtmlTemplate.js:101,120`                | `<link rel="stylesheet" href="">` is emitted when no stylesheet is given.                                                            | v1.0.4   |
| B13 | `bin/helper.js`                                  | Stylesheet href is written verbatim and never copied, so it breaks for nested pages.                                                 | v1.1.0   |
| B14 | `bin/helper.js:209,231`                          | Hrefs are not URL-encoded (`#`, `?`, `%` in names).                                                                                  | v1.1.0   |
| B15 | `bin/helper.js:249`, `lib/parser/markdown.js:16` | Markdown is rendered line by line and wrapped in `<p>`, and the title is always "Document".                                          | v1.1.0   |
| B16 | `bin/helper.js:253-275`                          | The txt parser's `"_space_"` sentinel corrupts text, and empty `<p>` tags are emitted.                                               | v1.1.0   |
| B17 | `bin/index.js:72-81`, `config.json`              | Config: silent exit on missing input, raw stack on bad JSON, config overrides CLI flags, and the sample points to a nonexistent dir. | v1.0.4   |
| B18 | `bin/index.js:51`                                | `clear()` wipes the user's terminal on every run.                                                                                    | v1.0.4   |
| B19 | `bin/index.js:30-31,47`                          | Custom `-v`/`-h` shadow commander built-ins. Typo "cmd-svg", and `-c` is undocumented.                                               | v1.0.4   |

## Spec format

Every release spec has these sections: **Goal · Scope · Changes · Behavior & acceptance criteria · Tests · Out of scope · Migration notes**.

## Conventions

- Tags follow `vX.Y.Z` from v1.0.4 onward. The existing `v1.03` and `0.1.2` tags stay as they are.
- `package.json` is the single source of truth for the version.
- Every security fix gets one entry in `.jules/sentinel.md`, with no duplicates.
