# Instructions for Creating Release v2.5.2

This document provides step-by-step instructions for creating and publishing release v2.5.2 of typescript-retry-decorator.

## Prerequisites

1. Ensure you have write access to the repository
2. Ensure you are on a commit that includes version 2.5.2 in package.json
3. Verify the build is successful: `pnpm run build`
4. Verify tests pass: `pnpm test`

## Method 1: Using the Script (Recommended)

Run the provided script to create the annotated tag:

```bash
./create-release-tag.sh
```

Then push the tag:

```bash
git push origin v2.5.2
```

## Method 2: Manual Tag Creation

1. **Create an annotated tag for v2.5.2:**

   ```bash
   git tag -a v2.5.2 -m "Release version 2.5.2

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
   
   Full Changelog: https://github.com/vcfvct/typescript-retry-decorator/blob/v2.5.2/CHANGELOG.md"
   ```

2. **Verify the tag was created:**

   ```bash
   git tag -l -n9 v2.5.2
   ```

3. **Push the tag to GitHub:**

   ```bash
   git push origin v2.5.2
   ```

## Method 3: Create GitHub Release (Triggers npm publish)

After pushing the tag, create a GitHub Release:

1. Go to https://github.com/vcfvct/typescript-retry-decorator/releases/new
2. Select tag: `v2.5.2` (or create the tag from the UI if not pushed yet)
3. Release title: `v2.5.2`
4. Copy the content from `RELEASE_NOTES_v2.5.2.md` into the release description
5. Check "Set as the latest release"
6. Click "Publish release"

**Note:** Publishing the release will trigger the `npm-publish.yml` GitHub Action workflow, which will:
- Install dependencies
- Run the build
- Run tests
- Publish the package to npm with provenance

## Verification

After the release is published:

1. **Verify the tag exists:**
   ```bash
   git ls-remote --tags origin | grep v2.5.2
   ```

2. **Verify the npm package:**
   - Check https://www.npmjs.com/package/typescript-retry-decorator
   - The version 2.5.2 should be listed

3. **Verify the GitHub Release:**
   - Visit https://github.com/vcfvct/typescript-retry-decorator/releases
   - The v2.5.2 release should be visible

4. **Test installation:**
   ```bash
   npm view typescript-retry-decorator@2.5.2
   ```

## Rollback (if needed)

If something goes wrong:

1. **Delete the remote tag:**
   ```bash
   git push --delete origin v2.5.2
   ```

2. **Delete the local tag:**
   ```bash
   git tag -d v2.5.2
   ```

3. **Delete the GitHub Release** through the GitHub UI

4. **Unpublish from npm** (if already published):
   ```bash
   npm unpublish typescript-retry-decorator@2.5.2
   ```
   Note: npm unpublish is only available within 72 hours of publishing.

## Files Created for This Release

- `CHANGELOG.md` - Changelog documenting all changes
- `RELEASE_NOTES_v2.5.2.md` - Release notes for GitHub release
- `create-release-tag.sh` - Helper script for creating the tag
- `RELEASE_INSTRUCTIONS.md` - This file

## Next Steps After Release

1. Announce the release in relevant channels
2. Update documentation if needed
3. Close any related issues or PRs
4. Update the README if there are breaking changes or new features to highlight
