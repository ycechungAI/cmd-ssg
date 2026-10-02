# Future backlog (v2.x+)

These items have no schedule yet. Each one gets a full spec, written to the [README](README.md#spec-format) format, once it's picked for a release. Items are roughly ordered by value against effort.

## `ssg serve`: dev server with watch and live reload

- **Why:** the main authoring friction point. It is also the likely reason `fastify` was once added; v1.0.4 removed it as unused.
- **Sketch:** `ssg serve [-p 3000]` runs `build()` into a temp or the configured output. It serves the result with Node's built-in `http` (no framework), watches the input with `fs.watch` (recursive, debounced), rebuilds, and pushes reloads over Server-Sent Events via an injected `<script>` that is only added in serve mode.
- **Security:** bind to `127.0.0.1` by default, serve only files under the output dir (resolved-path prefix check), and treat the injected script as the only exception to the "no scripts in output" rule.

## Incremental builds

- Keep a hash cache (`<out>/.cmd-ssg` grows a `files: { rel: sha256 }` map). Re-render only changed pages, plus the index when titles change.
- This pays off once `serve` exists.

## Site outputs

- `sitemap.xml` (requires a `baseUrl` config key).
- An RSS/Atom feed for pages with a front matter `date`.
- `404.html`, built from the layout.

## Markdown enhancements

- Syntax highlighting for fences, done at build time to keep output script-free (e.g. `shiki` or `highlight.js` via the markdown-it `highlight` option).
- Heading anchors (`markdown-it-anchor`) and an optional TOC.
- Each one is an opt-in config flag, and each new dependency gets reviewed against the XSS boundary (`html: false` must stay).

## Themes and default stylesheet

- Ship a small default stylesheet so unstyled output looks decent (`--theme default|none`).
- Later: theme packages (`cmd-ssg-theme-*`) that provide a layout plus assets.

## Plugin API

- Hooks: `beforeDiscover`, `transformPage(page)`, `afterRender(html, page)`, `afterBuild(result)`.
- Plugins load only from an explicit config list. Document them as fully trusted code; never auto-load them from the input tree.

## Search and i18n

- Generate a `search-index.json` (title, path, excerpt) for an optional client-side search snippet.
- Extract CLI and UI strings (e.g. "Home menu") so they can be localized.

## Release engineering

- Changesets (or `release-please`) for the changelog and version bumps.
- npm publish from CI with `--provenance`.
- GitHub Releases generated from tags. Tags strictly `vX.Y.Z`.
- Dependabot already exists. Add grouping for dev dependencies.

## Type checking

- JSDoc types + `tsc --noEmit --checkJs` in CI, or a full TypeScript migration once the v2.0.0 core module boundaries are stable. JSDoc first is preferred, since it adds no build step.
