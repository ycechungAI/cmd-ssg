const fs = require("fs");
const os = require("os");
const path = require("path");
const { checkInput, convertToHtml } = require("../bin/helper");

describe("Symlink security", () => {
  let tmp;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ssg-symlink-"));
    fs.writeFileSync(path.join(tmp, "secret.txt"), "TOP_SECRET_MARKER");
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("checkInput rejects a symlink file as input", () => {
    const link = path.join(tmp, "link.txt");
    fs.symlinkSync(path.join(tmp, "secret.txt"), link);
    expect(() => checkInput(link)).toThrow(
      "Symbolic links are not supported as input."
    );
  });

  it("does not follow symlinks when converting a directory", async () => {
    const indir = path.join(tmp, "in");
    const outdir = path.join(tmp, "out");
    fs.mkdirSync(indir);
    fs.mkdirSync(outdir);
    fs.writeFileSync(path.join(indir, "real.txt"), "hello");
    fs.symlinkSync(path.join(tmp, "secret.txt"), path.join(indir, "evil.txt"));

    await convertToHtml(indir, "", outdir, false);

    const walk = (d) =>
      fs
        .readdirSync(d, { withFileTypes: true })
        .flatMap((e) => {
          const p = path.join(d, e.name);
          return e.isDirectory() ? walk(p) : [p];
        });
    const contents = walk(outdir)
      .map((f) => fs.readFileSync(f, "utf8"))
      .join("\n");
    expect(contents).not.toContain("TOP_SECRET_MARKER");
    expect(contents).toContain("hello");
  });
});
