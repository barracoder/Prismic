// This file explicitly disables Jest for this workspace
// We use Vitest instead - see vitest.config.ts files in packages
module.exports = {
  testMatch: [],
  collectCoverage: false,
  verbose: false
};
