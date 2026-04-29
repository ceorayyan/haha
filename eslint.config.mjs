import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // This codebase intentionally uses incremental typing/refactors.
      "@typescript-eslint/no-explicit-any": "off",

      // Several client-only components initialize state after mount; this rule is too strict for now.
      "react-hooks/set-state-in-effect": "off",

      // Inline helper components are used in a few UI modules; allow while we refactor.
      "react-hooks/static-components": "off",
      "react-hooks/immutability": "off",

      // Allow apostrophes in JSX content.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
