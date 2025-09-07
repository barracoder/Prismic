# Security & Dependencies Workflow Fixes

## Issues Fixed

### 1. **Incorrect Directory Structure References**
The workflows were using outdated paths from before the workspace restructure:

**Before:**
- `prismic-react/package-lock.json` ❌
- `cd prismic-react` ❌
- `prismic-react/packages/demo-website/**` ❌

**After:**
- `package-lock.json` ✅ (workspace root)
- `cd packages/prismic-react` ✅
- `demo-website/**` ✅

### 2. **Security Workflow Updates**

#### Fixed `security.yml`:
- ✅ Updated cache dependency path to workspace root
- ✅ Fixed all directory references to match current structure
- ✅ Added separate security audits for each package
- ✅ Updated CodeQL analysis to use workspace scripts

#### Fixed `deploy.yml`:
- ✅ Updated file path triggers
- ✅ Fixed dependency installation to use workspace
- ✅ Updated build commands to use workspace scripts
- ✅ Fixed publish directory path

#### Fixed `release.yml`:
- ✅ Updated dependency caching
- ✅ Fixed test and build commands
- ✅ Updated package publishing path

### 3. **Security Vulnerabilities Resolved**

**Fixed Vite vulnerability:**
- Updated `vite` from `^5.4.1` to `^6.1.7` in demo-website
- Resolved esbuild vulnerability (GHSA-67mh-4wv8-2f99)
- All packages now show `found 0 vulnerabilities`

### 4. **Workflow Structure Now Correct**

```yaml
# Working security audit steps:
- name: Install dependencies
  run: npm ci

- name: Run security audit - Root
  run: npm audit --audit-level=moderate

- name: Run security audit - Prismic
  run: |
    cd packages/prismic
    npm audit --audit-level=moderate

- name: Run security audit - Prismic React
  run: |
    cd packages/prismic-react
    npm audit --audit-level=moderate
```

## Results

✅ **Security & Dependencies workflow should now pass**
✅ **All vulnerabilities resolved**
✅ **Correct workspace structure references**
✅ **Proper dependency caching**
✅ **Working build and test commands**

## Next Steps

1. **Commit these changes** to trigger the workflows
2. **Configure secrets** if needed:
   - `NPM_TOKEN` for releases
   - `LHCI_GITHUB_APP_TOKEN` for Lighthouse CI (optional)

The workflows should now run successfully with your current workspace structure!
