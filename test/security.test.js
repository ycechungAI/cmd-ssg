/* eslint-disable no-undef */
const { createHtmlFileTest } = require("../bin/helper");

describe("Security Check", () => {
  it("Should escape stylesheet option to prevent XSS", async () => {
    const maliciousStyle = "\"><script>alert(1)</script>";
    // The expected output should have the malicious style escaped
    // " becomes &quot;
    // > becomes &gt;
    // < becomes &lt;
    // & becomes &amp;
    const expectedEscapedStyle = "&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;";

    const outputHtml = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle,
      "./dist"
    );

    // We expect the href attribute to contain the escaped string
    expect(outputHtml).toContain(`href="${expectedEscapedStyle}"`);
    // And definitely not the raw string which would break out of the attribute
    expect(outputHtml).not.toContain(`href="${maliciousStyle}"`);
  });

  it("Should sanitize malicious protocol schemes to prevent XSS", async () => {
    const maliciousStyle = "javascript:alert(1)";
    const expectedEscapedStyle = "about:blank";

    const outputHtml = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle,
      "./dist"
    );

    // We expect the href attribute to contain the sanitized empty string
    expect(outputHtml).toContain(`href="${expectedEscapedStyle}"`);
    expect(outputHtml).not.toContain(`href="${maliciousStyle}"`);
  });

  it("Should sanitize malicious protocol schemes with control characters to prevent XSS bypass", async () => {
    const expectedEscapedStyle = "about:blank";

    const testCases = [
      "java\nscript:alert(1)",
      "java\x00script:alert(1)",
      "java\rscript:alert(1)",
      "java\tscript:alert(1)",
      " javascript:alert(1)",
      "javascript:alert(1) "
    ];

    for (const maliciousStyle of testCases) {
      const outputHtml = await createHtmlFileTest(
        "test.txt",
        "Content",
        maliciousStyle,
        "./dist"
      );

      expect(outputHtml).toContain(`href="${expectedEscapedStyle}"`);
      expect(outputHtml).not.toContain(`href="${maliciousStyle}"`);
    }
  });
});
