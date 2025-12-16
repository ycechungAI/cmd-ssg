/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const fs = require("fs");
const util = require("util");
const path = require("path");
const generateHTML = require("../generateHtmlTemplate");
const chalk = require("chalk");
//important variables
const supportedExtensions = [".txt", ".md", ".css"];
let outputFolder = "./dist";
let isFile;
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
const displayError = (error, code, codeNum) => {
  if (error) {
    console.log(code);
    process.exitCode = codeNum;
    throw new Error(error);
  }
};

const isFileSupported = (extension) => {
  return supportedExtensions.includes(extension);
};

const isFileCheck = (input) => {
  const extname = path.extname(input);
  if (extname === ".txt" || extname === ".md" || extname === ".css") {
    return true;
  }
  //if it is a folder return false
  return false;
};

// readFile
const readFile = util.promisify(fs.readFile);
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
  try {
    await fs.promises.writeFile(
      path.join(`${outputPath}`, `${underscoreFileName}.html`),
      generateHTML.generateHtmlTemplate(htmlOption)
    );
  } catch (err) {
    displayError(err, errorCode3, 3);
  }

  console.log(
    `File created -> ${path.join(
      `${outputPath}`,
      `${underscoreFileName}.html`
    )}`
  );
  return path.join(`${outputPath}`, `${underscoreFileName}.html`);
}

async function createHtmlFileTest(basename, data, stylesheet = "", outputPath) {
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
  //const underscoreFileName = fileName.replaceAll(" ", "_");

  //dont actually write the file.

  return generateHTML.generateHtmlTemplate(htmlOption);
}

//createHtmlFile generateHTML file

const createIndexHtmlFile = async (routeList, stylesheet = "", outputPath) => {
  let htmlOption = {
    routeList,
    style: stylesheet,
  };

  //Create a new html file
  try {
    await fs.promises.writeFile(
      path.join(`${outputPath}`, "index.html"),
      generateHTML.generateHtmlMenuTemplate(htmlOption)
    );
  } catch (err) {
    displayError(err, errorCode8, 8);
  }
  console.log(`File created -> ${path.join(`${outputPath}`, "index.html")}`);
};

// get all files
const getAllFiles = async (dirPath, filesPathList) => {
  const files = await fs.promises.readdir(dirPath);

  //filePathList ||= [];  //x || (x = y); - need support for node 14 and below
  filePathList = filesPathList || (filePathList = []);

  for (const file of files) {
    const fileLstat = await fs.promises.lstat(path.join(dirPath, file));
    if (fileLstat.isDirectory()) {
      filesPathList = await getAllFiles(
        path.join(dirPath, file),
        filesPathList
      );
    } else {
      if (isFileSupported(path.extname(file)))
        filesPathList.push(path.join(dirPath, file));
    }
  }
  return filesPathList;
};

async function convertToHtml(inputPaths, stylesheet = "", outputPath, isFile) {
  let routesList = [];
  //Check if ./dist folder exist
  //Remove if exist
  if (fs.existsSync("./dist") && outputPath === "./dist") {
    try {
      await fs.promises.rm("./dist", { force: true, recursive: true });
    } catch (err) {
      displayError(err, errorCode3, 3);
    }
  }
  if (outputPath === "./dist")
    //Create a new folder call ./dist
    try {
      await fs.promises.mkdir("./dist", { recursive: true });
    } catch (err) {
      displayError(err, errorCode3, 3);
    }

  if (isFile) {
    //Read file data
    const data = await readFile(inputPaths);

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
      try {
        await fs.promises.mkdir(
          path.join(outputPath, dir).replaceAll(" ", "_"),
          { recursive: true }
        );
      } catch (err) {
        displayError(err, errorCode7, 7);
      }
    }

    for (let filePath of filesPathList) {
      //Read file data
      const data = await readFile(filePath);

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
  data = data.split("\n").map((sentence) => sentence.replace(/\r/g, ""));

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

module.exports = {
  isFileCheck,
  checkInput,
  convertToHtml,
  displayError,
  createHtmlFile,
  createHtmlFileTest,
  createIndexHtmlFile,
};
