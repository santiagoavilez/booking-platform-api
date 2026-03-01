/**
 * Merges unit test coverage and E2E test coverage into a single report.
 * Used for Coveralls and local coverage viewing.
 *
 * Prerequisites:
 * - coverage/coverage-final.json (from jest --coverage, unit tests)
 * - coverage-e2e/coverage-final.json (from jest --config test/jest-e2e.json --coverage)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const coverageDir = path.join(projectRoot, 'coverage');
const coverageE2eDir = path.join(projectRoot, 'coverage-e2e');
const tempDir = path.join(projectRoot, 'coverage-temp');

const unitCoverage = path.join(coverageDir, 'coverage-final.json');
const e2eCoverage = path.join(coverageE2eDir, 'coverage-final.json');

if (!fs.existsSync(unitCoverage)) {
  console.error('Missing coverage/coverage-final.json. Run unit tests with coverage first.');
  process.exit(1);
}

if (!fs.existsSync(e2eCoverage)) {
  console.error('Missing coverage-e2e/coverage-final.json. Run E2E tests with coverage first.');
  process.exit(1);
}

fs.mkdirSync(tempDir, { recursive: true });

const mergedOutput = path.join(tempDir, 'coverage-final.json');

try {
  execSync(
    `npx istanbul-merge --out "${mergedOutput}" "${unitCoverage}" "${e2eCoverage}"`,
    { stdio: 'inherit', cwd: projectRoot }
  );

  execSync(
    `npx nyc report -t "${tempDir}" --report-dir "${coverageDir}" --reporter=lcov --reporter=text`,
    { stdio: 'inherit', cwd: projectRoot }
  );

  // Copy merged JSON to coverage/ for tools that need it
  fs.copyFileSync(mergedOutput, path.join(coverageDir, 'coverage-final.json'));

  console.log('\nCoverage merged successfully. Report in coverage/');
} catch (err) {
  console.error('Merge failed:', err.message);
  process.exit(1);
}
