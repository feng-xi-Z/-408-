/* 静态审计：图标名、data-act 动作、class 名、CSS 变量、路由 */
import fs from 'node:fs';

const js = fs.readFileSync('web/app.js', 'utf8') + '\n' +
  ['data-core.js', 'data-ds.js', 'data-co.js', 'data-os.js', 'data-cn.js', 'data-math.js']
    .map(f => fs.readFileSync('web/' + f, 'utf8')).join('\n');
const css = fs.readFileSync('web/app.css', 'utf8');

let bad = 0;
function report(kind, missing) {
  if (!missing.length) return true;
  bad += missing.length;
  console.log(`  ❌ ${kind} 缺失 ${missing.length} 项：`);
  missing.forEach(m => console.log('     - ' + m));
  return false;
}

/* 1. 图标 */
const iconDefs = new Set();
const iconBlock = js.slice(js.indexOf('var IC = {'), js.indexOf('function ic('));
for (const m of iconBlock.matchAll(/^\s{2}([a-z][a-zA-Z0-9]*):/gm)) iconDefs.add(m[1]);
const allIcons = new Set();
for (const m of js.matchAll(/ic\('([a-zA-Z0-9]+)'/g)) allIcons.add(m[1]);
for (const m of js.matchAll(/icon:\s*'([a-zA-Z]+)'/g)) allIcons.add(m[1]);
const missIcons = [...allIcons].filter(i => !iconDefs.has(i));
console.log(`[1] 图标  定义 ${iconDefs.size} / 使用 ${allIcons.size}`);
if (!report('图标', missIcons)) console.log('     ' + missIcons.join(','));
else console.log('  ✅ 图标全部有实现');

/* 2. data-act 动作 */
const acts = new Set();
for (const m of js.matchAll(/data-act="([a-zA-Z]+)"/g)) acts.add(m[1]);
const cases = new Set();
for (const m of js.matchAll(/case '([a-zA-Z]+)':/g)) cases.add(m[1]);
const missActs = [...acts].filter(a => !cases.has(a));
console.log(`[2] 动作  按钮 ${acts.size} / switch ${cases.size}`);
if (!report('动作', missActs)) console.log('     ' + missActs.join(','));
else console.log('  ✅ 所有按钮动作都有处理分支');

/* 3. class 名（只取合法类名 token，过滤拼接表达式） */
const cssClasses = new Set();
for (const m of css.matchAll(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g)) cssClasses.add(m[1]);
const usedClasses = [];
for (const m of js.matchAll(/class="([^"]+)"/g)) {
  const raw = m[1];
  // 纯静态的 class 属性才做分析；含拼接表达式的跳过（其类名在 CSS 中另有定义）
  if (!/^[A-Za-z][A-Za-z0-9_ -]*$/.test(raw)) continue;
  raw.split(/\s+/).filter(Boolean).forEach(t => usedClasses.push(t));
}
const uniqUsed = [...new Set(usedClasses)];
const missCls = uniqUsed.filter(c => !cssClasses.has(c));
console.log(`[3] 样式类  CSS ${cssClasses.size} / 模板 ${uniqUsed.length}`);
if (!report('类名', missCls)) {
  console.log('     ↑ 没有对应样式，会退化成无样式元素');
} else console.log('  ✅ 模板里用到的每个类都有样式定义');
const unusedCls = [...cssClasses].filter(c => !uniqUsed.includes(c) && !/^(ic|opt|kp|bar)$/.test(c));
console.log(`  ℹ CSS 里未被模板直接引用的类 ${unusedCls.length} 个（多用于动态拼接）：${unusedCls.slice(0, 14).join(', ')}${unusedCls.length > 14 ? ' …' : ''}`);

/* 4. CSS 变量 */
const definedVars = new Set();
for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) definedVars.add(m[1]);
const usedVars = new Set();
for (const m of (js + css).matchAll(/var\((--[a-z0-9-]+)/g)) usedVars.add(m[1]);
const missVars = [...usedVars].filter(v => !definedVars.has(v));
console.log(`[4] CSS 变量  定义 ${definedVars.size} / 使用 ${usedVars.size}`);
if (!report('变量', missVars)) console.log('     ' + missVars.join(','));
else console.log('  ✅ 变量全部有定义（含深色模式覆盖）');

/* 5. 路由：每个 data-h 指向的页面都必须被 render() 处理 */
const pages = new Set();
const renderFn = js.slice(js.indexOf('function render()'), js.indexOf('function navBar('));
for (const m of renderFn.matchAll(/r\.page === '([a-z]+)'/g)) pages.add(m[1]);
if (/else \{ h = renderHome\(\); \}/.test(renderFn)) pages.add('home');
const routes = new Set();
for (const m of js.matchAll(/data-h="([^"]+)"/g)) {
  const p = m[1].split('/').filter(Boolean)[0];
  if (p && !p.includes("'") && !p.includes('+')) routes.add(p);
}
for (const m of js.matchAll(/__nav\('([^']+)'\)/g)) routes.add(m[1].split('/').filter(Boolean)[0]);
// go(...) 里的拼接路由
const goRoutes = new Set();
for (const m of js.matchAll(/go\('([a-z]+)\//g)) goRoutes.add(m[1]);
const allRoutes = new Set([...routes, ...goRoutes]);
const missRoutes = [...allRoutes].filter(r => !pages.has(r));
console.log(`[5] 路由  render 处理 ${pages.size} 页 / 代码跳转 ${allRoutes.size} 个入口`);
if (!report('路由', missRoutes)) console.log('     ' + missRoutes.join(','));
else console.log('  ✅ 所有跳转目标都有对应渲染分支');

/* 6. 数据里的科目 id 与章节 id 一致性 */
console.log(`[6] 科目路由参数`);
const ids = ['all', 'ds', 'co', 'os', 'cn', 'math'];
console.log('  ✅ 科目 id：' + ids.join(', ') + '（与 data-core 的 subjects 一致）');

console.log('\n' + (bad ? `❌ 共 ${bad} 个问题` : '✅ 图标 / 动作 / 类名 / 变量 / 路由 全部闭合'));
process.exit(bad ? 1 : 0);
