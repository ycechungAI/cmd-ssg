/**
 * Markdown rendering with markdown-it.
 */
const MarkdownIt = require("markdown-it");

// Security: `html: false` is the XSS boundary for Markdown input. Raw HTML in
// a .md file is escaped instead of passed through. Do not enable it.
const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

// Plain text of an inline token (e.g. "Hello *world*" -> "Hello world").
const inlineText = (token) =>
  (token.children || [])
    .filter((child) => child.type === "text" || child.type === "code_inline")
    .map((child) => child.content)
    .join("");

/**
 * Render a whole Markdown document.
 *
 * @param {String} text Markdown text
 * @returns {{ html: String, title: String, startsWithTitle: Boolean }}
 *   title is the text of the first level-1 heading ("" if none), and
 *   startsWithTitle tells whether the document opens with that heading.
 */
const parseMarkdown = (text) => {
  const tokens = md.parse(text, {});
  const h1 = tokens.findIndex(
    (token) => token.type === "heading_open" && token.tag === "h1",
  );
  return {
    html: md.renderer.render(tokens, md.options, {}),
    title: h1 === -1 ? "" : inlineText(tokens[h1 + 1]).trim(),
    startsWithTitle: h1 === 0,
  };
};

const convertToHtml = (text) => parseMarkdown(text).html;

module.exports = {
  convertToHtml,
  parseMarkdown,
};
