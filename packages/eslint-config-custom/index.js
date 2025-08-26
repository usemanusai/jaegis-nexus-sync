module.exports = {
  root: false,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  settings: {
    react: {
      version: "detect"
    }
  },
  env: {
    es2022: true,
    node: true,
    browser: true
  },
  rules: {
    "react/react-in-jsx-scope": "off"
  }
};
