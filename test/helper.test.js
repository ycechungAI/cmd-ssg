const { helper } = require("./../bin/helper");

describe("IsFileCheck check", () => {
  it("Check for correct file", () => {
    const response = helper.isFileCheck("src\\sample_txt\\Silver Surfer.txt");
    expect(response).toBe(true);
  });

  it("Check for directory", () => {
    const response = helper.isFileCheck("src\\sample_txt\\");
    expect(response).toBe(false);
  });

  it("Check for not .txt or .md files", () => {
    const response = helper.isFileCheck("src\\.gitignore");
    expect(response).toBe(false);
  });
});
