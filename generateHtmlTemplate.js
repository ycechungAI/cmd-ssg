/*
https://github.com/Kevan-Y/text-ssg/blob/master/generateHtmlTemplate.js

MIT License

Copyright (c) 2021 Kevan Yang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/
const escapeHtml = (unsafe) => {
  if (unsafe === undefined || unsafe === null) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const sanitizeUrl = (url) => {
  if (url === undefined || url === null) return "";

  const unescapeUrl = (str) => {
    try {
      return decodeURIComponent(str);
    } catch {
      // Fallback for malformed URIs
      return unescape(str);
    }
  };

  const decodeHTMLEntities = (text) => {
    return text
      .replace(/&#(\d+);?/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);?/gi, (match, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
  };

  let decodedUrl = unescapeUrl(url.toString());
  // Prevent multiple encoding bypasses
  let previousDecodedUrl = "";
  while (decodedUrl !== previousDecodedUrl) {
    previousDecodedUrl = decodedUrl;
    decodedUrl = unescapeUrl(decodeHTMLEntities(decodedUrl));
  }

  const cleanUrl = decodedUrl
    .toLowerCase()
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x20\s\u00A0]/g, "");

  if (
    cleanUrl.startsWith("javascript:") ||
    cleanUrl.startsWith("data:") ||
    cleanUrl.startsWith("vbscript:")
  ) {
    return "about:blank";
  }

  return url.toString();
};

// Omit the <link> entirely without a stylesheet: href="" would make the
// browser re-request the page itself as CSS.
const renderStylesheet = (style) =>
  style
    ? `\n    <link rel="stylesheet" href="${escapeHtml(sanitizeUrl(style))}">`
    : "";

const renderHead = (title, options) => `<!doctype html>
<html lang="${escapeHtml(options.lang || "en")}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>${renderStylesheet(options.style)}
  </head>
  <body>
`;

const renderFoot = () => `  </body>
</html>
`;

// Page body. Text paragraphs are escaped here; Markdown arrives as HTML that
// markdown-it already rendered with raw HTML disabled.
const renderContent = (options) => {
  if (options.fileExtname === ".txt") {
    return options.content
      .map((paragraph) => `    <p>${escapeHtml(paragraph)}</p>\n`)
      .join("");
  }
  if (options.fileExtname === ".md") {
    return options.content;
  }
  return "";
};

const generateHtmlTemplate = (options) => {
  const title = options.title || "Document";
  const heading =
    options.emitHeading === false ? "" : `    <h1>${escapeHtml(title)}</h1>\n`;
  return (
    renderHead(title, options) + heading + renderContent(options) + renderFoot()
  );
};

// Group routes by folder: { pages: [route], folders: { name: group } }.
const groupRoutes = (routeList) => {
  const root = { pages: [], folders: {} };
  for (const route of routeList) {
    const dirs = route.dir ? route.dir.split("/") : [];
    let group = root;
    for (const dir of dirs) {
      group.folders[dir] = group.folders[dir] || { pages: [], folders: {} };
      group = group.folders[dir];
    }
    group.pages.push(route);
  }
  return root;
};

const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const renderRouteGroup = (group, depth) => {
  const pad = "  ".repeat(depth + 2);
  const items = [
    ...[...group.pages]
      .sort((a, b) => compareText(a.url, b.url))
      .map(
        (route) =>
          `${pad}  <li><a href='${escapeHtml(
            sanitizeUrl(route.url),
          )}'>${escapeHtml(route.title || route.name)}</a></li>\n`,
      ),
    ...Object.keys(group.folders)
      .sort(compareText)
      .map(
        (name) =>
          `${pad}  <li>${escapeHtml(name)}\n${renderRouteGroup(
            group.folders[name],
            depth + 2,
          )}${pad}  </li>\n`,
      ),
  ];
  return `${pad}<ul>\n${items.join("")}${pad}</ul>\n`;
};

const generateHtmlMenuTemplate = (options) =>
  renderHead("Home", options) +
  "    <h1>Home menu</h1>\n    <h2>Summary</h2>\n" +
  renderRouteGroup(groupRoutes(options.routeList), 0) +
  renderFoot();

module.exports = { generateHtmlTemplate, generateHtmlMenuTemplate };
