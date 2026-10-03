#!/usr/bin/env node
const fs = require("fs");
const chalk = require("chalk");
const figlet = require("figlet");
const { Command } = require("commander");

const { version } = require("../package.json");
const helper = require("./helper");
const { outputCheck } = require("./outputCheck");
const { CliError, DEFAULT_OUTPUT, EXIT_USAGE } = helper;

// Options settable from the config file, with their JSON type.
const CONFIG_TYPES = {
  input: "string",
  output: "string",
  stylesheet: "string",
  lang: "string",
  clean: "boolean",
};
const OPTION_KEYS = [...Object.keys(CONFIG_TYPES), "quiet"];

// BCP 47-like language tag, e.g. "en", "fr-CA", "zh-Hant".
const LANG_PATTERN = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

const createProgram = () =>
  new Command()
    .name("ssg")
    .description("Convert .txt and .md files into static HTML pages.")
    .version(version, "-v, --version", "print the version")
    .helpOption("-h, --help", "show this help")
    .option("-i, --input <path>", "input .txt/.md file or folder")
    .option(
      "-o, --output <folder>",
      `output folder (default: ${DEFAULT_OUTPUT})`,
    )
    .option(
      "-s, --stylesheet <file-or-url>",
      "stylesheet: a local file (copied to assets/) or an http(s) URL",
    )
    .option(
      "-c, --config <file>",
      "JSON file with input, output, stylesheet, lang and clean (CLI flags win)",
    )
    .option("--lang <code>", "language of the pages (default: en)")
    .option(
      "--clean",
      "empty the output folder first (only if cmd-ssg created it)",
    )
    .option("-q, --quiet", "only print warnings and errors")
    .addHelpText("beforeAll", () =>
      chalk.yellow(figlet.textSync("cmd-ssg", { horizontalLayout: "full" })),
    );

// Read options from a JSON config file. The file is parsed
// as data, never require()d, so it cannot execute code.
const loadConfig = (configPath) => {
  let raw;
  try {
    raw = fs.readFileSync(configPath, "utf8");
  } catch (err) {
    throw new CliError(
      err.code === "ENOENT"
        ? `Config file not found: ${configPath}`
        : `Unable to read config file ${configPath}: ${err.message}`,
      EXIT_USAGE,
    );
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    throw new CliError(
      `Config file is not valid JSON: ${configPath} (${err.message})`,
      EXIT_USAGE,
    );
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new CliError(
      `Config file must contain a JSON object: ${configPath}`,
      EXIT_USAGE,
    );
  }

  const options = {};
  for (const [key, type] of Object.entries(CONFIG_TYPES)) {
    if (config[key] === undefined) continue;
    if (typeof config[key] !== type) {
      throw new CliError(
        `Config "${key}" must be a ${type}: ${configPath}`,
        EXIT_USAGE,
      );
    }
    options[key] = config[key];
  }
  return options;
};

const definedOptions = (flags) =>
  Object.fromEntries(
    OPTION_KEYS.filter((key) => flags[key] !== undefined).map((key) => [
      key,
      flags[key],
    ]),
  );

async function main(argv) {
  const flags = createProgram().parse(argv).opts();
  const config = flags.config ? loadConfig(flags.config) : {};
  // Precedence: CLI flags, then config file, then defaults.
  const options = {
    output: DEFAULT_OUTPUT,
    stylesheet: "",
    lang: "en",
    clean: false,
    quiet: false,
    ...config,
    ...definedOptions(flags),
  };

  if (!LANG_PATTERN.test(options.lang)) {
    throw new CliError(
      `Invalid language code: ${options.lang} (expected e.g. en or fr-CA)`,
      EXIT_USAGE,
    );
  }
  helper.checkInput(options.input);
  outputCheck(options.output);

  if (!options.quiet) console.log("  running >>>");
  await helper.convertToHtml(
    options.input,
    options.stylesheet,
    options.output,
    fs.lstatSync(options.input).isFile(),
    { clean: options.clean, lang: options.lang, quiet: options.quiet },
  );
}

main(process.argv).catch((err) => {
  console.error(chalk.red.bold(err.message));
  process.exitCode = err instanceof CliError ? err.exitCode : 1;
});
