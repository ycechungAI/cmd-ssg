const fs = require("fs");
const { CliError, EXIT_USAGE } = require("./helper");

// The output folder may be missing (it is created when converting), but an
// existing path must be a directory.
const outputCheck = (folder) => {
  if (fs.existsSync(folder) && !fs.lstatSync(folder).isDirectory()) {
    throw new CliError(
      `Output path must be a directory: ${folder}`,
      EXIT_USAGE
    );
  }
  return true;
};

module.exports = { outputCheck };
