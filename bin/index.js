#!/usr/bin/env node
const fs = require('fs');
const version = require('../package.json').version;
const chalk = require('chalk');
const clear = require('clear');
const boxen = require("boxen");
const figlet = require('figlet');
let process = require('process');
const path = require('path');
const readline = require("readline");

//**open source by Kevan Yang
const generateHTML = require('../generateHtmlTemplate');
//**
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
let isFile;
let inputPaths = './'
let outputFolder = "./dist"

//commander
const { program } = require('commander');
program.version('0.1');
program.option('-v, --version', 'version 0.1');
program.option('-h, --help', 'help for cmd-svg');
program.option('-i, --input <input>', 'specify input file or folder');
program.option('-s, --stylesheet <input>', 'specify a stylesheet file');
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
const helpMsg = chalk.white.bold("HELP\n----------------------------------------------------------------------\n -h, --help       list options \n -v, --version    program version \n -i, --input      specify input file or folder\n -s, --stylesheet specify stylesheet\n");


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
    })
    .option('s', {
      alias: 'stylesheet',
      demandOption: true,
      default: '.',
      describe: "specify stylesheet",
      type: 'string'
    }).argv;
  
  
  const verMsg = boxen( versionMsg, boxenOptions );
  const msgHelp = boxen( helpMsg, boxenOptions);
  
  // readFile

  const readFile = (filepath) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, 'utf-8', (error, content) =>{
        if (error != null){
          reject(error);
          return;
        }
        resolve(content);
      });
    });
  };

  // createHTML
  const createHtmlFile = async (fileName, data, stylesheet = '', outputPath) => {
  let htmlOption = {
    ...treatData(data),
    style: stylesheet,
  };
  const underscoreFileName = fileName.replaceAll(' ', '_');
  await fs.promises.writeFile(
    path.join(`${outputPath}`, `${underscoreFileName}.html`),
    generateHTML.generateHtmlTemplate(htmlOption),
    (err) => {
      if (err) throw new Error(err);
    },
  );
    console.log(`File created -> ${path.join(`${outputFolder}`, `${underscoreFileName}.html`)}`);
    return path.join(`${outputPath}`, `${fileName}.html`);
    
  };

  //createHtmlFile generateHTML file

  const createIndexHtmlFile = async (routeList, stylesheet = '', outputPath) => {
  let htmlOption = {
    routeList,
    style: stylesheet,
  };

  //Create a new html file
  await fs.promises.writeFile(
    path.join(`${outputPath}`, `index.html`),
    generateHTML.generateHtmlMenuTemplate(htmlOption),
    (err) => {
      if (err) throw new Error(err);
    },
  );
  console.log(`File created -> ${path.join(`${outputPath}`, `index.html`)}`);
  };

  // get all files
  const getAllFiles = async (dirPath, filesPathList) => {
  const files = await fs.promises.readdir(dirPath);
  filesPathList ||= [];

  for (const file of files) {
    const fileLstat = await fs.promises.lstat(path.join(dirPath, file));
    if (fileLstat.isDirectory()) {
      filesPathList = await getAllFiles(
        path.join(dirPath, file),
        filesPathList,
      );
    } else {
      if (path.extname(file) === '.txt')
        filesPathList.push(path.join(dirPath, file));
    }
  }

  return filesPathList;
  };
  const convertToHtml = async (
  inputPaths,
  stylesheet = '',
  outputPath,
  isFile,
  ) => {
  let routesList = [];
  //Check if ./dist folder exist
  //Remove if exist
  if (fs.existsSync('./dist') && outputPath === './dist') {
    await fs.promises.rm('./dist', { force: true, recursive: true }, (err) => {
      if (err) throw new Error(err);
    });
  }
  if (outputPath === './dist')
    //Create a new folder call ./dist
    await fs.promises.mkdir('./dist', { recursive: true }, (err) => {
      if (err) throw new Error(err);
    });

  if (isFile) {
    //Read file data
    const data = await readFile(inputPaths);

    //Create the html file
    let createdFileName = await createHtmlFile(
      path.basename(inputPaths, '.txt'),
      data,
      stylesheet,
      outputPath,
    );

    //Add to the array routesList to generate <a> in index.html
    routesList.push({
      url: createdFileName.replaceAll(' ', '_').replace(path.normalize(outputPath), '').substr(1),
      name: path.basename(createdFileName.replaceAll(' ', '_'), '.html'),
    });
    await createIndexHtmlFile(routesList, stylesheet, outputPath);
  } else {
    //Get allFiles
    const filesPathList = [];
    await getAllFiles(inputPaths, filesPathList);

    const listFolderPath = [];
    //Remove root folder and removes duplicates
    for (let filePath of filesPathList) {
      filePath = filePath.split(/\\|\//);
      filePath.shift();
      filePath = filePath.join('/');
      if (!listFolderPath.includes(path.dirname(filePath))) {
        listFolderPath.push(path.dirname(filePath));
      }
    }

    //Create folder
    for (let dir of listFolderPath) {
      await fs.promises.mkdir(
        path.join(outputPath, dir).replaceAll(' ', '_'),
        { recursive: true },
        (err) => {
          if (err) throw new Error(err);
        },
      );
    }

    for (let filePath of filesPathList) {
      //Read file data
      const data = await readFile(filePath);

      //Remove root folder
      filePath = filePath.split(/\\|\//);
      filePath.shift();
      const noRootFilePath = filePath.join('/');

      //Create the html file
      let createdFileName = await createHtmlFile(
        path.basename(noRootFilePath, '.txt').replaceAll(' ', '_'),
        data,
        stylesheet,
        path.join(outputPath, path.dirname(noRootFilePath)).replaceAll(' ', '_'),
      );

      //Add to the array routesList to generate <a> in index.html
      routesList.push({
        url: (/^\\|\//.test(
          createdFileName.replace(path.normalize(outputPath), '')[0],
        )
          ? createdFileName.replace(path.normalize(outputPath), '').substr(1)
          : createdFileName.replace(path.normalize(outputPath), '')).replaceAll('\\', '/'),
        name: path.basename(createdFileName, '.html'),
      });
    }
    await createIndexHtmlFile(routesList, stylesheet, outputPath);
  }
  };

  const treatData = (data) => {
    let dataTreated = { title: '', content: '' };
    //convert data into an array
    data = data.split('\n').map((sentence) => sentence.replace('\r', ''));

    if (data.length >= 3) {
      //Check if title exist
      if (data[0] && !data[1] && !data[2]) {
        dataTreated.title = data[0];
        data = data.slice(3);
      }
  }

  //Remove empty array and combine sentence together
  data.forEach((phrase, i) => {
    data[i] = data[i] + ' ';
    if (!phrase) data[i] = '_space_';
  });
  data = data.join('').split('_space_');
  dataTreated.content = data;

  return dataTreated;
  };

  //commander code
  program.parse(process.argv);
  //console.log(`argv 0 ${process.argv[0]} \n argv 1  ${process.argv[1]} \n argv 2  ${process.argv[2]} \n argv 3  ${process.argv[3]} \n outputFolder  \n\n`);
  const options = program.opts()
  if(options.version){
    console.log(verMsg);
    //exit
    process.exit(1);
  } else if (options.help) {
    console.log(msgHelp);
    //exit
    process.exit(1);
  } else {
    //yargs
    //check if input is file or folder and if it exists
    //files
    let files = [];
    function checkInput(input) {
      if (fs.existsSync(input)) {
        if(/\w+.txt/.test(input)){ // ends in .txt which means its a file
          if(fs.lstatSync(input).isFile){
            if (path.extname(input) === '.txt'){
              isFile = true;
              return true
            }else{
              throw new Error("File must be a .txt file");
            }
          }
          
        }else if (fs.statSync(input).isDirectory() == true){
          const checkTxtFile = (folderpath) =>{
            const dirContents = fs.readdirSync(dirpath);
            for (const contents of dirContents){
              const dirContentLstat = fs.lstatSync(
                path.join(dirpath, contents),
              )

              if (dirContentLstat.isDirectory()){
                if(checkTextFile(path.join(dirpath, content))){
                  return true;
                }
              } else {
                if (path.extname(content) === '.txt'){
                  return true;
                }
              }
            }
            return false;
          };
          files = fs.readdirSync(input);
        }else{
            throw new Error("Invalid folder or file");  
        }
        console.log(`Read folder -> ${input}`);
        return true;
      } else {
        throw new error("input does not exist");
        return false;
      }
    }
    test = checkInput(options.input);
    if ( test == true){
      //do the magic of converting txt to html
      console.log(`  running >>>`);
      convertToHtml( process.argv[3], options.stylesheet, outputFolder, isFile);
    }else { //no input given
      throw new error(chalk.red("No .txt files"));
      process.resume();
      process.exit(0);
    }
}
