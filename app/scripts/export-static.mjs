import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, '..');

const apiDir = path.join(appDir, 'src/app/api');
const tmpApiDir = path.join(appDir, 'src/app/_api_export_tmp');
const nextConfigPath = path.join(appDir, 'next.config.ts');
const originalConfig = fs.readFileSync(nextConfigPath, 'utf8');

console.log('[export-static] Preparing Next.js static export build...');

let apiMoved = false;
let configModified = false;

try {
  if (fs.existsSync(apiDir)) {
    console.log('[export-static] Temporarily moving dynamic api route handler...');
    fs.renameSync(apiDir, tmpApiDir);
    apiMoved = true;
  }

  console.log('[export-static] Setting output: export in next.config.ts...');
  const exportConfig = originalConfig.replace(
    'const nextConfig: NextConfig = {',
    'const nextConfig: NextConfig = {\n  output: "export",',
  );
  fs.writeFileSync(nextConfigPath, exportConfig, 'utf8');
  configModified = true;

  console.log('[export-static] Running next build...');
  execSync('npx next build', {
    cwd: appDir,
    stdio: 'inherit',
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });

  // Ensure public/staticwebapp.config.json is copied to out/
  const swaConfigSrc = path.join(appDir, 'public/staticwebapp.config.json');
  const swaConfigDest = path.join(appDir, 'out/staticwebapp.config.json');
  if (fs.existsSync(swaConfigSrc)) {
    fs.copyFileSync(swaConfigSrc, swaConfigDest);
    console.log('[export-static] Copied staticwebapp.config.json to out/');
  }

  console.log('[export-static] Static export completed successfully!');
} finally {
  if (configModified) {
    console.log('[export-static] Restoring original next.config.ts...');
    fs.writeFileSync(nextConfigPath, originalConfig, 'utf8');
  }
  if (apiMoved && fs.existsSync(tmpApiDir)) {
    console.log('[export-static] Restoring dynamic api route handler...');
    fs.renameSync(tmpApiDir, apiDir);
  }
}
