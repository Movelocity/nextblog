import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "eslint-comments": require("eslint-plugin-eslint-comments"),
    },
    rules: {
      "no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
      "eslint-comments/no-unused-disable": "warn",
    },
  },
];

export default eslintConfig;
