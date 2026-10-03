// In-process tests for convertToHtml/checkInput (the e2e suite covers the
// same flows through the CLI, but in child processes Jest can't measure).
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  checkInput,
  convertToHtml,
  createHtmlFile,
  CliError,
  MARKER_FILE,
} = require("../bin/helper");

let tmp;
beforeEach(() => {
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ssg-conv-")));
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const p = (rel) => path.join(tmp, rel);
const write = (rel, content = "text") => {
  fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
  fs.writeFileSync(p(rel), content);
};
const read = (rel) => fs.readFileSync(p(rel), "utf8");
const exitCodeOf = async (promise) => {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(CliError);
    return err.exitCode;
  }
  throw new Error("expected a CliError");
};

describe("convertToHtml", () => {
  it("builds pages, copies tree stylesheets and writes the index", async () => {
    write("in/a.txt", "A\n\n\nbody");
    write("in/sub/b.md", "# B");
    write("in/sub/s.css", "body {}");
    await convertToHtml(p("in"), "", p("out"), false);
    expect(read("out/a.html")).toContain("<title>A</title>");
    expect(read("out/sub/b.html")).toContain("<h1>B</h1>");
    expect(read("out/sub/s.css")).toBe("body {}");
    expect(read("out/index.html")).toContain("href='sub/b.html'");
    expect(fs.existsSync(p(`out/${MARKER_FILE}`))).toBe(true);
  });

  it("converts a single file", async () => {
    write("in/only.md", "# Only");
    await convertToHtml(p("in/only.md"), "", p("out"));
    expect(fs.readdirSync(p("out")).sort()).toEqual([
      MARKER_FILE,
      "index.html",
      "only.html",
    ]);
  });

  it("links a local stylesheet relatively and a remote one as-is", async () => {
    write("in/sub/a.txt");
    write("s.css", "x");
    await convertToHtml(p("in"), p("s.css"), p("out"), false);
    expect(read("out/sub/a.html")).toContain('href="../assets/s.css"');
    expect(read("out/assets/s.css")).toBe("x");

    await convertToHtml(p("in"), "//cdn.example/s.css", p("out2"), false);
    expect(read("out2/sub/a.html")).toContain('href="//cdn.example/s.css"');
  });

  it("rejects a missing or non-file stylesheet", async () => {
    write("in/a.txt");
    expect(
      await exitCodeOf(convertToHtml(p("in"), p("nope.css"), p("out"), false)),
    ).toBe(2);
    expect(
      await exitCodeOf(convertToHtml(p("in"), p("in"), p("out"), false)),
    ).toBe(2);
    expect(fs.existsSync(p("out"))).toBe(false);
  });

  it("skips name clashes with a warning", async () => {
    write("in/a.md", "# md");
    write("in/a.txt", "txt");
    await convertToHtml(p("in"), "", p("out"), false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipping a.txt"),
    );
    expect(read("out/a.html")).toContain("md");
  });

  it("uses a source index page instead of generating one", async () => {
    write("in/index.txt", "Home\n\n\nwelcome");
    await convertToHtml(p("in"), "", p("out"), false);
    expect(read("out/index.html")).toContain("welcome");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("as index page"),
    );
  });

  it("quiet mode logs nothing", async () => {
    write("in/a.txt");
    await convertToHtml(p("in"), "", p("out"), false, { quiet: true });
    expect(console.log).not.toHaveBeenCalled();
  });

  it("sets the page language", async () => {
    write("in/a.txt");
    await convertToHtml(p("in"), "", p("out"), false, { lang: "nl" });
    expect(read("out/a.html")).toContain('<html lang="nl">');
    expect(read("out/index.html")).toContain('<html lang="nl">');
  });

  it("refuses an output folder that contains the input", async () => {
    write("in/a.txt");
    expect(await exitCodeOf(convertToHtml(p("in"), "", tmp, false))).toBe(2);
  });

  describe("clean", () => {
    it("empties a folder that has the marker", async () => {
      write("in/a.txt");
      write(`out/${MARKER_FILE}`, "{}");
      write("out/stale.html");
      await convertToHtml(p("in"), "", p("out"), false, { clean: true });
      expect(fs.existsSync(p("out/stale.html"))).toBe(false);
      expect(fs.existsSync(p("out/a.html"))).toBe(true);
    });

    it("refuses a folder without the marker", async () => {
      write("in/a.txt");
      write("out/mine.txt", "keep");
      const code = await exitCodeOf(
        convertToHtml(p("in"), "", p("out"), false, { clean: true }),
      );
      expect(code).toBe(2);
      expect(read("out/mine.txt")).toBe("keep");
    });

    it("accepts a missing or empty folder", async () => {
      write("in/a.txt");
      await convertToHtml(p("in"), "", p("new"), false, { clean: true });
      fs.mkdirSync(p("empty"));
      await convertToHtml(p("in"), "", p("empty"), false, { clean: true });
      expect(fs.existsSync(p("new/a.html"))).toBe(true);
      expect(fs.existsSync(p("empty/a.html"))).toBe(true);
    });
  });

  describe("file system errors", () => {
    it("exit 3 when the output folder can't be created", async () => {
      write("in/a.txt");
      write("blocker", "a file");
      expect(
        await exitCodeOf(convertToHtml(p("in"), "", p("blocker/out"), false)),
      ).toBe(3);
    });

    it("exit 3 when a page can't be written", async () => {
      write("in/sub/a.txt");
      write("out/sub", "a file where a folder should be");
      expect(
        await exitCodeOf(convertToHtml(p("in"), "", p("out"), false)),
      ).toBe(3);
    });

    it("exit 3 when a stylesheet can't be copied", async () => {
      write("in/a.txt");
      write("s.css");
      write("out/assets", "a file where a folder should be");
      expect(
        await exitCodeOf(convertToHtml(p("in"), p("s.css"), p("out"), false)),
      ).toBe(3);
    });

    it("exit 8 when index.html can't be written", async () => {
      write("in/a.txt");
      fs.mkdirSync(p("out/index.html"), { recursive: true });
      expect(
        await exitCodeOf(convertToHtml(p("in"), "", p("out"), false)),
      ).toBe(8);
    });

    // chmod has no effect on Windows, and root can read anything.
    const canDenyRead =
      process.platform !== "win32" &&
      !(process.getuid && process.getuid() === 0);
    (canDenyRead ? it : it.skip)(
      "exit 6 when a source can't be read",
      async () => {
        write("in/a.txt");
        fs.chmodSync(p("in/a.txt"), 0o000);
        try {
          expect(
            await exitCodeOf(convertToHtml(p("in"), "", p("out"), false)),
          ).toBe(6);
        } finally {
          fs.chmodSync(p("in/a.txt"), 0o644);
        }
      },
    );
  });
});

describe("createHtmlFile", () => {
  it("writes one page and returns its path", async () => {
    fs.mkdirSync(p("out"));
    const file = await createHtmlFile("My page.txt", "hi", "", p("out"), {
      quiet: true,
    });
    expect(file).toBe(p("out/My_page.html"));
    expect(read("out/My_page.html")).toContain("<p>hi</p>");
  });
});

describe("checkInput", () => {
  it("accepts a folder with a page somewhere below", () => {
    write("in/deep/er/a.md");
    expect(checkInput(p("in"))).toBe(true);
  });

  it("rejects a folder with no pages", () => {
    write("in/deep/s.css");
    expect(() => checkInput(p("in"))).toThrow(
      "Directory doesn't contain any .txt or .md file.",
    );
  });

  it("ignores symlinked pages when validating a folder", () => {
    write("real.txt");
    fs.mkdirSync(p("in"));
    fs.symlinkSync(p("real.txt"), p("in/link.txt"));
    expect(() => checkInput(p("in"))).toThrow("Directory doesn't contain");
  });
});
