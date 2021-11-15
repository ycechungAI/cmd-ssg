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

const renderContent = (options) => {
  if (options.fileExtname === ".txt") {
    return options.content
      .map((phrases) => `<p>${phrases.trim()}</p>\n`)
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
  return (
    `<!doctype html><html lang="en"><head><meta charset="UTF-8">` +
    `<title>${options.title} || "Document"}</title>` +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    `${options.style}` +
    `? <link rel='stylesheet' href='${options.style}'>` +
    `</head><body><h1>${options.title} || "Document"}</h1>` +
    `${renderContent(options)}</body></html>`
  );
};

const generateHtmlMenuTemplate = (options) => {
  return `
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Home</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${
          options.style
            ? `<link rel="stylesheet" href="${options.style}">`
            : `<style>
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&display=swap');

    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    ::-webkit-scrollbar-thumb {
        background: #36363638;
        border-radius: 0px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #878587;
    }

    ::-webkit-scrollbar-track {
        background: #FFFFFF;
        border-radius: 0px;
        box-shadow: inset 0px 0px 0px 0px #F0F0F0;
    }

    body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
        line-height: 2;
        max-width: 800px;
        margin: 1rem auto;
        padding: 0 1rem;
        word-wrap: break-word;
        color: #1F2937;
        background: #F9FAFB;
        text-rendering: optimizeLegibility;
    }

    h1 {
        font-size: 2.2em;
        margin-top: 0;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: #111827;
        font-family: 'Libre Baskerville', serif;
        margin-bottom: 12px;
        margin-top: 24px;
        font-weight: bold;
    }

    a {
        text-decoration: none;
        color: #2563EB;
        transition: ease-in 150ms;
    }

    a:hover {
        text-decoration: underline;
        color: #3B82F6;
    }
</style>`
        }
    </head>
    <body>
        <h1>Home menu</h1>
        <h2>Summary</h2>
            <ul>
        ${options.routeList
          .map((route) => `<li><a href='${route.url}'>${route.name}</a></li>`)
          .join("\n")}
           
        </ul>
    </body>
    </html>
    `;
};

module.exports = { generateHtmlTemplate, generateHtmlMenuTemplate };
