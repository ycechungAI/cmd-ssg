#!/usr/bin/env node
const chalk = require('chalk');
const clear = require('clear');
const boxen = require("boxen");
const figlet = require('figlet');
const fs = require('fs');
let process = require('process');
const path = require('path');
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
let currentdir = path.dirname
let outputfolder = "dist/"
//commander
const { program } = require('commander');
program.version('0.1');
program.option('-v, --version', 'version 0.1');
program.option('-h, --help', 'help for cmd-svg');
program.option('-i, --input <input>', 'specify input file or folder');
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
var { argv } = require('yargs')
    .help()
    .option('i', {
      alias: 'input',
      demandOption: true,
      default: '.',
      describe: "specify input file or folder",
      type: 'string'
  }).argv;
  
  const verMsg = boxen( versionMsg, boxenOptions );
  const msgHelp = boxen( helpMsg, boxenOptions);
  
  
  
  //commander code
  program.parse(process.argv);
  
  const options = program.opts()
  if(options.version){
    console.log(verMsg)
  } else if (options.help) {
    console.log(msgHelp)
  } else {
    //yargs
    //check if input is file or folder and if it exists
    function checkInput(input) {
      if (fs.existsSync(input)) {
          if (fs.statSync(input).isDirectory()) {
              console.log(chalk.green("input is a folder"))
              return true;
          } else {
              console.log(chalk.green("input is a file"))
              return true;
          }
      } else {
          console.log(chalk.red("input does not exist"))
          return false;
      }
    }
    
    //files
    let files = [];
    if (options.input){
      if(/\w+.txt/.test(options.input)){ // ends in .txt which means its a file
        if(options.input.path){
          try {
            process.chdir(options.input.path);
            files[0] = options.input;
          }catch(err){
            console.log("Invalid file");  
          }
        }
        console.log(`Read file -> ${options.input}`);
      }else{ //folder
        if(options.input.path){
          try {
            process.chdir(options.input.path);
            files = fs.readdirSync(options.input);
          }catch(err){
            console.log("Invalid folder");  
          }
        }
          console.log(`Read folder -> ${options.input}`);
      }
    }else{ //no input given
      console.log("No input given"); 
      process.stdin.resume();
        
      //do the magic of converting txt to html
      let j = 0
      for(file in files){
        fs.readFile(options.file, 'utf8', (err, data)=>{
        if(err){
          console.error(err)
          return
        }
        let prefix = "<!doctype html><html><head><meta charset='utf-8'><title>Converted HTML</title></head><body>"
        let bodyT =  '<p>'.concat(data.replace(/\r{1,}/g, '</p><br><p>')).concat('</p>');
        let suffix = "</body></html>"
        //console.log(prefix + bodyT + suffix); 
          
        fs.writeFile(outputfolder + file[j], prefix + bodyT + suffix, "utf8", function(err){
          if(err){
            console.log(err)
            return
          }
            console.log(`${file[j]} converted`)
          })
        })
      }
    }
    //exit
    process.exit;
}