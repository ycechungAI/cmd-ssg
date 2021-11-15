/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");

const supportedExtensions = [".txt", ".md", ".css"];

const isFileSupported = (extension) => {
  return supportedExtensions.includes(extension);
};

const isFileCheck = (input) => {
  const extname = path.extname(input);
  if (extname === ".txt" || extname === ".md" || extname === ".css") {
    return true;
  }
  if (fs.lstatSync(input).isDirectory()) {
    return false;
  }
  return false;
};

function checkInput(input) {
  if (input) {
    // Check if path exist
    if (fs.existsSync(input)) {
      // Check if path is a file or directory
      if (fs.lstatSync(input).isFile()) {
        const extname = path.extname(input);
        // Check if path is a file ext end with .txt, or .md
        if (extname === ".txt" || extname === ".md" || extname === ".css") {
          return true;
        }
        throw new Error("File must be a .txt or .md' or .css");
      } else if (fs.lstatSync(input).isDirectory()) {
        // checkValidFile recursively check if any .txt or .md file exist
        const checkValidFile = (dirPath) => {
          const dirContents = fs.readdirSync(dirPath);

          // Loop through the content of the directory
          for (const dirContent of dirContents) {
            const dirContentLstat = fs.lstatSync(
              path.join(dirPath, dirContent)
            );

            if (dirContentLstat.isDirectory()) {
              if (checkValidFile(path.join(dirPath, dirContent))) return true;
            } else {
              const extname = path.extname(dirContent);
              if (extname === ".txt" || extname === ".md" || extname === ".css")
                return true;
            }
          }
          return false;
        };

        // Check if directory contains at least one .txt or .md file
        const hasValidFile = checkValidFile(input);

        if (!hasValidFile)
          throw new Error("Directory doesn't contain any .txt or .md file.");
      }
      return true;
    }
    throw new Error("Directory or file must exist.");
  }
  return true;
}
module.exports = { isFileCheck, checkInput, isFileSupported };
