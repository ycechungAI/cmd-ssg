const fs = require("fs");
const chalk = require("chalk");
const errorCode10 = chalk.red.bold("Output folder is not supported!");

const outputCheck = (folder) => {
  if (folder !== "./dist") {
    // Check if it is a directory and exit
    if (fs.existsSync(folder)) {
      if (fs.lstatSync(folder).isDirectory()) return true;
      throw new Error("Path must be a directory.");
    } else console.log(errorCode10);
  } else return true;
};

module.exports = { outputCheck };
