import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**", "out/**", "build/**", "coverage/**",
      "generated/prisma/**", "next-env.d.ts",
      // Generated runtime bundled with the design references, not application source.
      "Planner_v2__Apple/**/support.js",
      "mockup/Planner_v2__Apple/**/support.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["scripts/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
