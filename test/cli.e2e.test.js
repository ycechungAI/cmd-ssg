// End-to-end tests: run the real CLI in a temporary folder and check the exit
// code, the messages and the generated files. Nothing is written to the repo.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { version } = require("../package.json");

const CLI = path.join(__dirname, "..", "bin", "index.js");

let tmp;
beforeEach(() => {
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ssg-e2e-")));
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

const run = (...args) => {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: tmp,
    encoding: "utf8",
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
};

// write("a/b.txt", "text") creates tmp/a/b.txt (and its folders)
const write = (rel, content = "text") => {
  const file = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const exists = (rel) => fs.existsSync(path.join(tmp, rel));
const read = (rel) => fs.readFileSync(path.join(tmp, rel), "utf8");

// All files under tmp/<rel>, as sorted "/"-separated relative paths.
const tree = (rel) => {
  const root = path.join(tmp, rel);
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const p = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(p) : [path.relative(root, p)];
    });
  return walk(root)
    .map((p) => p.split(path.sep).join("/"))
    .sort();
};

describe("CLI basics", () => {
  it("no arguments: friendly error, exit 2, no stack trace", () => {
    const { code, stderr } = run();
    expect(code).toBe(2);
    expect(stderr).toContain("No input given");
    expect(stderr).not.toMatch(/\bat .*\.js:\d+/);
  });

  it("-v and --version print the package version", () => {
    expect(run("-v").stdout.trim()).toBe(version);
    expect(run("--version").stdout.trim()).toBe(version);
  });

  it("-h lists every option", () => {
    const { code, stdout } = run("-h");
    expect(code).toBe(0);
    for (const flag of ["-i,", "-o,", "-s,", "-c,", "-v,", "-h,"]) {
      expect(stdout).toContain(flag);
    }
    expect(stdout).not.toContain("cmd-svg");
  });

  it("does not clear the terminal", () => {
    write("a.txt");
    const { stdout } = run("-i", "a.txt");
    expect(stdout).not.toContain("\x1b[2J");
    expect(stdout).not.toContain("\x1bc");
  });

  it("missing input: exit 2", () => {
    const { code, stderr } = run("-i", "missing.txt");
    expect(code).toBe(2);
    expect(stderr).toContain("Directory or file must exist.");
  });
});

describe("output paths", () => {
  it("nested input keeps only the tree below the input folder", () => {
    write("a/b/docs/one.txt");
    write("a/b/docs/sub/two.md", "# two");
    const { code } = run("-i", "a/b/docs", "-o", "out");
    expect(code).toBe(0);
    expect(tree("out")).toEqual(["index.html", "one.html", "sub/two.html"]);
  });

  it("absolute input gives the same layout as relative input", () => {
    write("docs/one.txt");
    write("docs/sub/two.txt");
    const { code } = run("-i", path.join(tmp, "docs"), "-o", "out");
    expect(code).toBe(0);
    expect(tree("out")).toEqual(["index.html", "one.html", "sub/two.html"]);
  });

  it("index links point at the generated pages", () => {
    write("docs/sub dir/two words.txt");
    run("-i", "docs", "-o", "out");
    expect(tree("out")).toContain("sub_dir/two_words.html");
    expect(read("out/index.html")).toContain("href='sub_dir/two_words.html'");
  });

  it("single file input", () => {
    write("notes/My File.txt");
    const { code } = run("-i", "notes/My File.txt", "-o", "out");
    expect(code).toBe(0);
    expect(tree("out")).toEqual(["My_File.html", "index.html"]);
    expect(read("out/index.html")).toContain("href='My_File.html'");
  });

  it("creates a missing output folder", () => {
    write("docs/one.txt");
    const { code } = run("-i", "docs", "-o", "new/dir");
    expect(code).toBe(0);
    expect(tree("new/dir")).toEqual(["index.html", "one.html"]);
  });

  it("output that is a file: exit 2", () => {
    write("docs/one.txt");
    write("file.txt");
    const { code, stderr } = run("-i", "docs", "-o", "file.txt");
    expect(code).toBe(2);
    expect(stderr).toContain("Output path must be a directory");
  });

  it("output folder containing the input: refused, input untouched", () => {
    write("docs/one.txt");
    const { code, stderr } = run("-i", "docs", "-o", ".");
    expect(code).toBe(2);
    expect(stderr).toContain("must not contain the input");
    expect(exists("docs/one.txt")).toBe(true);
  });

  it("default dist containing the input is never wiped", () => {
    write("dist/one.txt", "keep me");
    const { code } = run("-i", "dist/one.txt");
    expect(code).toBe(2);
    expect(read("dist/one.txt")).toBe("keep me");
  });

  it("output inside the input folder is not read back as input", () => {
    write("docs/one.txt");
    write("docs/out/stale.txt");
    const { code } = run("-i", "docs", "-o", "docs/out");
    expect(code).toBe(0);
    expect(read("docs/out/index.html")).not.toContain("stale");
  });

  it('"dist" and "./dist" behave the same', () => {
    write("docs/one.txt");
    write("dist/old.html");
    expect(run("-i", "docs", "-o", "dist").code).toBe(0);
    expect(tree("dist")).toEqual(["index.html", "one.html"]);
    write("dist/old.html");
    expect(run("-i", "docs", "-o", "./dist").code).toBe(0);
    expect(tree("dist")).toEqual(["index.html", "one.html"]);
  });
});

describe("file names", () => {
  it("keeps dots in file names", () => {
    write("docs/v1.2.notes.txt");
    run("-i", "docs", "-o", "out");
    expect(tree("out")).toEqual(["index.html", "v1.2.notes.html"]);
  });

  it("a.txt and a.md: first in sort order wins, with a warning", () => {
    write("docs/a.md", "# from md");
    write("docs/a.txt", "from txt");
    const { code, stderr } = run("-i", "docs", "-o", "out");
    expect(code).toBe(0);
    expect(stderr).toContain("Skipping a.txt");
    expect(read("out/a.html")).toContain("from md");
    expect(read("out/index.html").match(/<li>/g)).toHaveLength(1);
  });

  it("source index.md becomes the home page", () => {
    write("docs/index.md", "# Welcome home");
    write("docs/other.txt");
    const { code, stdout } = run("-i", "docs", "-o", "out");
    expect(code).toBe(0);
    expect(stdout).toContain("as index page");
    expect(read("out/index.html")).toContain("Welcome home");
  });

  it(".css files are not turned into pages", () => {
    write("docs/one.txt");
    write("docs/style.css", "body {}");
    run("-i", "docs", "-o", "out");
    expect(tree("out")).toEqual(["index.html", "one.html"]);
  });

  it("folder with only .css files: exit 2", () => {
    write("docs/style.css", "body {}");
    expect(run("-i", "docs", "-o", "out").code).toBe(2);
  });
});

describe("stylesheet", () => {
  it("no -s: no stylesheet link", () => {
    write("docs/one.txt");
    run("-i", "docs", "-o", "out");
    expect(read("out/one.html")).not.toContain("<link");
    expect(read("out/index.html")).not.toContain("<link");
  });

  it("-s: linked from pages and index", () => {
    write("docs/one.txt");
    run("-i", "docs", "-o", "out", "-s", "https://example.com/a.css");
    expect(read("out/one.html")).toContain('href="https://example.com/a.css"');
    expect(read("out/index.html")).toContain(
      'href="https://example.com/a.css"'
    );
  });
});

describe("config file", () => {
  it("reads input, output and stylesheet", () => {
    write("docs/one.txt");
    write(
      "ssg.json",
      JSON.stringify({ input: "docs", output: "site", stylesheet: "s.css" })
    );
    expect(run("-c", "ssg.json").code).toBe(0);
    expect(read("site/one.html")).toContain('href="s.css"');
  });

  it("CLI flags win over the config file", () => {
    write("docs/one.txt");
    write("other/two.txt");
    write("ssg.json", JSON.stringify({ input: "docs", output: "site" }));
    expect(run("-c", "ssg.json", "-i", "other").code).toBe(0);
    expect(tree("site")).toEqual(["index.html", "two.html"]);
  });

  it("config without input: friendly error, exit 2", () => {
    write("ssg.json", JSON.stringify({ output: "site" }));
    const { code, stderr } = run("-c", "ssg.json");
    expect(code).toBe(2);
    expect(stderr).toContain("No input given");
  });

  it("missing config file: exit 2", () => {
    const { code, stderr } = run("-c", "nope.json");
    expect(code).toBe(2);
    expect(stderr).toContain("Config file not found: nope.json");
  });

  it("invalid JSON: exit 2", () => {
    write("bad.json", "{ input: ");
    const { code, stderr } = run("-c", "bad.json");
    expect(code).toBe(2);
    expect(stderr).toContain("Config file is not valid JSON: bad.json");
    expect(stderr).not.toMatch(/\bat .*\.js:\d+/);
  });

  it("non-string option: exit 2", () => {
    write("ssg.json", JSON.stringify({ input: 42 }));
    const { code, stderr } = run("-c", "ssg.json");
    expect(code).toBe(2);
    expect(stderr).toContain('Config "input" must be a string');
  });

  it("config file is parsed as data, never executed", () => {
    write("evil.js", "require('fs').writeFileSync('pwned', 'x');");
    const { code } = run("-c", "evil.js");
    expect(code).toBe(2);
    expect(exists("pwned")).toBe(false);
  });
});
