const fs = require("fs");
const path = require("path");
const generateHTML = require("../generateHtmlTemplate");
const markdown = require("../lib/parser/markdown");
const { version } = require("../package.json");

//important variables
const PAGE_EXTENSIONS = [".txt", ".md"];
const ASSET_EXTENSIONS = [".css"];
const DEFAULT_OUTPUT = "dist";
// Written into every output folder; --clean only deletes folders that have it.
const MARKER_FILE = ".cmd-ssg";
const ASSETS_DIR = "assets";

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
const isAssetFile = (file) => ASSET_EXTENSIONS.includes(path.extname(file));

const isFileCheck = (input) => typeof input === "string" && isPageFile(input);

// "My notes.v2.txt" -> "My_notes.v2.html"
const outputFileName = (file) =>
  `${path.parse(file).name.replaceAll(" ", "_")}.html`;

const isInside = (child, parent) =>
  child === parent || child.startsWith(parent + path.sep);

const toPosix = (p) => p.split(path.sep).join("/");

// "C# notes/100%.html" -> "C%23%20notes/100%25.html"
const encodeHref = (posixPath) =>
  posixPath.split("/").map(encodeURIComponent).join("/");

const isRemoteUrl = (url) => /^(https?:)?\/\//i.test(url);

// Path relative to the current folder, for log messages.
const displayPath = (file) => path.relative(process.cwd(), file) || file;

const noop = () => {};

/**
 * Split plain text into a title and paragraphs.
 * The first line is the title when it is followed by two blank lines.
 * Paragraphs are separated by blank lines; wrapped lines are joined.
 */
const parseText = (data) => {
  let lines = data.toString().replace(/\r\n?/g, "\n").split("\n");
  let title = "";
  if (
    lines.length >= 3 &&
    lines[0].trim() &&
    !lines[1].trim() &&
    !lines[2].trim()
  ) {
    title = lines[0].trim();
    lines = lines.slice(3);
  }
  const paragraphs = lines
    .join("\n")
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
        .join(" ")
    )
    .filter((paragraph) => paragraph);
  return { title, paragraphs };
};

// Render one source file (no file system access) -> { title, html }.
const buildPage = (basename, data, { style = "", lang = "en" } = {}) => {
  const fileExtname = path.extname(basename);
  const fallbackTitle = path.parse(basename).name;
  let page = { title: "", content: "", emitHeading: true };

  if (fileExtname === ".md") {
    const parsed = markdown.parseMarkdown(data.toString());
    page = {
      title: parsed.title,
      content: parsed.html,
      // Don't repeat the title when the document already opens with it.
      emitHeading: !parsed.startsWithTitle,
    };
  } else if (fileExtname === ".txt") {
    const parsed = parseText(data);
    page = {
      title: parsed.title,
      content: parsed.paragraphs,
      emitHeading: true,
    };
  }
  const title = page.title || fallbackTitle;
  return {
    title,
    html: generateHTML.generateHtmlTemplate({
      ...page,
      title,
      style,
      lang,
      fileExtname,
    }),
  };
};

const renderPage = (basename, data, stylesheet = "", lang = "en") =>
  buildPage(basename, data, { style: stylesheet, lang }).html;

const writeFile = async (file, content, log, exitCode = EXIT_CREATE_FOLDER) => {
  try {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, content);
  } catch (err) {
    throw new CliError(
      `Unable to write ${displayPath(file)}: ${err.message}`,
      exitCode
    );
  }
  log(`File created -> ${displayPath(file)}`);
};

// createHTML
async function createHtmlFile(
  basename,
  data,
  stylesheet = "",
  outputPath,
  { lang = "en", quiet = false } = {}
) {
  const file = path.join(outputPath, outputFileName(basename));
  await writeFile(
    file,
    renderPage(basename, data, stylesheet, lang),
    quiet ? noop : console.log
  );
  return file;
}

// Same as createHtmlFile but returns the HTML instead of writing it.
async function createHtmlFileTest(basename, data, stylesheet = "") {
  return renderPage(basename, data, stylesheet);
}

const createIndexHtmlFile = async (
  routeList,
  stylesheet = "",
  outputPath,
  { lang = "en", quiet = false } = {}
) => {
  const html = generateHTML.generateHtmlMenuTemplate({
    routeList,
    style: stylesheet,
    lang,
  });
  await writeFile(
    path.join(outputPath, "index.html"),
    html,
    quiet ? noop : console.log,
    EXIT_INDEX
  );
};

// get all page and asset files
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
    } else if (isPageFile(file) || isAssetFile(file)) {
      filesPathList.push(filePath);
    }
  }
  return filesPathList;
};

// -s value: a remote URL is linked as-is; a local file is copied to
// <out>/assets/ and linked relatively from every page.
const resolveStylesheet = (stylesheet) => {
  if (!stylesheet) return null;
  if (isRemoteUrl(stylesheet)) return { url: stylesheet };
  const abs = path.resolve(stylesheet);
  if (!fs.existsSync(abs) || !fs.lstatSync(abs).isFile()) {
    throw new CliError(`Stylesheet not found: ${stylesheet}`, EXIT_USAGE);
  }
  return { abs, asset: `${ASSETS_DIR}/${path.basename(abs)}` };
};

