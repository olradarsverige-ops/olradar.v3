
const { execSync } = require('child_process');
try {
  console.log('🔧 Ensuring SWC optional deps...');
  execSync('npm i -O @next/swc-win32-x64-msvc @next/swc-linux-x64-gnu @next/swc-linux-arm64-gnu @next/swc-darwin-arm64 @next/swc-darwin-x64', { stdio: 'inherit' });
} catch (e) {
  console.log('⚠️  Optional SWC install skipped.');
}
