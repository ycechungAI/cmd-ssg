#!/usr/bin/env node
const chalk = require('chalk')
const clear = require('clear')
const boxen = require("boxen")
const figlet = require('figlet')
const fs = require('fs')
let process = require('process')
const path = require('path')
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
let currentdir = path.dirname
let outputfolder = "dist/"
//commander
const { program } = require('commander')
program.version('0.1')
program
  .option('-v, --version', 'version 0.1')
  .option('-h, --help', 'help for cmd-svg')
  .option('-f, --file <file>', 'specify input file or folder')

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

(function(){
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
        .option('f', {
          alias: 'file',
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
    if (options.version) console.log(verMsg)
    if (options.help) console.log(msgHelp)
    //yargs
    if (options.file){
      if(/\w+.txt/.test(options.file)){ // ends in .txt which means its a file
        if(options.file.path){
          try {
            process.chdir(options.file.path);
          }catch(err){
            console.log("Invalid directory");  
          }
        }
      }else{
        try {
          process.chdir(options.file);
        }catch(err){
          console.log("Invalid directory");  
        }
      }
      console.log(`Read file -> ${options.file}`);
      process.stdin.resume();
      
      //do the magic of converting txt to 
      fs.readFile(options.file, 'utf8', (err, data)=>{
        if(err){
          console.error(err)
          return
        }
        let prefix = "<!doctype html><html><head><meta charset='utf-8'><title>Converted HTML</title></head><body>"
        let bodyT =  '<p>'.concat(data.replace(/\r{1,}/g, '</p><br><p>')).concat('</p>');
        let suffix = "</body></html>"
      
        //console.log(prefix + bodyT + suffix); 
        fs.writeFile(outputfolder + "index.html", prefix + bodyT + suffix, "utf8", function(err){
          if (err) return console.log(err);
          console.log(`${options.file} > ${outputfolder}index.html`);
        })
      })

      //exit
      process.exit;
      /*
      rl.question("What is the directory? ", function(directory){
        console.log(directory)
        currentdir = directory;
      })
      */
      /*
      fs.readdir(directory, function(err, file){
        if (err){
          return console.log('Unable to read directory' + err)
        }
        console.log(file.data)
      } 
      */ 
    }
  
    /*
    rl.on("close", function(){
      console.log("\n thank you for using our program!")
      process.exit(0)
    })
    */  
}());
