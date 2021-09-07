#!/usr/bin/env node
const chalk = require('chalk');
const clear = require('clear');
const boxen = require("boxen");
const figlet = require('figlet');
const fs = require('fs');
  
//commander
const { program } = require('commander');
program.version('0.1');
program
  .option('-v, --version', 'version 0.1')
  .option('-h, --help', 'help for cmd-svg')

//styles
const boxenOptions = {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    backgroundColor: "#555555"
   };

//message variables
const versionMsg = chalk.white.bold(`${program.version}\n`);
const helpMsg = chalk.white.bold("HELP\n----------------------------\n -h, --help     list options \n -v, --version  program version \n -f, --file     specify input file or folder\n");

//clear screen
clear();
console.log(
    chalk.yellow(
      figlet.textSync('cmd-ssg', { horizontalLayout: 'full' })
    )
);
//yargs 
const argv = require('yargs')
   .option("f", {
     alias: "file",
     demandOption: true,
     default: '.',
     describe: "specify input file or folder",
     type: 'string'
   })
   .help()
   .argv;

const verMsg = boxen( versionMsg, boxenOptions );
const msgHelp = boxen( helpMsg, boxenOptions);

//commander code
program.parse(process.argv);

const options = program.opts();
if (options.version) console.log(verMsg);
if (options.help) console.log(msgHelp);
//yargs
console.log(argv.file);