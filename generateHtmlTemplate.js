/* eslint-disable quotes */
/* eslint-disable indent */
/* eslint-disable no-undef */
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
const markdown = require("./lib/parser/markdown");

const escapeHtml = (unsafe) => {
  if (unsafe === undefined || unsafe === null) return "";
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderContent = (options) => {
  if (options.fileExtname === ".txt") {
    return options.content
      .map((phrases) => `<p>${escapeHtml(phrases.trim())}</p>\n`)
      .join("\n");
  } else if (options.fileExtname === ".md") {
    return options.content
      .map((phrases) => markdown.convertToHtml(phrases.trim()))
      .join("\n");
  } else {
    return "";
  }
};

const generateHtmlTemplate = (options) => {
  return `
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(options.title || "Document")}</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${escapeHtml(options.style)}">
    </head>
    <body>
        <h1>${escapeHtml(options.title || "Document")}</h1>
        ${renderContent(options)}
    </body>
    </html>
    `;
};

const generateHtmlMenuTemplate = (options) => {
  return (
    `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Home</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${escapeHtml(options.style)}">
</head>
<body>
    <h1>Home menu</h1>
    <h2>Summary</h2>` +
    `<ul>
    ${options.routeList
      .map((route) => `<li><a href='${route.url}'>${escapeHtml(route.name)}</a></li>`)
      .join("\n")}
    </ul>
</body>
</html>`
  );
};

module.exports = { generateHtmlTemplate, generateHtmlMenuTemplate };
