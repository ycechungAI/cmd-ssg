## 2026-01-31 - [Stored XSS in Static Site Generator]
**Vulnerability:** The static site generator injected file content from `.txt` files, titles, and filenames directly into HTML templates without escaping.
**Learning:** Even if a library (like `markdown-it`) handles some escaping, the surrounding template code must also sanitize all user inputs (titles, filenames, custom text processing).
**Prevention:** Always escape user-controlled data before inserting it into HTML templates. Use a context-aware escaping function or a template engine that handles escaping automatically.
