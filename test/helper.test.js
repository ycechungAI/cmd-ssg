/* eslint-disable no-undef */
const { isFileCheck } = require("./../bin/helper");

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
});

//ADDING MORE TESTS
