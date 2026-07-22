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

## 2026-03-14 - [Stored XSS via Malicious URL Schemes in Generated Menu]
**Vulnerability:** The `generateHtmlMenuTemplate` function constructed a menu of links using `route.url` wrapped only in `escapeHtml`. Since `escapeHtml` merely encodes HTML entities, it permitted dangerous schemes such as `javascript:` and `data:` to be injected directly into the `<a href>` attribute, exposing users to Stored XSS if they clicked on links generated from maliciously named folders or files.
**Learning:** Entity escaping (like `escapeHtml`) is insufficient to protect `href` or `src` attributes. URL schemes must be strictly validated or sanitized to neutralize active content schemes (`javascript:`, `vbscript:`, `data:`), even in internally generated routing paths.
**Prevention:** Implement a dedicated URI sanitizer that decodes the URI and enforces safe schemes, or explicitly strips out malicious schemes prior to injecting URLs into HTML attributes.
## 2025-03-05 - Fix XSS Filter Bypass with Control Characters
**Vulnerability:** XSS filter bypass in `sanitizeUrl` due to control characters and whitespace.
**Learning:** Browsers ignore control characters (like `\x09` tab or `\x00` null byte) in URL schemes. Using `trim()` only removes leading/trailing spaces, allowing schemes like `java\x09script:alert(1)` to bypass `startsWith("javascript:")` checks but still execute in the browser.
**Prevention:** Always strip all whitespace and control characters (`/[\x00-\x20\s]/g`) from URLs *before* validating the scheme.

## 2026-03-28 - [XSS Bypass via URL Control Characters]
**Vulnerability:** The `sanitizeUrl` function in `generateHtmlTemplate.js` was bypassed using control characters (like `\x00` or `\x09`) in URL schemes (e.g. `java\x09script:`). The previous implementation only used `trim()` which missed internal whitespace and invisible control characters.
**Learning:** Browsers are highly tolerant of whitespaces and control characters within URIs, evaluating them even if broken up by characters like tab, newline, or null bytes. Simple string matching algorithms (like `.startsWith()`) will miss these obfuscated attack vectors.
**Prevention:** Always strip whitespaces and control characters (`/[\x00-\x20\s]/g`) completely from decoded URIs before performing security checks on the scheme.
## 2026-04-04 - [XSS Bypass in URL Sanitization]
**Vulnerability:** The `sanitizeUrl` function in `generateHtmlTemplate.js` was vulnerable to XSS bypass via control characters. An attacker could inject payloads like `\x01javascript:alert(1)` which bypassed the `trim().toLowerCase()` checks and executed JavaScript when clicked.
**Learning:** Browsers strip leading/trailing C0 control characters (`\x00` to `\x1F`) before parsing URL schemes. A naive string check like `startsWith("javascript:")` is insufficient.
**Prevention:** Aggressively strip all C0 control characters and whitespace (using `/[\x00-\x20\s]/g`) before validating URL schemes to prevent bypasses, and add tests for edge case payloads.
## 2026-04-05 - [Stored XSS Bypass via Control Characters in URL Schemes]
**Vulnerability:** The `sanitizeUrl` function protected against malicious URL schemes (`javascript:`, `data:`, `vbscript:`) using `.startsWith()`. However, attackers could bypass this check by injecting invisible control characters or whitespaces into the scheme (e.g., `java\x09script:alert(1)`, `j\x00avascript:alert(1)`), which the browser would still execute as valid scripts.
**Learning:** Checking for `.startsWith("javascript:")` is insufficient because URL scheme parsing in browsers ignores control characters and spaces.
**Prevention:** Always normalize the URL scheme by stripping ASCII control characters (`\x00-\x20`) and whitespace before validating against known malicious protocols.
## 2024-05-24 - URL Sanitization Control Character Bypass
**Vulnerability:** XSS bypass possible in `sanitizeUrl` using control characters and whitespace (e.g., `java\nscript:alert(1)`).
**Learning:** URL protocol validation using basic string prefix matching (`startsWith()`) is insufficient. Browsers automatically strip whitespaces and control characters from schemes before execution.
**Prevention:** Always strip all whitespace and control characters using regex (e.g., `.replace(/[\x00-\x20\s]/g, '')`) from the validation target before checking for dangerous schemes.
## 2026-04-18 - [Stored XSS Bypass via Control Characters in URL Schemes]
**Vulnerability:** The URL sanitizer (`sanitizeUrl`) in `generateHtmlTemplate.js` checked for malicious schemes like `javascript:` by looking at the start of the decoded URL. However, attackers could bypass this by inserting control characters or whitespace within the protocol (e.g., `java\x00script:` or `java\tscript:`), which browsers ignore but caused the `startsWith` check to fail, leading to Stored XSS.
**Learning:** Checking for malicious URL schemes with simple string matching (like `startsWith`) is insufficient because browsers are highly forgiving and will execute URIs that contain hidden control characters or spaces within the protocol string.
**Prevention:** Always strip out all whitespace and control characters (e.g., using `replace(/[\x00-\x20\s]/g, "")`) from the URL *before* checking against a blocklist of malicious schemes like `javascript:`.

## 2024-05-24 - [Bypass XSS URL Sanitization]
**Vulnerability:** XSS bypass via URL scheme obfuscation (e.g., `\x19javascript:`, `java\nscript:`).
**Learning:** Checking for malicious protocol schemes like `javascript:` using `.trim().startsWith("javascript:")` is flawed. Browsers ignore whitespace and control characters anywhere in the protocol. `.trim()` only strips leading/trailing standard whitespace, allowing attackers to embed control characters or newlines to bypass the validation.
**Prevention:** Strip all control characters and whitespace characters (`[\x00-\x20\s]`) from the decoded URL string *before* performing the scheme check (e.g., `.startsWith()`). Only perform this destructive stripping on a validation variable, returning the original intact URL if it is determined to be safe.
