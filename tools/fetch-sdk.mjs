/* 下载 Android SDK 组件（build-tools / platform）到 .sdk，供离线手动打包 APK 使用 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve('.sdk');
const DL = path.join(ROOT, '_dl');
fs.mkdirSync(DL, { recursive: true });

const BASE = 'https://dl.google.com/android/repository/';
const FILES = [
  ['build-tools_r34-windows.zip', 'build-tools'],
  ['platform-35_r02.zip', 'platform'],
  ['platform-tools_r35.0.0-windows.zip', 'platform-tools']
];

function run(cmd, args, cwd) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit' });
    p.on('error', rej);
    p.on('close', c => (c === 0 ? res() : rej(new Error(cmd + ' -> exit ' + c))));
  });
}

async function download(name) {
  const dest = path.join(DL, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1024 * 1024) {
    console.log('[cache]', name);
    return dest;
  }
  const url = BASE + name;
  console.log('[GET]', url);
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  const total = Number(r.headers.get('content-length') || 0);
  const fh = fs.createWriteStream(dest);
  let got = 0, mark = 0;
  for await (const chunk of r.body) {
    if (!fh.write(chunk)) await new Promise(res => fh.once('drain', res));
    got += chunk.length;
    if (total && got - mark > 10 * 1024 * 1024) {
      mark = got;
      console.log('   ' + (got / 1048576).toFixed(0) + ' / ' + (total / 1048576).toFixed(0) + ' MB');
    }
  }
  await new Promise(res => fh.end(res));
  console.log('[OK]', name, (got / 1048576).toFixed(1) + 'MB');
  return dest;
}

for (const [name, tag] of FILES) {
  const zip = await download(name);
  const out = path.join(ROOT, tag);
  fs.mkdirSync(out, { recursive: true });
  console.log('[unzip]', name, '->', out);
  await run('tar', ['-xf', zip, '-C', out]);
  const tops = fs.readdirSync(out).filter(f => fs.statSync(path.join(out, f)).isDirectory());
  console.log('[top]', tag, '=>', tops.join(', '));
}
console.log('[DONE]');
