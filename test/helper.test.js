/* eslint-disable quotes */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const path = require("path");
const { isFileCheck } = require("./../bin/helper");
const { createIndexHtmlFile } = require("./../bin/helper");

describe("IsFileCheck check", () => {
  it("Check for correct file", () => {
    const response = isFileCheck("..\\sample_txt\\The Naval Treaty.txt");
    expect(response).toBe(true);
  });

  it("Check for directory", () => {
    const response = isFileCheck("..\\sample_txt\\");
    expect(response).toBe(false);
  });

  it("Check for not .txt or .md files", () => {
    const response = isFileCheck("./index.html");
    expect(response).toBe(false);
  });
});

//INPUT CHECKS
const { checkInput } = require("./../bin/helper");
describe("Input argv check", () => {
  it("Check for correct input file", () => {
    try {
      checkInput("README.md");
      expect(true).toBe(true);
    } catch (error) {
      expect(error).toBe(false);
    }
  });

  it("Check for non exist file", () => {
    try {
      checkInput("holyghost.txt");
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe("Directory or file must exist.");
    }
  });

  it("Check for empty argument", () => {
    checkInput();
    expect(true).toBe(true);
  });
});

//ADDING MORE TESTS - Rendering HTML content
const { createHtmlFileTest } = require("./../bin/helper");
describe("Render HTML", () => {
  it("Check for correct input file", () => {
    //console.log(path.basename("./sample_txt/htmltest1.txt"));
    const expectedHtml = `<!doctypehtml>
    <htmllang="en">
      <head>
        <metacharset="UTF-8">
        <title>TitleOfTest</title>
        <metahttp-equiv="X-UA-Compatible"content="IE=edge">
        <metaname="viewport"content="width=device-width,initial-scale=1.0">
        <linkrel="stylesheet"href="">
      </head>
      <body>
        <h1>TitleOfTest</h1>
        <p>first paragraph.</p>
        <p>second paragraph.</p>
      </body>
    </html>`;
    return createHtmlFileTest(
      "htmltest1.txt",
      "Title Of Test\n\n\nfirst paragraph.\n\nsecond paragraph.",
      "",
      "./dist"
    ).then((data) => {
      console.log(data.replace(/\s/g, ""));
      expect(data.replace(/\s/g, "")).toBe(expectedHtml.replace(/\s/g, ""));
    });
  });

  describe("Should IsFileCheck return false with .docx, .cs, .html",()=> {
    it("Check for .docx", () => {
      const file = ".docx";
      expect(isFileCheck(file)).toBe(false);
    });

    it("Check for .cs", () => {
      const file = ".cs";
      expect(isFileCheck(file)).toBe(false);
    });

    it("Check for .html", () => {
      const file = ".html";
      expect(isFileCheck(file)).toBe(false);
    });
  });

  const fs = require('fs');
  test("Should createIndexHtmlFile generate index.html", async ()=>{
    await createIndexHtmlFile(['dummpy1', 'dummy2'],"",'./dist'); 
    const result =  fs.existsSync('./dist/index.html');
    expect(result).toBe(true);
  });
});
