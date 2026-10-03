# Sentinel: security notes

One entry per distinct issue. Earlier near-duplicate entries about control characters in URL schemes were merged into the "URL scheme" entry below.

## 2026-01-31 - [Stored XSS in Static Site Generator]

**Vulnerability:** The static site generator injected file content from `.txt` files, titles, and filenames directly into HTML templates without escaping.
**Learning:** Even if a library (like `markdown-it`) handles some escaping, the surrounding template code must also sanitize all user inputs (titles, filenames, custom text processing).
**Prevention:** Always escape user-controlled data before inserting it into HTML templates. Use a context-aware escaping function or a template engine that handles escaping automatically.

## 2026-02-01 - [Arbitrary Code Execution via Insecure Config Loading]

**Vulnerability:** The CLI tool used `require()` to load a user-provided configuration file. This allowed an attacker to execute arbitrary code by supplying a malicious `.js` file instead of a `.json` file.
**Learning:** `require()` is not safe for loading user-supplied data files, even if intended for configuration, because it executes JavaScript.
**Prevention:** Use `fs.readFileSync()` and `JSON.parse()` to strictly load and parse configuration files as data, preventing code execution.

## 2026-02-21 - [Reflected XSS in Stylesheet Injection]

**Vulnerability:** The `options.style` input was injected directly into the `href` attribute of a `<link>` tag without escaping, allowing for XSS attacks via crafted stylesheet paths.
**Learning:** Reusing existing security functions (`escapeHtml`) is critical, but it takes vigilance to make sure they are applied to _all_ injection points, not just the content body.
**Prevention:** Audit all variables interpolated into HTML templates, and wrap every value placed in an HTML attribute with an escaping function.

## 2026-03-14 - [Stored XSS via Malicious URL Schemes]

**Vulnerability:** `escapeHtml` was the only protection for `options.style` and `route.url` in `href` attributes. Entity escaping prevents breaking out of the attribute, but not active schemes such as `javascript:`, `vbscript:` or `data:`. A maliciously named file or folder could therefore cause stored XSS in the generated menu.
**Learning:** HTML entity escaping is insufficient in URL contexts (`href`, `src`).
**Prevention:** Run every URL through `sanitizeUrl` (which neutralizes dangerous schemes to `about:blank`) _and_ `escapeHtml`.

## 2026-04-18 - [URL Scheme Check Bypasses: control characters, whitespace, multiple encoding, HTML entities]

**Vulnerability:** The scheme check in `sanitizeUrl` was bypassed several times, because browsers normalize a URL before deciding its scheme:

- control characters or whitespace inside or around the scheme, e.g. `java\tscript:`, `java\x00script:`, `\x01javascript:`, `java script:`
- multiple percent-encoding, e.g. `java%2509script:`, and malformed sequences such as `%A0` that make `decodeURIComponent` throw
- HTML entities, e.g. `&#106;avascript:` or `jav&#x09;ascript:`, which the HTML parser decodes in attributes before the URL is parsed
  **Learning:** A prefix check like `startsWith("javascript:")` must run on the URL as the browser will see it, not on the raw string. `.trim()` only removes leading and trailing whitespace.
  **Prevention:** On a validation copy of the URL:

1. Decode HTML entities (decimal and hex) and percent-encoding repeatedly until the string stops changing. Fall back to `unescape` when `decodeURIComponent` throws.
2. Lowercase it, and strip all C0 control characters, whitespace and ` ` (`/[\x00-\x20\s ]/g`).
3. Only then check the scheme.

Return the original URL when it is safe. Every bypass above has a regression test in `test/security.test.js` or `test/xss.test.js`. v2.0.0 plans to switch to an allowlist of schemes; see `docs/roadmap/v2.0.0.md`.

## 2026-10-02 - [Arbitrary File Read via Symbolic Links]

**Vulnerability:** Input files and directory entries were read through symlinks, so a planted `evil.txt -> /etc/passwd` would publish arbitrary files into the generated site.
**Learning:** Any recursive walk of user-supplied folders must treat symlinks as untrusted.
**Prevention:** Use `lstat` and skip symbolic links in `getAllFiles` and `checkInput`, and reject a symlink given directly as input. Covered by `test/symlink.test.js`.

## 2026-10-02 - [Prototype Pollution via Dynamic Object Property Assignment]

**Vulnerability:** The `groupRoutes` function in `generateHtmlTemplate.js` built a nested folder structure dynamically. It used `{}` for the `folders` map and `group.folders[dir] = group.folders[dir] || ...`, allowing an attacker to traverse and potentially manipulate `Object.prototype` by supplying a file with a `dir` named `__proto__` or `constructor`.
**Learning:** Initializing maps or dictionaries with `{}` inherits properties from `Object.prototype`, which allows traversing up the prototype chain if malicious keys like `__proto__` are evaluated.
**Prevention:** Always use `Object.create(null)` or ES6 `Map` when creating objects that will hold arbitrary user-provided keys, preventing access to prototype properties.
