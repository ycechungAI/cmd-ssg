const fs = require("fs");
const path = require("path");
const generateHTML = require("../generateHtmlTemplate");

//important variables
const PAGE_EXTENSIONS = [".txt", ".md"];
const DEFAULT_OUTPUT = "dist";

//exit codes
const EXIT_USAGE = 2;
const EXIT_CREATE_FOLDER = 3;
const EXIT_READ_FILE = 6;
const EXIT_INDEX = 8;

// An error meant for the user: printed without a stack trace, and its
// exitCode becomes the process exit code.
class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

const isPageFile = (file) => PAGE_EXTENSIONS.includes(path.extname(file));

const isFileCheck = (input) => typeof input === "string" && isPageFile(input);

// "My notes.v2.txt" -> "My_notes.v2.html"
const outputFileName = (file) =>
  `${path.parse(file).name.replaceAll(" ", "_")}.html`;

const isInside = (child, parent) =>
  child === parent || child.startsWith(parent + path.sep);

// Path relative to the current folder, for log messages.
const displayPath = (file) => path.relative(process.cwd(), file) || file;

const treatMarkdownData = (data) => {
  return {
    title: "",
    content: data
      .toString()
      .split(/\r?\n/)
      .filter((line) => line),
  };
};

const treatData = (data) => {
  let dataTreated = { title: "", content: "" };
  //convert data into an array
  data = data
    .toString()
    .split("\n")
    .map((sentence) => sentence.replace(/\r/g, ""));

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

// Render one source file to a complete HTML page (no file system access).
const renderPage = (basename, data, stylesheet = "") => {
  const fileExtname = path.extname(basename);
  let dataTreated = { title: "", content: "" };

  if (fileExtname === ".md") {
    dataTreated = treatMarkdownData(data);
  } else if (fileExtname === ".txt") {
    dataTreated = treatData(data);
  }
  return generateHTML.generateHtmlTemplate({
    ...dataTreated,
    style: stylesheet,
    fileExtname,
  });
};

const writeHtml = async (file, html) => {
  try {
    await fs.promises.writeFile(file, html);
  } catch (err) {
    throw new CliError(
      `Unable to write ${displayPath(file)}: ${err.message}`,
      EXIT_CREATE_FOLDER
    );
  }
  console.log(`File created -> ${displayPath(file)}`);
};

// createHTML
async function createHtmlFile(basename, data, stylesheet = "", outputPath) {
  const file = path.join(outputPath, outputFileName(basename));
  await writeHtml(file, renderPage(basename, data, stylesheet));
  return file;
}

// Same as createHtmlFile but returns the HTML instead of writing it.
async function createHtmlFileTest(basename, data, stylesheet = "") {
  return renderPage(basename, data, stylesheet);
}

const createIndexHtmlFile = async (routeList, stylesheet = "", outputPath) => {
  const file = path.join(outputPath, "index.html");
  const html = generateHTML.generateHtmlMenuTemplate({
    routeList,
    style: stylesheet,
  });
  try {
    await fs.promises.writeFile(file, html);
  } catch (err) {
    throw new CliError(
      `Unable to write ${displayPath(file)}: ${err.message}`,
      EXIT_INDEX
    );
  }
  console.log(`File created -> ${displayPath(file)}`);
};

// get all files
const getAllFiles = async (dirPath, filesPathList = [], skipDir) => {
  const files = await fs.promises.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const fileLstat = await fs.promises.lstat(filePath);
    // Security: never follow symbolic links. A planted symlink such as
    // evil.txt -> /etc/passwd would otherwise be read and its contents
    // published into the generated site (arbitrary file read).
    if (fileLstat.isSymbolicLink()) {
      continue;
    }
    if (fileLstat.isDirectory()) {
      // Don't pick up our own output when it lives inside the input folder.
      if (skipDir && path.resolve(filePath) === skipDir) continue;
      await getAllFiles(filePath, filesPathList, skipDir);
    } else if (isPageFile(file)) {
      filesPathList.push(filePath);
    }
  }
  return filesPathList;
};

const prepareOutputFolder = async (out, inputAbs) => {
  // Writing (or wiping) the output folder must never touch the input.
  if (isInside(inputAbs, out)) {
    throw new CliError(
      `Output folder ${displayPath(out)} must not contain the input.`,
      EXIT_USAGE
    );
  }
  //Remove the default ./dist folder from the previous run
  if (out === path.resolve(DEFAULT_OUTPUT) && fs.existsSync(out)) {
    try {
      await fs.promises.rm(out, { force: true, recursive: true });
    } catch (err) {
      throw new CliError(
        `Unable to clean ${displayPath(out)}: ${err.message}`,
        EXIT_CREATE_FOLDER
      );
    }
  }
  try {
    await fs.promises.mkdir(out, { recursive: true });
  } catch (err) {
    throw new CliError(
      `Unable to create folder ${displayPath(out)}: ${err.message}`,
      EXIT_CREATE_FOLDER
    );
  }
};

