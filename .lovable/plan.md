

## Version Bump and Export

### Change
Update `public/manifest.json` line 6: version from `"0.2.11"` to `"0.2.12"`.

### Build and Export Commands

After the version bump, run these commands in your terminal from the project root:

```text
# 1. Build the extension
npm run build

# 2. Create the zip
cd dist
zip -r ../gogio-extension-v0.2.12.zip .
cd ..
```

This produces `gogio-extension-v0.2.12.zip` in your project root, ready to upload to the Chrome Web Store Developer Dashboard.

