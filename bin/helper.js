/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");

const generateHTML = require("../generateHtmlTemplate");
const inputCheck = require("./inputCheck");
const chalk = require("chalk");
//important variables
let outputFolder = "./dist";

//error codes
const errorCode1 = chalk.red.bold("No supported file or folder!");
const errorCode2 = chalk.red.bold("File type is not supported!");
const errorCode3 = chalk.red.bold("Unable to create folder!");
const errorCode4 = chalk.red.bold("Invalid file or folder!");
const errorCode6 = chalk.red.bold("Read file Error!");
const errorCode7 = chalk.red.bold("Processing Error!");
const errorCode8 = chalk.red.bold("Generate HTML file Error!");
const errorCode9 = chalk.red.bold("File is not supported!");

//Lab 5 - refactor with function
function displayError(error, code, codeNum) {
  if (error) {
    console.log(code);
    throw new Error(error);
  }
}

// createHTML
async function createHtmlFile(basename, data, stylesheet = "", outputPath) {
  const fileName = basename.split(".")[0];
  let dataTreated = { title: "", content: "" };

  if (path.extname(basename) === ".md") {
    dataTreated = treatMarkdownData(data);
  } else if (path.extname(basename) === ".txt") {
    dataTreated = treatData(data);
  }
  let htmlOption = {
    ...dataTreated,
    style: stylesheet,
    fileExtname: path.extname(basename),
  };
  const underscoreFileName = fileName.replaceAll(" ", "_");
  const htmlFileName = `${underscoreFileName}.html`;
  const htmlFilePath = path.join(outputPath, htmlFileName);
  const html = generateHTML(htmlOption);
  try {
    await fs.promise.writeFile(htmlFilePath, html);
  } catch (err) {
    displayError(err, errorCode3, 3);
  }
  console.log(`${htmlFileName} -> created!`);
  return htmlFilePath;
  //console.log(`File created -> ${path.join(`${underscoreFileName}.html`)}`);
  //return path.join(`${outputPath}`, `${underscoreFileName}.html`);
}

//createHtmlFile generateHTML file

async function CreateIndexHtmlFile(routeList, stylesheet = "", outputPath) {
  let htmlOption = {
    routeList,
    style: stylesheet,
  };

  //Create a new html file
  const htmlFileName = "index.html";
  const htmlFilePath = path.join(outputPath, htmlFileName);
  const html = generateHTML.generateIndexHtmlTemplate(htmlOption);
  try {
    await fs.promise.writeFile(htmlFilePath, html);
  } catch (err) {
    displayError(err, errorCode3, 3);
  }
  console.log(`${htmlFileName} -> created!`);
}

// get all files
async function getAllFiles(dirPath, filesPathList) {
  const files = await fs.promises.readdir(dirPath);
  filesPathList ||= [];

  for (const file of files) {
    const fileLstat = await fs.promises.lstat(path.join(dirPath, file));
    if (fileLstat.isDirectory()) {
      filesPathList = await getAllFiles(
        path.join(dirPath, file),
        filesPathList
      );
    } else {
      if (inputCheck.isFileSupported(path.extname(file)))
        filesPathList.push(path.join(dirPath, file));
    }
  }
  return filesPathList;
}

async function convertToHtml(inputPaths, stylesheet = "", outputPath, isFile) {
  let routesList = [];
  //Check if ./dist folder exist
  //Remove if exist
  if (fs.existsSync("./dist") && outputPath === "./dist") {
    await fs.promises.rm("./dist", { recursive: true });
  }
  /*
    await fs.promises.rm("./dist", { force: true, recursive: true }, (err) => {
      displayError(err, errorCode3, 3);
    });
  }
  */
  if (outputPath === "./dist")
    //Create a new folder call ./dist
    await fs.promises.mkdir("./dist", { recursive: true });

  /*
    await fs.promises.mkdir("./dist", { recursive: true }, (err) => {
      displayError(err, errorCode3, 3);
    });
    */
  if (isFile) {
    //Read file data
    const data = await fs.promises.readFile(inputPaths, "utf8");
    //const data = await readFile(inputPaths);

    //Create the html file
    let createdFileName = await createHtmlFile(
      path.basename(inputPaths),
      data,
      stylesheet,
      outputPath
    );

    //Add to the array routesList to generate <a> in index.html
    routesList.push({
      url: createdFileName
        .replaceAll(" ", "_")
        .replace(path.normalize(outputPath), "")
        .substr(1),
      name: path.basename(createdFileName.replaceAll(" ", "_"), ".html"),
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
      filePath = filePath.join("/");
      if (!listFolderPath.includes(path.dirname(filePath))) {
        listFolderPath.push(path.dirname(filePath));
      }
    }

    //Create folder
    for (let dir of listFolderPath) {
      await fs.promises.mkdir(path.join(outputPath, dir).replaceAll(" ", "_"), {
        recursive: true,
      });
    }

    for (let filePath of filesPathList) {
      //Read file data
      const data = await fs.promises.readFile(inputPaths, "utf8");

      //Remove root folder
      filePath = filePath.split(/\\|\//);
      filePath.shift();
      const noRootFilePath = filePath.join("/");

      //Create the html file
      let createdFileName = await createHtmlFile(
        path.basename(noRootFilePath),
        data,
        stylesheet,
        path.join(outputPath, path.dirname(noRootFilePath)).replaceAll(" ", "_")
      );

      //Add to the array routesList to generate <a> in index.html
      routesList.push({
        url: (/^\\|\//.test(
          createdFileName.replace(path.normalize(outputPath), "")[0]
        )
          ? createdFileName.replace(path.normalize(outputPath), "").substr(1)
          : createdFileName.replace(path.normalize(outputPath), "")
        ).replaceAll("\\", "/"),
        name: path.basename(createdFileName, ".html"),
      });
    }
    await createIndexHtmlFile(routesList, stylesheet, outputPath);
  }
}

const treatMarkdownData = (data) => {
  return { title: "", content: data.split(/\r?\n/).filter((line) => line) };
};

const treatData = (data) => {
  let dataTreated = { title: "", content: "" };
  //convert data into an array
  data = data.split("\n").map((sentence) => sentence.replace("\r", ""));

  if (data.length >= 3) {
    //Check if title exist
    if (data[0] && !data[1] && !data[2]) {
      dataTreated.title = data[0];
      data = data.slice(3);
    }
  }

  //Remove empty array and combine sentence together
  data.forEach((phrase, i) => {
    data[i] = data[i] + " ";
    if (!phrase) data[i] = "_space_";
  });
  data = data.join("").split("_space_");
  dataTreated.content = data;

  return dataTreated;
};

module.exports = { convertToHtml, displayError };
