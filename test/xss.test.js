/* eslint-disable no-undef */
const { createHtmlFileTest } = require("./../bin/helper");

describe("Security XSS Checks", () => {
  it("Should escape malicious stylesheet URL", () => {
    const maliciousStyle = "\"><script>alert(1)</script><link rel=\"stylesheet\" href=\"";
    return createHtmlFileTest(
      "test.txt",
      "Safe content",
      maliciousStyle,
      "./dist"
    ).then((html) => {
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    });
  });

  it("Should escape malicious title in generated HTML", () => {
    // Title is derived from filename or content
    // For txt file, if content has title
    const maliciousContent = "<script>alert(\"title\")</script>\n\n\nContent";
    return createHtmlFileTest(
      "test.txt",
      maliciousContent,
      "",
      "./dist"
    ).then((html) => {
      expect(html).not.toContain("<script>alert(\"title\")</script>");
      // Title should be escaped in <title> and <h1>
      // Note: createHtmlFileTest logic for title extraction from txt:
      // if (data.length >= 3) { if (data[0] && !data[1] && !data[2]) { title = data[0]; } }
      // So checking if title is escaped in output
    });
  });
  it("Should sanitize malicious route URL in HTML menu template", () => {
    const { generateHtmlMenuTemplate } = require("../generateHtmlTemplate");
    const maliciousOptions = {
      style: "style.css",
      routeList: [
        { url: "javascript:alert(1)", name: "test1" },
        { url: "data:text/html,<script>alert(1)</script>", name: "test2" },
        { url: "vbscript:msgbox(\"test\")", name: "test3" },
        { url: "JAVAScript:alert(1)", name: "test4" },
        { url: "javascript%3Aalert(1)", name: "test5" },
        { url: "\x19javascript:alert(1)", name: "test6" },
        { url: "java\nscript:alert(1)", name: "test7" },
        { url: "%00javascript:alert(1)", name: "test8" },
        { url: "/safe/path.html", name: "safe" }
      ]
    };

    const html = generateHtmlMenuTemplate(maliciousOptions);
    expect(html).not.toContain("href='javascript:alert(1)'");
    expect(html).not.toContain("href='data:text/html,<script>alert(1)</script>'");
    expect(html).not.toContain("href='vbscript:msgbox(&quot;test&quot;)'");
    expect(html).not.toContain("href='JAVAScript:alert(1)'");
    expect(html).not.toContain("href='javascript%3Aalert(1)'");
    expect(html).not.toContain("href='&#039;javascript:alert(1)'");
    expect(html).not.toContain("href='java\nscript:alert(1)'");
    expect(html).not.toContain("href='%00javascript:alert(1)'");

    // Check that it replaced them with about:blank
    expect(html.match(/href='about:blank'/g).length).toBe(8);
    // Check that the safe URL is retained
    expect(html).toContain("href='/safe/path.html'");
  });
});
