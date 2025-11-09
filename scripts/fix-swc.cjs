const { execSync } = require('child_process');

try {
  execSync('npm i -D @next/swc-linux-x64-gnu @next/swc-linux-x64-musl @next/swc-win32-x64-msvc @next/swc-darwin-x64 @next/swc-darwin-arm64', {
    stdio: 'inherit'
  });
  console.log('SWC prebuilt binaries installed.');
} catch (e) {
  console.warn('SWC install skipped:', e?.message || e);
}
