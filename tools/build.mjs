/* 把 web/ 下的多文件应用合并成单文件离线版 dist/kaoyan-408.html，
   并同步一份到 android/assets/ 供打包 APK 使用 */
import fs from 'node:fs';
import path from 'node:path';

const WEB = 'web';
const ORDER = ['data-core.js', 'data-ds.js', 'data-co.js', 'data-os.js', 'data-cn.js', 'data-math.js', 'app.js'];

let html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(WEB, 'app.css'), 'utf8');

const js = ORDER.map(f => {
  const code = fs.readFileSync(path.join(WEB, f), 'utf8');
  if (!code.trim()) throw new Error(f + ' 是空的');
  return `/* ===== ${f} ===== */\n${code}`;
}).join('\n;\n');

// 版本号唯一来源：android/version.json
const VER = JSON.parse(fs.readFileSync(path.join('android', 'version.json'), 'utf8'));

// 防止内容里出现提前闭合 <script> 的序列
const safeJs = js.replace(/__APP_VERSION__/g, VER.name).replace(/<\/script/gi, '<\\/script');
const safeCss = css.replace(/<\/style/gi, '<\\/style');

html = html.replace('<link rel="stylesheet" href="app.css">', `<style>\n${safeCss}\n</style>`);
html = html.replace(/[ \t]*<script src="[^"]*"><\/script>\r?\n?/g, '');
html = html.replace('</body>', `<script>\n${safeJs}\n</script>\n</body>`);

fs.mkdirSync('dist', { recursive: true });
const out = 'dist/kaoyan-408.html';
fs.writeFileSync(out, html, 'utf8');

fs.mkdirSync('android/assets', { recursive: true });
fs.writeFileSync('android/assets/kaoyan.html', html, 'utf8');

const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`✅ ${out}  ${kb} KB  (v${VER.name} / versionCode ${VER.code})`);
console.log(`   内联 CSS ${(css.length / 1024).toFixed(1)}KB + JS ${(js.length / 1024).toFixed(1)}KB`);
if (html.includes('src="app.js"') || html.includes('href="app.css"')) {
  console.error('❌ 仍有未内联的外部引用');
  process.exit(1);
}
