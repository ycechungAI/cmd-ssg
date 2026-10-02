# cmd-ssg

<img src="https://i.ibb.co/VDZ9LmC/cmd-ssg-img1.png"
     alt="Program running -h"
     style="float: left; margin-right: 10px;" />

```text
deliverable for OSD600 open source course at seneca
```

## Description: command-line-static site tool

```text
  VERSION    : 1.1.0
  Use        : Process input .txt or .md files into generated .html files.
  Requires   : Node.js 18 or later
```

## USAGE :

```text
ssg -i <file-or-folder> [-o <folder>] [-s <stylesheet>] [--lang <code>] [--clean] [-q]
ssg -c config.json

  -i, --input <path>              input .txt/.md file or folder
  -o, --output <folder>           output folder (default: dist)
  -s, --stylesheet <file-or-url>  stylesheet: a local file (copied to assets/) or an http(s) URL
  -c, --config <file>             JSON file with input, output, stylesheet, lang and clean (CLI flags win)
      --lang <code>               language of the pages (default: en)
      --clean                     empty the output folder first (only if cmd-ssg created it)
  -q, --quiet                     only print warnings and errors
  -v, --version                   print the version
  -h, --help                      show this help
```

## FEATURES :

```text
1.  MIT license chosen
2.  Built with Node.js, Commander
3.  one .html page per .txt/.md file, plus an index.html linking to them, grouped by folder
4.  folders are converted recursively; the output keeps the folder structure below the input folder
5.  Markdown is rendered as a whole document (code blocks, lists, tables); its first # heading is the title
6.  a .txt title is its first line when followed by two blank lines; otherwise the file name is used
7.  a source index.txt/index.md becomes the home page instead of the generated index
8.  a local stylesheet is copied to assets/ and linked relatively; .css files in the input are copied too
9.  the output folder is created if missing and never emptied unless you pass --clean; --clean only
    empties folders that contain the .cmd-ssg marker written by a previous build
10. config file values are overridden by command-line flags
11. symbolic links are never followed, raw HTML in Markdown is escaped, and all titles and links are escaped
```

## EXIT CODES :

```text
0  success
1  unexpected error
2  invalid usage: no input, missing file or stylesheet, bad config, invalid output folder,
   invalid --lang, or --clean on a folder cmd-ssg didn't create
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
