/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");
const helper = require("./helper");
const chalk = require("chalk");
const supportedExtensions = [".txt", ".md", ".css"];

const isFileSupported = (extension) => {
  return supportedExtensions.includes(extension);
};

const isFile = (argv) => {
  const extname = path.extname(argv);
  if (extname === ".txt" || extname === ".md") {
    return true;
  }
  if (fs.lstatSync(argv).isDirectory()) {
    return false;
  }
  return false;
};

function checkInput(input) {
  if (input === "") return false;

  const filepath = fs.lstatSync(input);
  if (filepath.isFile()) {
    const fileext = path.extname(input);
    if (isFileSupported(fileext)) {
      isFile = true;
      return true;
    } else {
      displayError(true, errorCode9, 9);
    }
  } else if (filepath.isDirectory()) {
    const checkTxtFile = (folderpath) => {
      const dirContents = fs.readdirSync(dirpath);
      for (const contents of dirContents) {
        const dirContentLstat = fs.lstatSync(path.join(dirpath, contents));

        if (dirContentLstat.isDirectory()) {
          if (checkTextFile(path.join(dirpath, content))) {
            return true;
          }
        } else {
          if (
            path.extname(content) === ".txt" ||
            path.extname(content) === ".md" ||
            path.extname(content) === ".css"
          ) {
            return true;
          }
        }
      }
      return false;
    };
    files = fs.readdirSync(input);
  } else {
    displayError(true, errorCode4, 4);
  }
  console.log(`Read folder -> ${input}`);
  return true;
}

module.exports = { isFile, checkInput, isFileSupported };
