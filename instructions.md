Description: command-line-static site tool
VERSION : 0.01
Use : process input .txt files into generated .html files.

DONE :

1. cmd-ssg
2. github repo created
3. MIT license chosen
4. create README.md - keep it updated as you write your code, documenting how to use your tool, which features you include, etc. Your README file should tell users how to use your tool.

TODO NEXT : 5. choose programming language - DECIDE 6
6. running the tool with --version or -v flag will print the tool's name and current version 
7. running the tool with --help or -h flag should print standard help/usage message
also showing how to run the tool, which command line flags and arguments can be used, etc. 
8. specify input file or folder with --input or -i
9. generate one .html output file for each input file
   NOTE : the original txt file(s) should not be modified
10. need to deal with marking-up paragraphs: every blank line should be considered a paragraph limit and the text transformed into <p>...</p>.
11. your tool should place all output into a ./dist folder by default

PICK 2 :

Optional Feature (implement 2)

12. a) In addition to the required features, you are asked to pick 2 of the following optional features to include in your submission:

12. b) try to parse a title from your input files. If there is a title, it will be the first line followed by two blank lines. In your generated HTML, use this to populate the <title>...</title> and add an <h1>...</h1> to the top of the <body>.

12. c) allow the user to specify a different output directory using --output or -o. If not specified, dist will be used, but if the user specifies a different output path, use that. Print an error if the specified output path is not a valid directory.

12. d) allow the user to optionally specify a --stylesheet or -s URL to a CSS stylesheet to be used in the <head> of your generated HTML files. For example: https://cdnjs.cloudflare.com/ajax/libs/tufte-css/1.8.0/tufte.min.css or https://cdn.jsdelivr.net/npm/water.css@2/out/water.css

12. e) allow the input to be a deep tree of files and folders. That is, if the user specifies a folder for --input, check to see if any of the items contained within are folders and recursively parse those as well.

12. f) if the user specifies a folder for the input, automatically generate an index.html file, which has relative links to each of the generated HTML files.

12. g) improve the look and feel of your generated HTML pages using a default stylesheet that you design. Make them responsive, use beautiful fonts and colours, improve the layout and readability of the text.

13. come up with your own idea. If you have an idea not listed above, talk to your professor and see if it's OK to implement that (it probably is).

End of Deliverables 0.1
