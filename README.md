# cmd-ssg
deliverable 0.1 for OSD600 open source course at seneca

## Description: command-line-static site tool 
##VERSION    : 0.01
   Use        : process input .txt files into generated .html files.

## Screen Shot 
<img src="https://i.ibb.co/VDZ9LmC/cmd-ssg-img1.png"
     alt="Program running -h"
     style="float: left; margin-right: 10px;" />

## How to Use
```
npm install -g .
ssgy <command option>
```

## DONE       :
1. cmd-ssg
2. github repo created
3. MIT license chosen
4. create README.md - keep it updated as you write your code, documenting how to use your tool, which features you include, etc. Your README file should tell users how to use your tool.
5. choose Javascript/Node.js language
6. running the tool with --version or -v flag will print the tool's name and current version
7. running the tool with --help or -h flag should print standard help/usage message also showing how to run the tool, which command line flags and arguments can be used, etc.
8. specify input file or folder with --input or -i
9. generate one .html output file for each input file
   NOTE       : the original txt file(s) should not be modified
10. need to deal with marking-up paragraphs: every blank line should be considered a paragraph limit and the text transformed into <p>
11. your tool should place all output into a ./dist folder by default

Bonus:
## TODO NEXT  :
12. adding -s stylesheet option
13. making it easy on the eyes =)