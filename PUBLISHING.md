# Publishing Guide

This document explains how to publish new versions of the `mac-zzz` package to npm using GitHub Actions.

## One-Time Setup

### 1. Create an NPM Account and Token

1. Create an account at [npmjs.com](https://www.npmjs.com) if you don't have one
2. Log in and go to your account settings
3. Click on "Access Tokens" in the left sidebar
4. Click "Generate New Token" → "Classic Token"
5. Select "Automation" type (recommended for CI/CD)
6. Copy the generated token (you won't see it again!)

### 2. Add NPM_TOKEN to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

### 3. Update package.json Metadata

Before first publish, ensure these fields are filled in `package.json`:
- `name`: Should be unique on npm (check availability at npmjs.com)
- `author`: Your name or GitHub username
- `repository.url`: Your GitHub repository URL

Example:
```json
{
  "name": "mac-zzz",
  "author": "Your Name",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/mac-zzz"
  }
}
```

## Publishing a New Version

### Automated Workflow (Recommended)

1. **Update version and create tag:**
   ```bash
   # For bug fixes (1.0.0 → 1.0.1)
   npm version patch

   # For new features (1.0.0 → 1.1.0)
   npm version minor

   # For breaking changes (1.0.0 → 2.0.0)
   npm version major
   ```

   This command will:
   - Update `package.json` version
   - Create a git commit
   - Create a git tag (e.g., `v1.0.1`)
   - Push commits and tags to GitHub (via postversion script)

2. **GitHub Actions takes over:**
   - Detects the new tag
   - Runs the publish workflow
   - Publishes to npm automatically

3. **Monitor the workflow:**
   - Go to GitHub → **Actions** tab
   - Watch the "Publish to NPM" workflow
   - Check for success/failure

### Manual Workflow (Backup)

If you need to publish manually:

```bash
# Ensure you're logged in to npm
npm login

# Publish
npm publish --access public
```

## Workflow Details

The GitHub Actions workflow (`.github/workflows/npm-publish.yml`):

- **Trigger**: Pushes to tags matching `v*` (e.g., `v1.0.1`)
- **Steps**:
  1. Checks out code
  2. Sets up Node.js
  3. Verifies tag version matches package.json
  4. Installs dependencies
  5. Runs tests (if configured)
  6. Publishes to npm with `--access public`

## Package Contents

Files included in npm package (controlled by `.npmignore`):
- `zzz.js` (main executable)
- `package.json`
- `LICENSE`

Files excluded:
- `.git`, `.github`, `.claude`
- Development files
- CI/CD configurations

## Troubleshooting

### "Package name already taken"
- Change `name` in `package.json` to something unique
- Check availability: `npm search <package-name>`

### "Authentication failed"
- Verify `NPM_TOKEN` is set correctly in GitHub secrets
- Token must be "Automation" type for CI/CD
- Token might have expired - generate a new one

### "Version already published"
- You can't republish the same version
- Run `npm version patch` to increment version
- Delete the existing tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`

### "Workflow not triggered"
- Ensure tag starts with `v` (e.g., `v1.0.1` not `1.0.1`)
- Check that both commit AND tag were pushed
- Verify workflow file is in `.github/workflows/` on main branch

## Version Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

## Useful Commands

```bash
# Check current version
npm version

# Dry run publish (see what would be published)
npm publish --dry-run

# View published versions
npm view mac-zzz versions

# Check what files will be included
npm pack --dry-run
```