async function convertToHtml(
  inputPath,
  stylesheet = "",
  outputPath = DEFAULT_OUTPUT,
  isFile = isFileCheck(inputPath)
) {
  const inputAbs = path.resolve(inputPath);
  const out = path.resolve(outputPath);
  const inputRoot = isFile ? path.dirname(inputAbs) : inputAbs;

  await prepareOutputFolder(out, inputAbs);

  const sources = isFile ? [inputAbs] : await getAllFiles(inputAbs, [], out);

  // Map every source to its output path relative to the output folder.
  // Sorting keeps the result (and which file wins a name clash) stable.
  const pages = sources
    .map((abs) => {
      const rel = path.relative(inputRoot, abs);
      const relDir = path.dirname(rel).replaceAll(" ", "_");
      return { abs, rel, relOut: path.join(relDir, outputFileName(abs)) };
    })
    .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));

  const claimed = new Map();
  const routesList = [];
  for (const page of pages) {
    if (claimed.has(page.relOut)) {
      console.warn(
        `Skipping ${page.rel}: output ${
          page.relOut
        } already produced by ${claimed.get(page.relOut)}`
      );
      continue;
    }
    claimed.set(page.relOut, page.rel);

    let data;
    try {
      data = await fs.promises.readFile(page.abs);
    } catch (err) {
      throw new CliError(
        `Unable to read ${page.rel}: ${err.message}`,
        EXIT_READ_FILE
      );
    }

    const file = path.join(out, page.relOut);
    try {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
    } catch (err) {
      throw new CliError(
        `Unable to create folder ${displayPath(path.dirname(file))}: ${
          err.message
        }`,
        EXIT_CREATE_FOLDER
      );
    }
    await writeHtml(
      file,
      renderPage(path.basename(page.abs), data, stylesheet)
    );

    //Add to the array routesList to generate <a> in index.html
    routesList.push({
      url: page.relOut.split(path.sep).join("/"),
      name: path.basename(page.relOut, ".html"),
    });
  }

  // A source index.txt/index.md already is the home page; don't overwrite it.
  if (claimed.has("index.html")) {
    console.log(`Using ${claimed.get("index.html")} as index page`);
  } else {
    await createIndexHtmlFile(routesList, stylesheet, out);
  }
}

function checkInput(input) {
  if (!input) {
    throw new CliError(
      "No input given. Use -i <path> or -c <config> (see ssg --help).",
      EXIT_USAGE
    );
  }
  // Check if path exist
  if (!fs.existsSync(input)) {
    throw new CliError("Directory or file must exist.", EXIT_USAGE);
  }
  const inputLstat = fs.lstatSync(input);
  // Security: refuse symbolic links as input. A symlink (e.g.
  // input.txt -> /etc/passwd) would otherwise be followed on read,
  // leaking arbitrary files into the generated site.
  if (inputLstat.isSymbolicLink()) {
    throw new CliError(
      "Symbolic links are not supported as input.",
      EXIT_USAGE
    );
  }
  if (inputLstat.isFile()) {
    if (isPageFile(input)) return true;
    throw new CliError("File must be a .txt or .md file.", EXIT_USAGE);
  }
  if (inputLstat.isDirectory()) {
    // checkValidFile recursively check if any .txt or .md file exist
    const checkValidFile = (dirPath) => {
      for (const dirContent of fs.readdirSync(dirPath)) {
        const dirContentLstat = fs.lstatSync(path.join(dirPath, dirContent));

        // Security: ignore symbolic links when validating, mirroring
        // getAllFiles which never follows them.
        if (dirContentLstat.isSymbolicLink()) {
          continue;
        }
        if (dirContentLstat.isDirectory()) {
          if (checkValidFile(path.join(dirPath, dirContent))) return true;
        } else if (isPageFile(dirContent)) {
          return true;
        }
      }
      return false;
    };

    if (!checkValidFile(input)) {
      throw new CliError(
        "Directory doesn't contain any .txt or .md file.",
        EXIT_USAGE
      );
    }
    return true;
  }
  throw new CliError("Input must be a file or a directory.", EXIT_USAGE);
}

module.exports = {
  CliError,
  DEFAULT_OUTPUT,
  EXIT_USAGE,
  PAGE_EXTENSIONS,
  isFileCheck,
  checkInput,
  convertToHtml,
  createHtmlFile,
  createHtmlFileTest,
  createIndexHtmlFile,
  renderPage,
};
