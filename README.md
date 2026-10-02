# cmd-ssg

<img src="https://i.ibb.co/VDZ9LmC/cmd-ssg-img1.png"
     alt="Program running -h"
     style="float: left; margin-right: 10px;" />

```text
deliverable for OSD600 open source course at seneca
```

## Description: command-line-static site tool

```text
  VERSION    : 1.0.4
  Use        : Process input .txt or .md files into generated .html files.
  Requires   : Node.js 18 or later
```

## USAGE :

```text
ssg -i <file-or-folder> [-o <folder>] [-s <stylesheet-url>]
ssg -c config.json

  -i, --input <path>      input .txt/.md file or folder
  -o, --output <folder>   output folder (default: dist)
  -s, --stylesheet <url>  stylesheet URL linked from every page
  -c, --config <file>     JSON file with input, output and stylesheet (CLI flags win)
  -v, --version           print the version
  -h, --help              show this help
```

## FEATURES :

```text
1.  MIT license chosen
2.  Built with Node.js, Commander
3.  one .html page per .txt/.md file, plus an index.html linking to them
4.  folders are converted recursively; the output keeps the folder structure below the input folder
5.  a title is read from the first line of a .txt file when it is followed by two blank lines
6.  a source index.txt/index.md becomes the home page instead of the generated index
7.  the output folder is created if missing; the default ./dist is cleared before each build
8.  config file values are overridden by command-line flags
9.  symbolic links are never followed, and all file content, titles and links are escaped
```

## EXIT CODES :

```text
0  success
1  unexpected error
2  invalid usage: no input, missing file, bad config, invalid output folder
3  unable to create the output folder or write a page
6  unable to read an input file
8  unable to write index.html
```

## ROADMAP :

```text
See docs/roadmap/ for planned releases
```

## CONTRIBUTING :

```text
See CONTRIBUTING.md for setup and development
```

```text
Special Thanks  : Kevan Yang
Markdown Feature: Oliver Pham
Author          : Eugene Chung
```

## License

[MIT](LICENSE)
