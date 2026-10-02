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

  it("Should prevent XSS bypass via control characters in URLs", async () => {
    const maliciousStyle = "java\x00script:alert(1)";
    const maliciousStyle2 = "java\tscript:alert(1)";
    const expectedEscapedStyle = "about:blank";

    const outputHtml1 = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle,
      "./dist"
    );
    expect(outputHtml1).toContain(`href="${expectedEscapedStyle}"`);

    const outputHtml2 = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle2,
      "./dist"
    );
    expect(outputHtml2).toContain(`href="${expectedEscapedStyle}"`);
  });

  it("Should prevent XSS bypass via multiple encoding and malformed URIs", async () => {
    const maliciousStyle1 = "java%2509script:alert(1)"; // Double encoded \t
    const maliciousStyle2 = "java%09script:alert(1)%A0"; // Encoded \t + malformed non-breaking space
    const expectedEscapedStyle = "about:blank";

    const outputHtml1 = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle1,
      "./dist"
    );
    expect(outputHtml1).toContain(`href="${expectedEscapedStyle}"`);

    const outputHtml2 = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle2,
      "./dist"
    );
    expect(outputHtml2).toContain(`href="${expectedEscapedStyle}"`);
  });

  it("Should prevent XSS bypass via HTML entity encoding", async () => {
    const maliciousStyle1 = "&#106;avascript:alert(1)"; // j is &#106;
    const maliciousStyle2 = "&#x6A;avascript:alert(1)"; // j is &#x6A;
    const maliciousStyle3 = "jav&#x09;ascript:alert(1)"; // tab encoded inside
    const expectedEscapedStyle = "about:blank";

    const outputHtml1 = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle1,
      "./dist"
    );
    expect(outputHtml1).toContain(`href="${expectedEscapedStyle}"`);

    const outputHtml2 = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle2,
      "./dist"
    );
    expect(outputHtml2).toContain(`href="${expectedEscapedStyle}"`);

    const outputHtml3 = await createHtmlFileTest(
      "test.txt",
      "Content",
      maliciousStyle3,
      "./dist"
    );
    expect(outputHtml3).toContain(`href="${expectedEscapedStyle}"`);
  });
});