// The stylesheet href as seen from a page at relOut ("a/b.html").
const stylesheetHref = (sheet, relOut) => {
  if (!sheet) return "";
  if (sheet.url) return sheet.url;
  return encodeHref(
    path.posix.relative(path.posix.dirname(relOut), sheet.asset)
  );
};

const prepareOutputFolder = async (out, inputAbs, clean) => {
  // Writing (or cleaning) the output folder must never touch the input.
  if (isInside(inputAbs, out)) {
    throw new CliError(
      `Output folder ${displayPath(out)} must not contain the input.`,
      EXIT_USAGE
    );
  }
  if (clean && fs.existsSync(out)) {
    const entries = fs.readdirSync(out);
    // Only delete folders this tool created: never wipe someone's files.
    if (entries.length && !entries.includes(MARKER_FILE)) {
      throw new CliError(
        `Refusing to clean ${displayPath(
          out
        )}: not created by cmd-ssg (missing ${MARKER_FILE} marker)`,
        EXIT_USAGE
      );
    }
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
    await fs.promises.writeFile(
      path.join(out, MARKER_FILE),
      JSON.stringify({ version, generatedAt: new Date().toISOString() }) + "\n"
    );
  } catch (err) {
    throw new CliError(
      `Unable to create folder ${displayPath(out)}: ${err.message}`,
      EXIT_CREATE_FOLDER
    );
  }
};

const copyAsset = async (from, to, log) => {
  try {
    await fs.promises.mkdir(path.dirname(to), { recursive: true });
    await fs.promises.copyFile(from, to);
  } catch (err) {
    throw new CliError(
      `Unable to copy ${displayPath(from)}: ${err.message}`,
      EXIT_CREATE_FOLDER
    );
  }
  log(`File copied -> ${displayPath(to)}`);
};

async function convertToHtml(
  inputPath,
  stylesheet = "",
  outputPath = DEFAULT_OUTPUT,
  isFile = isFileCheck(inputPath),
  { clean = false, lang = "en", quiet = false } = {}
) {
  const log = quiet ? noop : console.log;
  const inputAbs = path.resolve(inputPath);
  const out = path.resolve(outputPath);
  const inputRoot = isFile ? path.dirname(inputAbs) : inputAbs;
  // Validate the stylesheet before touching the output folder.
  const sheet = resolveStylesheet(stylesheet);

  await prepareOutputFolder(out, inputAbs, clean);

  const sources = isFile ? [inputAbs] : await getAllFiles(inputAbs, [], out);

  // Map every source to its output path relative to the output folder.
  // Sorting keeps the result (and which file wins a name clash) stable.
  const entries = sources
    .map((abs) => {
      const rel = path.relative(inputRoot, abs);
      const relDir = path.dirname(rel).replaceAll(" ", "_");
      const isPage = isPageFile(abs);
      const outName = isPage ? outputFileName(abs) : path.basename(abs);
      return { abs, rel, isPage, relOut: toPosix(path.join(relDir, outName)) };
    })
    .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));

  const claimed = new Map();
  if (sheet && sheet.abs) {
    await copyAsset(sheet.abs, path.join(out, sheet.asset), log);
    claimed.set(sheet.asset, `the -s stylesheet ${stylesheet}`);
  }

  const routesList = [];
  for (const entry of entries) {
    if (claimed.has(entry.relOut)) {
      console.warn(
        `Skipping ${entry.rel}: output ${
          entry.relOut
        } already produced by ${claimed.get(entry.relOut)}`
      );
      continue;
    }
    claimed.set(entry.relOut, entry.rel);
    const file = path.join(out, entry.relOut);

    // Stylesheets inside the input tree are copied so pages can link them.
    if (!entry.isPage) {
      await copyAsset(entry.abs, file, log);
      continue;
    }

    let data;
    try {
      data = await fs.promises.readFile(entry.abs);
    } catch (err) {
      throw new CliError(
        `Unable to read ${entry.rel}: ${err.message}`,
        EXIT_READ_FILE
      );
    }

    const page = buildPage(path.basename(entry.abs), data, {
      style: stylesheetHref(sheet, entry.relOut),
      lang,
    });
    await writeFile(file, page.html, log);

    //Add to the array routesList to generate <a> in index.html
    const dir = path.posix.dirname(entry.relOut);
    routesList.push({
      url: encodeHref(entry.relOut),
      name: path.posix.basename(entry.relOut, ".html"),
      title: page.title,
      dir: dir === "." ? "" : dir,
    });
  }

  // A source index.txt/index.md already is the home page; don't overwrite it.
  if (claimed.has("index.html")) {
    log(`Using ${claimed.get("index.html")} as index page`);
  } else {
    await createIndexHtmlFile(
      routesList,
      stylesheetHref(sheet, "index.html"),
      out,
      { lang, quiet }
    );
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
  MARKER_FILE,
  PAGE_EXTENSIONS,
  isFileCheck,
  checkInput,
  convertToHtml,
  createHtmlFile,
  createHtmlFileTest,
  createIndexHtmlFile,
  parseText,
  renderPage,
};
