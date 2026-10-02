const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  isFileCheck,
  checkInput,
  createHtmlFileTest,
  createIndexHtmlFile,
  renderPage,
  CliError,
} = require("./../bin/helper");

describe("IsFileCheck check", () => {
  it("Check for correct file", () => {
    const response = isFileCheck(
      path.join("..", "sample_txt", "The Naval Treaty.txt")
    );
    expect(response).toBe(true);
  });

  it("Check for directory", () => {
    const response = isFileCheck(path.join("..", "sample_txt") + path.sep);
    expect(response).toBe(false);
  });

  it("Check for not .txt or .md files", () => {
    const response = isFileCheck("./index.html");
    expect(response).toBe(false);
  });

  it("Check for .css (not a page source)", () => {
    expect(isFileCheck("style.css")).toBe(false);
  });

  it("Check for missing input", () => {
    expect(isFileCheck(undefined)).toBe(false);
  });
});

//INPUT CHECKS
describe("Input argv check", () => {
  it("Check for correct input file", () => {
    expect(checkInput("README.md")).toBe(true);
  });

  it("Check for non exist file", () => {
    expect(() => checkInput("holyghost.txt")).toThrow(
      "Directory or file must exist."
    );
  });

  it("Check for empty argument", () => {
    expect(() => checkInput()).toThrow(CliError);
    expect(() => checkInput()).toThrow("No input given");
  });

  it("Check for .css input file", () => {
    expect(() => checkInput(path.join("sample_css", "new.css"))).toThrow(
      "File must be a .txt or .md file."
    );
  });
});

//ADDING MORE TESTS - Rendering HTML content
describe("Render HTML", () => {
  it("Check for correct input file", () => {
    const expectedHtml = `<!doctypehtml>
    <htmllang="en">
      <head>
        <metacharset="UTF-8">
        <metaname="viewport"content="width=device-width,initial-scale=1.0">
        <title>TitleOfTest</title>
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
      ""
    ).then((data) => {
      expect(data.replace(/\s/g, "")).toBe(expectedHtml.replace(/\s/g, ""));
    });
  });

  it("Omits the stylesheet link without a stylesheet", () => {
    expect(renderPage("a.txt", "text", "")).not.toContain("<link");
    expect(renderPage("a.txt", "text")).not.toContain("<link");
  });

  it("Links the stylesheet when one is given", () => {
    expect(renderPage("a.txt", "text", "style.css")).toContain(
      '<link rel="stylesheet" href="style.css">'
    );
  });

  describe("Should IsFileCheck return false with .docx, .cs, .html", () => {
    it("Check for .docx", () => {
      expect(isFileCheck(".docx")).toBe(false);
    });

    it("Check for .cs", () => {
      expect(isFileCheck(".cs")).toBe(false);
    });

    it("Check for .html", () => {
      expect(isFileCheck(".html")).toBe(false);
    });
  });

  test("Should createIndexHtmlFile generate index.html", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ssg-index-"));
    try {
      await createIndexHtmlFile(
        [
          { url: "a.html", name: "a" },
          { url: "b/c.html", name: "c" },
        ],
        "",
        tmp
      );
      const html = fs.readFileSync(path.join(tmp, "index.html"), "utf8");
      expect(html).toContain("href='a.html'");
      expect(html).toContain("href='b/c.html'");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
