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
});
