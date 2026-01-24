# Changelog

All notable changes to this project will be documented in this file.

## [2.5.2] - 2026-01-24

### Changed
- Modernized TypeScript configuration with separate CJS and ESM builds
- Added dual build support with separate `tsconfig.cjs.json` and `tsconfig.esm.json`
- Improved build process with dedicated `build:cjs` and `build:esm` scripts
- Updated package.json exports for better CommonJS and ESM compatibility

### Added
- Comprehensive ESLint configuration (`.eslintrc.js`)
- GitHub Actions CI workflow for automated testing
- GitHub Actions npm-publish workflow for automated publishing
- VS Code launch configuration for debugging
- Code of Conduct (CODE_OF_CONDUCT.md)
- Contributing guidelines (CONTRIBUTING.md)
- Agents configuration documentation (AGENTS.md)
- TypeScript 5 decorator documentation (ts5-decorator.md)
- Example file demonstrating decorator usage (src/example.ts)
- Comprehensive test suite using Vitest (src/retry.decorator.test.ts)

### Fixed
- TypeScript type annotations in utility functions
- Build output now properly supports both CommonJS and ESM consumers
