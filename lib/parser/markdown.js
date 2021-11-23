/* eslint-disable no-undef */
/**
 * This object contains the regular expressions to capture
 * Markdown elements. It also has a template to render the
 * matched elements to HTML based on the regular expressions.
 */
var MarkdownIt = require("markdown-it");
let md = new MarkdownIt();

/**
 * Parse the Markdown block elements (e.g. heading, paragraph).
 * 
 // @param {String} text Markdown text
  **/
const parseBlock = (text) => {
  return `<p>${md.render(text)}</p>`;
};

/**
 * Parse the Markdown inline elements (e.g. bold, italic).
 * 
 // @param {String} text Markdown text
 */
const parseInline = (text) => {
  return text;
};

const convertToHtml = (text) => {
  return parseBlock(parseInline(text));
};

module.exports = {
  convertToHtml,
};
