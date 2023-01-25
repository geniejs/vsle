/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: { browser: true, es2022: true },
  extends: ["@remix-run/eslint-config", "prettier"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./tsconfig.json"],
      },
      settings: { react: { version: "18" } },
      extends: [
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "standard-with-typescript",
        "prettier",
      ],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/strict-boolean-expressions": "off",
        "react/no-unknown-property": "off",
      },
    },
    {
      files: ["*.test.ts", "*.test.js"],
      extends: ["plugin:jest/recommended"],
      env: { jest: true },
    },
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
    ecmaFeatures: { jsx: true },
  },
};
