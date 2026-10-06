// SWC transformer and alias setup: https://nextjs.org/docs/app/guides/testing/jest
import nextJest from "next/jest.js";
const create = nextJest({ dir: "./" });
const shared = {
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  clearMocks: true,
};
const config = {
  projects: [
    await create({ ...shared, displayName: "unit", testMatch: ["<rootDir>/tests/unit/**/*.test.ts"] })(),
    await create({ ...shared, displayName: "integration", testMatch: ["<rootDir>/tests/integration/**/*.test.ts"] })(),
  ],
  collectCoverageFrom: ["src/contracts/**/*.ts"],
  coverageDirectory: "coverage/contracts",
  coverageProvider: "v8",
  coverageReporters: ["text", "json-summary", "lcov"],
  coverageThreshold: { global: { branches: 100, functions: 100, lines: 100, statements: 100 } },
};
export default config;
