const fs = require("fs");
const path = require("path");
const { parseText, renderPage } = require("../bin/helper");
const { parseMarkdown } = require("../lib/parser/markdown");

const FIXTURES = path.join(__dirname, "fixtures");

// Golden files: test/fixtures/{md,txt}/<name> -> test/fixtures/expected/<name>.html
// To update after an intended change, regenerate the file with renderPage()
// and review the diff.
describe("golden files", () => {
  const cases = ["md", "txt"].flatMap((dir) =>
    fs.readdirSync(path.join(FIXTURES, dir)).map((file) => [dir, file])
  );

  it.each(cases)("%s/%s", (dir, file) => {
    const source = fs.readFileSync(path.join(FIXTURES, dir, file));
    const expected = fs.readFileSync(
      path.join(FIXTURES, "expected", `${path.parse(file).name}.html`),
      "utf8"
    );
    expect(renderPage(file, source)).toBe(expected);
  });
});

describe("parseText", () => {
  it("reads a title followed by two blank lines", () => {
    expect(parseText("Title\n\n\nBody")).toEqual({
      title: "Title",
      paragraphs: ["Body"],
    });
  });

  it("needs two blank lines for a title", () => {
    expect(parseText("Not a title\n\nBody").title).toBe("");
  });

  it("treats whitespace-only lines as blank", () => {
    expect(parseText("Title\n  \n\t\nBody").title).toBe("Title");
  });

  it("joins wrapped lines and splits on blank lines", () => {
    expect(parseText("a\nb\n\nc\n   \nd").paragraphs).toEqual([
      "a b",
      "c",
      "d",
    ]);
  });

  it("handles CRLF and CR line endings", () => {
    expect(parseText("T\r\n\r\n\r\nx\r\ny\r\rz").paragraphs).toEqual([
      "x y",
      "z",
    ]);
  });

  it("keeps the literal text _space_", () => {
    expect(parseText("a _space_ b").paragraphs).toEqual(["a _space_ b"]);
  });

  it("returns no paragraphs for empty input", () => {
    expect(parseText("")).toEqual({ title: "", paragraphs: [] });
    expect(parseText("\n\n\n")).toEqual({ title: "", paragraphs: [] });
  });
});

describe("parseMarkdown", () => {
  it("uses the first h1 as the title", () => {
    const parsed = parseMarkdown("intro\n\n# The *Title*\n\n# Second");
    expect(parsed.title).toBe("The Title");
    expect(parsed.startsWithTitle).toBe(false);
  });

  it("flags a document that opens with its h1", () => {
    expect(parseMarkdown("# Top\n\ntext").startsWithTitle).toBe(true);
  });

  it("ignores lower-level headings for the title", () => {
    expect(parseMarkdown("## Sub\n\ntext").title).toBe("");
  });

  it("includes inline code in the title", () => {
    expect(parseMarkdown("# Using `ssg`").title).toBe("Using ssg");
  });

  it("does not repeat a leading h1 in the page", () => {
    const html = renderPage("a.md", "# Top\n\ntext");
    expect(html.match(/<h1>/g)).toHaveLength(1);
  });

  it("escapes a title that contains HTML", () => {
    const html = renderPage("a.md", "text\n\n# a &lt;b&gt;");
    expect(html).toContain("<title>a &lt;b&gt;</title>");
    expect(html).not.toContain("<title>a <b></title>");
  });
});
