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

// All files under tmp/<rel>, as sorted "/"-separated relative paths
// (without the .cmd-ssg marker, which has its own tests).
const tree = (rel) => {
  const root = path.join(tmp, rel);
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const p = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(p) : [path.relative(root, p)];
    });
  return walk(root)
    .map((p) => p.split(path.sep).join("/"))
    .filter((p) => p !== ".cmd-ssg")
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
    expect(run("-i", "docs", "-o", "dist").code).toBe(0);
    const first = tree("dist");
    expect(run("-i", "docs", "-o", "./dist").code).toBe(0);
    expect(tree("dist")).toEqual(first);
    expect(run("-i", "docs").code).toBe(0);
    expect(tree("dist")).toEqual(first);
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

  it(".css files are copied, not turned into pages", () => {
    write("docs/one.txt");
    write("docs/sub dir/style.css", "body {}");
    run("-i", "docs", "-o", "out");
    expect(tree("out")).toEqual([
      "index.html",
      "one.html",
      "sub_dir/style.css",
    ]);
    expect(read("out/sub_dir/style.css")).toBe("body {}");
    expect(read("out/index.html").match(/<li>/g)).toHaveLength(1);
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
    write("s.css", "body {}");
    write(
      "ssg.json",
      JSON.stringify({ input: "docs", output: "site", stylesheet: "s.css" })
    );
    expect(run("-c", "ssg.json").code).toBe(0);
    expect(read("site/one.html")).toContain('href="assets/s.css"');
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

describe("--clean", () => {
  it("without --clean nothing is deleted, even in the default dist", () => {
    write("docs/one.txt");
    write("dist/keep.txt", "mine");
    write("out/keep.txt", "mine");
    expect(run("-i", "docs").code).toBe(0);
    expect(run("-i", "docs", "-o", "out").code).toBe(0);
    expect(read("dist/keep.txt")).toBe("mine");
    expect(read("out/keep.txt")).toBe("mine");
  });

  it("writes a .cmd-ssg marker into the output folder", () => {
    write("docs/one.txt");
    run("-i", "docs", "-o", "out");
    const marker = JSON.parse(read("out/.cmd-ssg"));
    expect(marker.version).toBe(version);
    expect(Date.parse(marker.generatedAt)).not.toBeNaN();
  });

  it("refuses a folder without the marker and leaves it untouched", () => {
    write("docs/one.txt");
    write("out/precious.txt", "mine");
    const { code, stderr } = run("-i", "docs", "-o", "out", "--clean");
    expect(code).toBe(2);
    expect(stderr).toContain("Refusing to clean out");
    expect(tree("out")).toEqual(["precious.txt"]);
  });

  it("empties a folder created by an earlier build", () => {
    write("docs/one.txt");
    write("docs/two.txt");
    run("-i", "docs", "-o", "out");
    fs.rmSync(path.join(tmp, "docs/two.txt"));
    const { code } = run("-i", "docs", "-o", "out", "--clean");
    expect(code).toBe(0);
    expect(tree("out")).toEqual(["index.html", "one.html"]);
    expect(exists("out/.cmd-ssg")).toBe(true);
  });

  it("accepts an empty existing folder", () => {
    write("docs/one.txt");
    fs.mkdirSync(path.join(tmp, "out"));
    expect(run("-i", "docs", "-o", "out", "--clean").code).toBe(0);
  });

  it("can be set in the config file", () => {
    write("docs/one.txt");
    write("out/precious.txt", "mine");
    write(
      "ssg.json",
      JSON.stringify({ input: "docs", output: "out", clean: true })
    );
    expect(run("-c", "ssg.json").code).toBe(2);
    expect(read("out/precious.txt")).toBe("mine");
  });

  it("non-boolean clean in config: exit 2", () => {
    write("ssg.json", JSON.stringify({ input: "docs", clean: "yes" }));
    const { code, stderr } = run("-c", "ssg.json");
    expect(code).toBe(2);
    expect(stderr).toContain('Config "clean" must be a boolean');
  });
});

describe("local stylesheet", () => {
  it("is copied to assets/ and linked relatively at every depth", () => {
    write("docs/zero.txt");
    write("docs/a/one.txt");
    write("docs/a/b/two.txt");
    write("theme/my style.css", "body {}");
    const { code } = run("-i", "docs", "-o", "out", "-s", "theme/my style.css");
    expect(code).toBe(0);
    expect(read("out/assets/my style.css")).toBe("body {}");
    expect(read("out/index.html")).toContain('href="assets/my%20style.css"');
    expect(read("out/zero.html")).toContain('href="assets/my%20style.css"');
    expect(read("out/a/one.html")).toContain('href="../assets/my%20style.css"');
    expect(read("out/a/b/two.html")).toContain(
      'href="../../assets/my%20style.css"'
    );
  });

  it("missing stylesheet: exit 2 before anything is written", () => {
    write("docs/one.txt");
    const { code, stderr } = run("-i", "docs", "-o", "out", "-s", "nope.css");
    expect(code).toBe(2);
    expect(stderr).toContain("Stylesheet not found: nope.css");
    expect(exists("out")).toBe(false);
  });

  it("a page can't overwrite the copied stylesheet", () => {
    write("docs/one.txt");
    write("docs/assets/s.css", "from tree");
    write("s.css", "from -s");
    const { stderr } = run("-i", "docs", "-o", "out", "-s", "s.css");
    expect(stderr).toContain("Skipping assets/s.css");
    expect(read("out/assets/s.css")).toBe("from -s");
  });
});

describe("links", () => {
  it("index hrefs are URL-encoded", () => {
    write("docs/C# 100%.md", "# Sharp");
    write("docs/sub/a&b.txt");
    const { code } = run("-i", "docs", "-o", "out");
    expect(code).toBe(0);
    expect(tree("out")).toEqual(["C#_100%.html", "index.html", "sub/a&b.html"]);
    const index = read("out/index.html");
    expect(index).toContain("href='C%23_100%25.html'");
    expect(index).toContain("href='sub/a%26b.html'");
  });

  it("index is sorted, labelled with titles and grouped by folder", () => {
    write("docs/b.md", "# Bravo");
    write("docs/a.txt", "Alpha title\n\n\nbody");
    write("docs/sub/c.txt", "no title here");
    const index = read((run("-i", "docs", "-o", "out"), "out/index.html"));
    const text = index.replace(/\s+/g, " ");
    expect(text).toContain(
      "<li><a href='a.html'>Alpha title</a></li> <li><a href='b.html'>Bravo</a></li> <li>sub <ul> <li><a href='sub/c.html'>c</a></li> </ul> </li>"
    );
  });
});

describe("rendering", () => {
  it("Markdown is rendered as a whole document", () => {
    write(
      "docs/page.md",
      "# Hello *World*\n\n```js\nconst a = 1;\n\nconst b = 2;\n```\n\n- one\n- two\n  continued\n\n| a | b |\n|---|---|\n| 1 | 2 |\n"
    );
    run("-i", "docs", "-o", "out");
    const html = read("out/page.html");
    expect(html).toContain("<title>Hello World</title>");
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).toContain(
      '<pre><code class="language-js">const a = 1;\n\nconst b = 2;\n</code></pre>'
    );
    expect(html).toContain("<li>two\ncontinued</li>");
    expect(html).toContain("<td>1</td>");
    expect(html).not.toMatch(/<p>\s*<h1>/);
  });

  it("Markdown without a heading is titled after the file", () => {
    write("docs/notes.md", "just text");
    run("-i", "docs", "-o", "out");
    expect(read("out/notes.html")).toContain("<title>notes</title>");
    expect(read("out/notes.html")).toContain("<h1>notes</h1>");
  });

  it("raw HTML in Markdown is escaped", () => {
    write(
      "docs/x.md",
      "<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>"
    );
    run("-i", "docs", "-o", "out");
    const html = read("out/x.html");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });

  it("text keeps _space_ and drops empty paragraphs", () => {
    // Line 2 isn't blank, so line 1 is not a title.
    write("docs/t.txt", "one _space_ two\nnext\n\n\n\n\nthree");
    run("-i", "docs", "-o", "out");
    const html = read("out/t.html");
    expect(html).toContain("<p>one _space_ two next</p>");
    expect(html).toContain("<p>three</p>");
    expect(html).not.toContain("<p></p>");
  });

  it("output starts with the doctype", () => {
    write("docs/t.txt");
    run("-i", "docs", "-o", "out");
    expect(read("out/t.html").startsWith("<!doctype html>")).toBe(true);
    expect(read("out/index.html").startsWith("<!doctype html>")).toBe(true);
  });
});

describe("--lang and --quiet", () => {
  it("--lang sets the page language", () => {
    write("docs/t.txt");
    run("-i", "docs", "-o", "out", "--lang", "fr-CA");
    expect(read("out/t.html")).toContain('<html lang="fr-CA">');
    expect(read("out/index.html")).toContain('<html lang="fr-CA">');
  });

  it("defaults to en", () => {
    write("docs/t.txt");
    run("-i", "docs", "-o", "out");
    expect(read("out/t.html")).toContain('<html lang="en">');
  });

  it("rejects an invalid language code", () => {
    write("docs/t.txt");
    const { code, stderr } = run("-i", "docs", "-o", "out", "--lang", '"><x');
    expect(code).toBe(2);
    expect(stderr).toContain("Invalid language code");
    expect(exists("out")).toBe(false);
  });

  it("lang can be set in the config file", () => {
    write("docs/t.txt");
    write(
      "ssg.json",
      JSON.stringify({ input: "docs", output: "out", lang: "de" })
    );
    run("-c", "ssg.json");
    expect(read("out/t.html")).toContain('<html lang="de">');
  });

  it("--quiet prints nothing on success but still warns", () => {
    write("docs/a.md");
    write("docs/a.txt");
    const { code, stdout, stderr } = run("-i", "docs", "-o", "out", "-q");
    expect(code).toBe(0);
    expect(stdout).toBe("");
    expect(stderr).toContain("Skipping a.txt");
  });
});
