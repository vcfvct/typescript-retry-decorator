#!/bin/bash
# Script to create and push release tag for v2.5.2

set -e

VERSION="2.5.2"
TAG="v${VERSION}"

echo "Creating release tag ${TAG}..."

# Get the current commit SHA
COMMIT_SHA=$(git rev-parse HEAD)

echo "Tagging commit ${COMMIT_SHA} as ${TAG}"

# Create an annotated tag
git tag -a "${TAG}" -m "Release version ${VERSION}

## What's Changed

### Build System
- Modernized TypeScript configuration with separate CJS and ESM builds
- Added dedicated tsconfig.cjs.json and tsconfig.esm.json configurations
- Improved build process with separate build:cjs and build:esm scripts
- Enhanced package.json exports for better CommonJS and ESM compatibility

### Development Experience
- Added comprehensive ESLint configuration
- Integrated GitHub Actions CI workflow for automated testing
- Added GitHub Actions npm-publish workflow for automated publishing
- Included VS Code launch configuration for debugging
- Migrated from Jest to Vitest for testing

### Documentation
- Added Code of Conduct, Contributing guidelines, and Agents documentation
- Added TypeScript 5 decorator documentation
- Added example file and comprehensive test suite

### Bug Fixes
- Fixed TypeScript type annotations in utility functions
- Build output now properly supports both CommonJS and ESM consumers

Full Changelog: https://github.com/vcfvct/typescript-retry-decorator/blob/main/CHANGELOG.md"

echo "Tag ${TAG} created successfully!"
echo ""
echo "To push the tag to GitHub, run:"
echo "  git push origin ${TAG}"
echo ""
echo "After pushing, create a GitHub Release at:"
echo "  https://github.com/vcfvct/typescript-retry-decorator/releases/new?tag=${TAG}"
