/**
 * This object contains the regular expressions to capture
 * Markdown elements. It also has a template to render the
 * matched elements to HTML based on the regular expressions.
 */
const markdown = {
  block: {
    heading1: {
      regex: /^#{1} (.+$)/gm,
      htmlTemplate: "<h1>$1</h1>",
    },
    heading2: {
      regex: /^#{2} (.+$)/gm,
      htmlTemplate: "<h2>$1</h2>",
    },
    heading3: {
      regex: /^#{3} (.+$)/gm,
      htmlTemplate: "<h3>$1</h3>",
    },
    heading4: {
      regex: /^#{4} (.+$)/gm,
      htmlTemplate: "<h4>$1</h4>",
    },
    heading5: {
      regex: /^#{5} (.+$)/gm,
      htmlTemplate: "<h5>$1</h5>",
    },
    heading6: {
      regex: /^#{6} (.+$)/gm,
      htmlTemplate: "<h6>$1</h6>",
    },
  },
  inline: {
    bold: {
      regex: /\*\*(.+)\*\*|__(.+)__/g,
      htmlTemplate: "<b>$1$2</b>",
    },
    italic: {
      regex: /\*(.+)\*|_(.+)_/g,
      htmlTemplate: "<i>$1$2</i>",
    },
    hr: {
      regex: /\*(.+)\*|---(.+)---/g,
      htmlTemplate: "<hr>$1$2</hr>"
    },
  },
};

/**
 * Parse the Markdown block elements (e.g. heading, paragraph).
 * 
 * @param {String} text Markdown text
 */
const parseBlock = (text) => {
  const { block } = markdown;
  const matchedElement = Object.keys(block).find(element => block[element].regex.test(text));

  if (matchedElement) {
    return text.replace(
      block[matchedElement].regex,
      block[matchedElement].htmlTemplate
    );
  }

  return `<p>${text}</p>`;
};

/**
 * Parse the Markdown inline elements (e.g. bold, italic).
 * 
 * @param {String} text Markdown text
 */
const parseInline = (text) => {
  const { inline } = markdown;
  let parsedText = text;

  Object.keys(inline).forEach((element) => {
    parsedText = parsedText.replace(
      inline[element].regex,
      inline[element].htmlTemplate
    );
  });

  return parsedText;
};

const convertToHtml = (text) => {
  return parseInline(parseBlock(text));
};

module.exports = {
  convertToHtml
};