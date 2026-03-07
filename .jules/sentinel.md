## 2026-01-31 - [Stored XSS in Static Site Generator]
**Vulnerability:** The static site generator injected file content from `.txt` files, titles, and filenames directly into HTML templates without escaping.
**Learning:** Even if a library (like `markdown-it`) handles some escaping, the surrounding template code must also sanitize all user inputs (titles, filenames, custom text processing).
**Prevention:** Always escape user-controlled data before inserting it into HTML templates. Use a context-aware escaping function or a template engine that handles escaping automatically.

## 2026-02-01 - [Arbitrary Code Execution via Insecure Config Loading]
**Vulnerability:** The CLI tool used `require()` to load a user-provided configuration file. This allowed an attacker to execute arbitrary code by supplying a malicious `.js` file instead of a `.json` file.
**Learning:** `require()` is not safe for loading user-supplied data files, even if intended for configuration, because it executes JavaScript.
**Prevention:** Use `fs.readFileSync()` and `JSON.parse()` to strictly load and parse configuration files as data, preventing code execution.
## 2026-02-28 - [XSS Fix]
**Vulnerability:** Unescaped style attribute in HTML template.
**Learning:** Even internal configuration/argument inputs to templates must be escaped to prevent arbitrary code execution if inputs can be controlled by users.
**Prevention:** Always wrap variables injected into HTML attributes with an HTML escaping function.
