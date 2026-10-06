// https://nextjs.org/docs/app/api-reference/config/eslint#setup-eslint
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "test-results/**", "playwright-report/**", "next-env.d.ts"]),
]);
