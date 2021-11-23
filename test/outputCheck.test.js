/* eslint-disable no-undef */
const { outputCheck } = require("./../bin/outputCheck");

describe("Output check", () => {
  it("Check for correct output directory", () => {
    const response = outputCheck("sample_txt");
    expect(response).toBe(true);
  });

  it("Check for not a output directory", () => {
    try {
      outputCheck("README.md");
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe("Path must be a directory.");
    }
  });
});
