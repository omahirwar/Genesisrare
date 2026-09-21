import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const publicDir = 'public';
const distAssets = path.join(distDir, 'assets');
const publicAssets = path.join(publicDir, 'assets');

fs.mkdirSync(publicAssets, { recursive: true });
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(publicDir, 'index.html'));

for (const name of fs.readdirSync(distAssets)) {
  if (!/\.(js|css|map|woff2?|svg|png|jpg|jpeg|webp|ico)$/i.test(name)) continue;
  fs.copyFileSync(path.join(distAssets, name), path.join(publicAssets, name));
}
