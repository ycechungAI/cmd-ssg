# cmd-ssg

deliverable 0.1 for OSD600 open source course at seneca

## Description: command-line-static site tool

```
  VERSION    : 0.1.0
  Use        : Process input .txt/.md files into generated .html files.
```

## Prerequiste for development

```
   "node": ">=16.9.1",
   "npm": ">=7.23.0"

   ```

## Screen Shot

<img src="https://i.ibb.co/VDZ9LmC/cmd-ssg-img1.png"
     alt="Program running -h"
     style="float: left; margin-right: 10px;" />

## How to Use

```
git clone <this repo>
   Linux: npm install
          sudo npm install -g .
   Windows: npm install
            npm install -g .
   Macs:  <not fully supported>

ssgy <command option>

   Example:
      [x] ssgy -i examples
      [x] ssgy -i examples/md -s sample_css/new.css
```

## FEATURES :

1. cmd-ssg
2. github repo created
3. MIT license chosen
4. create README.md - keep it updated as you write your code, documenting how to use your tool, which features you include, etc. Your README file should tell users how to use your tool.
5. choose Javascript/Node.js language
6. running the tool with --version or -v flag will print the tool's name and current version
7. running the tool with --help or -h flag should print standard help/usage message also showing how to run the tool, which command line flags and arguments can be used, etc.
8. specify input file or folder with --input or -i
9. generate one .html output file for each input file
   NOTE : the original txt file(s) should not be modified
10. need to deal with marking-up paragraphs: every blank line should be considered a paragraph limit and the text transformed into <p>
11. your tool should place all output into a ./dist folder by default
12. input can be deep within the files such as .\test\test2\
13. parse a title from your input files
14. adding -s stylesheet option
15. making it easy on the eyes =) checkout my cmd-ssg -h
16. generate static files for Markdown files
   - [x] Parse Heading syntax
   - [x] Parse Italics & Bold syntax

# Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
```
Special Thanks  : Kevan Yang
Markdown Feature: Oliver Pham
Author          : Eugene Chung
```

# License
[MIT](LICENSE)
