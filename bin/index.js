#!/usr/bin/env node
/* eslint-disable no-undef */
const chalk = require("chalk");
const clear = require("clear");
const boxen = require("boxen");
const figlet = require("figlet");
let process = require("process");
// eslint-disable-next-line no-unused-vars
const path = require("path");
//const readline = require("readline");

const helper = require("./helper");
const checkInput = require("./inputCheck");
const checkOutput = require("./outputCheck");
let outputFolderLocal = "./dist";
// eslint-disable-next-line no-unused-vars
let inputPaths = "./";
let files = [];
//commander
const { program } = require("commander");
//const { option } = require("yargs");
const errorCode1 = chalk.red.bold("No supported file or folder!");

program.version("0.1");
program.option(
  "-c, --config <type>",
  "enter the config.json file with options to be added here"
);
program.option("-v, --version", "version 0.1");
program.option("-h, --help", "help for cmd-svg");
program.option("-i, --input <input>", "specify input file or folder");
program.option("-s, --stylesheet <input>", "specify a stylesheet file");
program.option("-o, --output <input>", "specify an output folder");
//styles
const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "green",
  backgroundColor: "#555555",
};

//message variables
const versionMsg = chalk.white.bold(`${program.version}\n`);
const helpMsg = chalk.white.bold(
  "HELP\n----------------------------------------------------------------------\n -h, --help       list options \n -v, --version    program version \n -i, --input      specify input file or folder\n -s, --stylesheet specify stylesheet\n -o, --output specify an output folder\n"
);

//clear screen
clear();
console.log(
  chalk.yellow(figlet.textSync("cmd-ssg", { horizontalLayout: "full" }))
);

const verMsg = boxen(versionMsg, boxenOptions);
const msgHelp = boxen(helpMsg, boxenOptions);

//commander code
program.parse(process.argv);
const options = program.opts();
if (options.version) {
  console.log(verMsg);
  //exit
  process.exit(0); // success
} else if (options.help) {
  console.log(msgHelp);
  //exit
  process.exit(0); // success
} else {
  //check if input is file or folder and if it exists
  if (options.config) {
    const configFile = require("../" + options.config);
    configFile.input ? (options.input = configFile.input) : process.exit(1);
    configFile.stylesheet
      ? (options.stylesheet = configFile.stylesheet)
      : (options.stylesheet = undefined);
    configFile.output
      ? (outputFolderLocal = configFile.output)
      : (outputFolderLocal = "dist");
  }
  // eslint-disable-next-line no-unused-vars
  files = [];

  if (process.argv[5] != undefined) {
    checkInputTest1 = checkInput.checkInput(process.argv[5]);
    if (checkInputTest1 == false) {
      helper.displayError(true, errorCode1, 1);
      process.exit(1);
    }
  }
  testInput = checkInput.checkInput(options.input);
  testOutput = checkOutput.outputCheck(outputFolderLocal);
  if (options.output) {
    outputFolderLocal = options.output;
  }
  if (testInput == true && testOutput == true) {
    //do the magic of converting txt to html
    console.log("  running >>>");
    helper.convertToHtml(
      options.input,
      options.stylesheet,
      outputFolderLocal,
      isFile
    );
  } else {
    //no input given
    helper.displayError(true, errorCode1, 1);
  }
}
