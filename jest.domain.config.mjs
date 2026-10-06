import nextJest from "next/jest.js";
const create = nextJest({ dir: "./" });
export default create({
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["<rootDir>/tests/unit/domain/**/*.test.ts", "<rootDir>/tests/property/**/*.test.ts"],
  collectCoverageFrom: ["src/domain/**/*.ts"],
  coverageDirectory: "coverage/domain",
  coverageProvider: "v8",
  coverageReporters: ["text", "json-summary", "lcov"],
  coverageThreshold: { global: { branches: 100, functions: 100, lines: 100, statements: 100 } },
});
