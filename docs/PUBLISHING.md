# Publishing ETCswap SDK Packages to npm

This document describes the procedures for publishing ETCswap SDK packages to npm, including important lessons learned from our initial release.

## NPM Organizations

The SDKs are published under three npm organizations:

| Organization | Packages | Access |
|--------------|----------|--------|
| `@etcswapv2` | `sdk-core`, `sdk` | Public |
| `@etcswapv3` | `sdk`, `router-sdk` | Public |
| `@etcswapv4` | `sdk` (future) | Public |

## Prerequisites

### 1. npm Account and Organization Access

Ensure you have:
- An npm account
- Member access to `etcswapv2`, `etcswapv3`, and `etcswapv4` organizations
- An npm access token with read/write permissions

### 2. Authentication

```bash
# Login to npm (interactive)
npm login

# Or use an access token (for CI/automation)
npm config set //registry.npmjs.org/:_authToken=<your-token>
```

### 3. Verify Access

```bash
npm whoami
npm org ls etcswapv2
npm org ls etcswapv3
```

## Publishing Workflow

### Step 1: Update Version Numbers

Each package has its own version in its `package.json`:

```bash
# Example: Update v2-sdk version
cd sdks/v2-sdk
# Edit package.json, change "version": "1.0.1" to "1.0.2"
```

**Version Guidelines (semver):**
- PATCH (1.0.x): Bug fixes, documentation
- MINOR (1.x.0): New features, backward compatible
- MAJOR (x.0.0): Breaking changes

### Step 2: Build the Package

Always build before publishing:

```bash
# From the workspace root
pnpm build

# Or for a specific package
cd sdks/v2-sdk && pnpm build
```

### Step 3: Verify Package Contents

Check what will be published:

```bash
cd sdks/v2-sdk
pnpm pack --pack-destination /tmp

# Inspect the tarball
tar -tzf /tmp/etcswapv2-sdk-<version>.tgz

# Check package.json in tarball (IMPORTANT!)
tar -xzf /tmp/etcswapv2-sdk-<version>.tgz -C /tmp
cat /tmp/package/package.json
```

### Step 4: Publish

```bash
cd sdks/<package-name>
pnpm publish --access public --no-git-checks
```

**Flags:**
- `--access public`: Required for scoped packages
- `--no-git-checks`: Skip git working tree checks (optional)

## Critical: Workspace Dependencies

### The Problem

pnpm workspaces use `workspace:*` for inter-package dependencies:

```json
{
  "dependencies": {
    "@etcswapv2/sdk-core": "workspace:*"
  }
}
```

**When published to npm, `workspace:*` should be converted to actual version numbers.** However, this conversion only happens when:

1. Publishing from within the pnpm workspace
2. The `prepublishOnly` script runs correctly

### The Solution

**Always verify the tarball before publishing:**

```bash
cd sdks/v2-sdk
pnpm pack --pack-destination /tmp
tar -xzf /tmp/etcswapv2-sdk-*.tgz -C /tmp
grep "@etcswapv2/sdk-core" /tmp/package/package.json
```

**Expected output:**
```
"@etcswapv2/sdk-core": "1.0.0"
```

**NOT expected (indicates a problem):**
```
"@etcswapv2/sdk-core": "workspace:*"
```

### If Workspace References Leak Through

If you accidentally publish with `workspace:*` references:

1. **Publish a patch version immediately** with correct references
2. **Deprecate the broken version** (optional):
   ```bash
   npm deprecate @etcswapv2/sdk@1.0.0 "Contains workspace references, use 1.0.1"
   ```

## Publishing Order

When making changes that affect multiple packages, **publish in dependency order**:

1. `@etcswapv2/sdk-core` (no internal dependencies)
2. `@etcswapv2/sdk` (depends on sdk-core)
3. `@etcswapv3/sdk` (depends on sdk-core)
4. `@etcswapv3/router-sdk` (depends on sdk-core, v2-sdk, v3-sdk)

**Example: Coordinated Release**

```bash
# 1. Publish sdk-core first
cd sdks/sdk-core
pnpm build
pnpm publish --access public

# 2. Wait for npm to propagate (1-2 minutes)
sleep 120

# 3. Publish dependent packages
cd ../v2-sdk && pnpm build && pnpm publish --access public
cd ../v3-sdk && pnpm build && pnpm publish --access public

# 4. Wait again
sleep 120

# 5. Publish router-sdk last
cd ../router-sdk && pnpm build && pnpm publish --access public
```

## Verification After Publishing

### Check npm Registry

```bash
# Verify package is accessible
npm view @etcswapv2/sdk

# Check specific version
npm view @etcswapv2/sdk@1.0.1

# Check dependencies are correct
npm view @etcswapv2/sdk dependencies
```

### Test Installation

```bash
# Create a test directory
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y

# Install the published packages
npm install @etcswapv2/sdk-core @etcswapv2/sdk

# Verify dependencies resolved correctly
cat node_modules/@etcswapv2/sdk/package.json | grep -A5 dependencies
```

## Troubleshooting

### "Package not found" immediately after publish

npm propagation can take 1-5 minutes. Wait and retry.

### "workspace:* is not a valid version"

The package was published with unconverted workspace references. Publish a new version.

### "403 Forbidden" when publishing

- Verify you're logged in: `npm whoami`
- Verify org membership: `npm org ls etcswapv2`
- Check package name matches org: `@etcswapv2/*`

### "Package already exists"

You cannot republish the same version. Bump the version number.

## CI/CD Considerations

For automated publishing:

1. Store npm token as a secret
2. Use `npm config set` to authenticate
3. Always run `pnpm build` before publish
4. Add verification step to check tarball contents
5. Publish in dependency order with delays

Example GitHub Actions step:
```yaml
- name: Publish to npm
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: |
    cd sdks/sdk-core
    pnpm build
    pnpm publish --access public --no-git-checks
```

## Summary Checklist

Before publishing any package:

- [ ] Version number updated in package.json
- [ ] Package builds successfully (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Tarball contains correct dependencies (not `workspace:*`)
- [ ] Logged into npm with correct account
- [ ] Have access to the npm organization
- [ ] Publishing in correct dependency order

After publishing:

- [ ] Package visible on npm registry
- [ ] Dependencies show correct version numbers
- [ ] Test installation in fresh project works
- [ ] Update any dependent projects to use new version
