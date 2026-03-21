## 2026-01-31 - [Stored XSS in Static Site Generator]
**Vulnerability:** The static site generator injected file content from `.txt` files, titles, and filenames directly into HTML templates without escaping.
**Learning:** Even if a library (like `markdown-it`) handles some escaping, the surrounding template code must also sanitize all user inputs (titles, filenames, custom text processing).
**Prevention:** Always escape user-controlled data before inserting it into HTML templates. Use a context-aware escaping function or a template engine that handles escaping automatically.

## 2026-02-21 - [Reflected XSS in Stylesheet Injection]
**Vulnerability:** The `options.style` input was injected directly into the `href` attribute of a `<link>` tag without escaping, allowing for XSS attacks via crafted stylesheet paths.
**Learning:** Reusing existing security functions (`escapeHtml`) is critical but requires vigilance to ensure they are applied to *all* injection points, not just content body.
**Prevention:** Audit all variables interpolated into HTML templates and ensure output encoding is applied.
## 2026-02-01 - [Arbitrary Code Execution via Insecure Config Loading]
**Vulnerability:** The CLI tool used `require()` to load a user-provided configuration file. This allowed an attacker to execute arbitrary code by supplying a malicious `.js` file instead of a `.json` file.
**Learning:** `require()` is not safe for loading user-supplied data files, even if intended for configuration, because it executes JavaScript.
**Prevention:** Use `fs.readFileSync()` and `JSON.parse()` to strictly load and parse configuration files as data, preventing code execution.
## 2026-02-28 - [XSS Fix]
**Vulnerability:** Unescaped style attribute in HTML template.
**Learning:** Even internal configuration/argument inputs to templates must be escaped to prevent arbitrary code execution if inputs can be controlled by users.
**Prevention:** Always wrap variables injected into HTML attributes with an HTML escaping function.
## 2026-03-21 - [Stored XSS via Malicious Protocol Schemes]
**Vulnerability:** The HTML templates in `generateHtmlTemplate.js` escaped HTML entities but did not sanitize URL schemes for `href` attributes (e.g., `options.style`, `route.url`). This allowed attackers to inject `javascript:` or `data:` URIs, leading to XSS when the links were clicked.
**Learning:** HTML entity escaping (`escapeHtml`) is insufficient for preventing XSS in URL contexts (`href`, `src`). It prevents breaking out of the attribute but not malicious schemes.
**Prevention:** Implement explicit URL sanitization to strip dangerous protocols (like `javascript:`, `vbscript:`, `data:`) before or alongside HTML escaping when injecting user-controlled URLs.
