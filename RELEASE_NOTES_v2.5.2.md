# Release Notes for v2.5.2

## Overview
This release modernizes the TypeScript configuration and build process, introducing dual CommonJS and ESM builds for better compatibility with modern JavaScript tooling.

## What's Changed

### Build System
- **Modernized TypeScript configuration** with separate CJS and ESM builds
- Added dedicated `tsconfig.cjs.json` and `tsconfig.esm.json` configurations
- Improved build process with separate `build:cjs` and `build:esm` scripts
- Enhanced package.json exports for better CommonJS and ESM compatibility

### Development Experience
- Added comprehensive ESLint configuration (`.eslintrc.js`)
- Integrated GitHub Actions CI workflow for automated testing
- Added GitHub Actions npm-publish workflow for automated publishing on release
- Included VS Code launch configuration for debugging
- Migrated from Jest to Vitest for testing

### Documentation
- Added Code of Conduct (CODE_OF_CONDUCT.md)
- Added Contributing guidelines (CONTRIBUTING.md)
- Added Agents configuration documentation (AGENTS.md)
- Added TypeScript 5 decorator documentation (ts5-decorator.md)
- Added example file demonstrating decorator usage (src/example.ts)
- Added comprehensive test suite (src/retry.decorator.test.ts)

### Bug Fixes
- Fixed TypeScript type annotations in utility functions
- Build output now properly supports both CommonJS and ESM consumers

## Installation

```bash
npm install typescript-retry-decorator@2.5.2
```

or

```bash
pnpm add typescript-retry-decorator@2.5.2
```

## Full Changelog
See [CHANGELOG.md](./CHANGELOG.md) for complete details.

---

**Tag**: v2.5.2  
**Commit**: 021e9f3993e7b31eedd64cde41ddc3251c0a210d
