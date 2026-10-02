const { outputCheck } = require("./../bin/outputCheck");

describe("Output check", () => {
  it("Check for correct output directory", () => {
    const response = outputCheck("sample_txt");
    expect(response).toBe(true);
  });

  it("Check for a missing output directory (created later)", () => {
    expect(outputCheck("does-not-exist-yet")).toBe(true);
  });

  it("Check for not a output directory", () => {
    expect(() => outputCheck("README.md")).toThrow(
      "Output path must be a directory: README.md"
    );
  });
});
