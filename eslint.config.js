const js = require("@eslint/js");
const globals = require("globals");

// Formatting (indentation, quotes, semicolons) is left to Prettier.
module.exports = [
  { ignores: ["dist/", "coverage/", "node_modules/"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
  },
  {
    files: ["test/**/*.js"],
    languageOptions: { globals: { ...globals.jest } },
  },
];
