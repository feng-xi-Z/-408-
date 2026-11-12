/* 不依赖 Gradle，直接用 aapt2 / javac / d8 / zipalign / apksigner 打出可安装的 APK */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const BT = path.join(ROOT, '.sdk/build-tools/android-14');
const AJAR = path.join(ROOT, '.sdk/platform/android-35/android.jar');
const AND = path.join(ROOT, 'android');
const OUT = path.join(ROOT, 'dist');
const B = path.join(ROOT, '.build');

const AAPT2 = path.join(BT, 'aapt2.exe');
const D8 = path.join(BT, 'd8.bat');
const ZIPALIGN = path.join(BT, 'zipalign.exe');
const APKSIGNER = path.join(BT, 'apksigner.bat');

function run(cmd, args, cwd) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd: cwd || ROOT, stdio: 'inherit' });
    p.on('error', e => rej(e));
    p.on('close', c => (c === 0 ? res() : rej(new Error(path.basename(cmd) + ' 退出码 ' + c))));
  });
}
function walk(dir, ext, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, acc);
    else if (e.name.endsWith(ext)) acc.push(p);
  }
  return acc;
}
function must(p, label) {
  if (!fs.existsSync(p)) throw new Error('缺少' + label + '：' + p);
}

must(AAPT2, ' aapt2'); must(AJAR, ' android.jar'); must(D8, ' d8');
must(path.join(AND, 'assets/kaoyan.html'), ' assets/kaoyan.html（请先运行 node tools/build.mjs）');

fs.rmSync(B, { recursive: true, force: true });
fs.mkdirSync(path.join(B, 'gen'), { recursive: true });
fs.mkdirSync(path.join(B, 'classes'), { recursive: true });
fs.mkdirSync(path.join(B, 'dex'), { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

console.log('\n[1/7] 编译资源 (aapt2 compile)');
await run(AAPT2, ['compile', '--dir', path.join(AND, 'res'), '-o', path.join(B, 'res.zip')]);

console.log('\n[2/7] 链接资源并打包 assets (aapt2 link)');
const VER = JSON.parse(fs.readFileSync(path.join(AND, 'version.json'), 'utf8'));
await run(AAPT2, [
  'link', '-o', path.join(B, 'base.apk'),
  '-I', AJAR,
  '--manifest', path.join(AND, 'AndroidManifest.xml'),
  '-R', path.join(B, 'res.zip'),
  '-A', path.join(AND, 'assets'),
  '--java', path.join(B, 'gen'),
  '--min-sdk-version', '21',
  '--target-sdk-version', '34',
  '--version-code', String(VER.code),
  '--version-name', VER.name,
  '--auto-add-overlay'
]);
console.log(`      版本：v${VER.name}（versionCode ${VER.code}）`);

console.log('\n[3/7] 编译 Java 源码 (javac 17, target 8)');
const javaFiles = [...walk(path.join(AND, 'src'), '.java'), ...walk(path.join(B, 'gen'), '.java')];
if (!javaFiles.length) throw new Error('没有找到 Java 源文件');
await run('javac', [
  '-encoding', 'UTF-8',
  '-source', '8', '-target', '8',
  '-nowarn',
  '-classpath', AJAR,
  '-d', path.join(B, 'classes'),
  ...javaFiles
]);

console.log('\n[4/7] 转 dex (d8)');
const classes = walk(path.join(B, 'classes'), '.class');
await run('cmd.exe', ['/c', D8, '--lib', AJAR, '--min-api', '21', '--release',
  '--output', path.join(B, 'dex'), ...classes]);

console.log('\n[5/7] 把 classes.dex 写入 APK');
await run('jar', ['-uf', path.join(B, 'base.apk'), 'classes.dex'], path.join(B, 'dex'));

console.log('\n[6/7] 对齐 (zipalign)');
await run(ZIPALIGN, ['-f', '4', path.join(B, 'base.apk'), path.join(B, 'aligned.apk')]);

console.log('\n[7/7] 签名 (apksigner)');
const KS = path.join(AND, 'keystore', 'kaoyan.keystore');
fs.mkdirSync(path.dirname(KS), { recursive: true });
if (!fs.existsSync(KS)) {
  console.log('      首次生成签名证书 —— 之后请勿删除 android/keystore/ ，否则无法覆盖升级');
  await run('keytool', ['-genkeypair', '-keystore', KS, '-alias', 'kaoyan', '-storepass', 'android',
    '-keypass', 'android', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
    '-dname', 'CN=Kaoyan408, OU=Study, O=Self, L=CN, ST=CN, C=CN']);
} else {
  console.log('      复用固定签名证书 android/keystore/kaoyan.keystore');
}
const finalApk = path.join(OUT, 'kaoyan-408.apk');
await run('cmd.exe', ['/c', APKSIGNER, 'sign', '--ks', KS, '--ks-key-alias', 'kaoyan',
  '--ks-pass', 'pass:android', '--key-pass', 'pass:android',
  '--out', finalApk, path.join(B, 'aligned.apk')]);

await run('cmd.exe', ['/c', APKSIGNER, 'verify', '--print-certs', finalApk]);

const mb = (fs.statSync(finalApk).size / 1024 / 1024).toFixed(2);
console.log(`\n✅ APK 已生成：${finalApk}  (${mb} MB)  v${VER.name} / ${VER.code}`);
