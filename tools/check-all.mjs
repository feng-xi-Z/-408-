/* 全量数据校验：语法、章节归属、答案有效性、覆盖度统计 */
import fs from 'node:fs';

const FILES = ['data-core.js', 'data-ds.js', 'data-co.js', 'data-os.js', 'data-cn.js', 'data-math.js'];
const win = { DATA: {} };
const errs = [];

for (const f of FILES) {
  const src = fs.readFileSync('web/' + f, 'utf8');
  try {
    new Function('window', src)(win);
    console.log('✅ 语法 OK', f);
  } catch (e) {
    console.log('❌ 语法错误', f, '::', e.message);
    const m = /<anonymous>:(\d+)/.exec(e.stack || '');
    if (m) {
      const lines = src.split('\n');
      const n = +m[1];
      for (let i = Math.max(0, n - 3); i < Math.min(lines.length, n + 2); i++) {
        console.log('   ' + (i + 1) + ' | ' + lines[i].slice(0, 120));
      }
    }
    process.exit(1);
  }
}

const D = win.DATA;
const SUB = D.subjects;
const problems = [];
const report = [];

for (const sid of ['ds', 'co', 'os', 'cn', 'math']) {
  const qs = D.q[sid] || [];
  const cards = D.k[sid] || [];
  const chIds = new Set((SUB[sid].chapters || []).map(c => c.id));
  const ids = new Set();
  const perCh = {};

  qs.forEach(q => {
    if (!q.id) problems.push(sid + ' 有题缺 id');
    if (ids.has(q.id)) problems.push('重复 id: ' + q.id);
    ids.add(q.id);
    if (!chIds.has(q.ch)) problems.push(`${q.id} 章节 ${q.ch} 不在 ${sid} 的章节表中`);
    if (!q.stem || q.stem.length < 4) problems.push(q.id + ' 题干过短');
    if (!Array.isArray(q.opts) || q.opts.length < 2) problems.push(q.id + ' 选项不足');
    if (q.opts && q.opts.some(o => !o || !String(o).trim())) problems.push(q.id + ' 有空选项');
    if (!Array.isArray(q.ans) || !q.ans.length) problems.push(q.id + ' 无答案');
    else q.ans.forEach(a => { if (!Number.isInteger(a) || a < 0 || a >= q.opts.length) problems.push(q.id + ' 答案越界: ' + a); });
    if (!q.ex || q.ex.length < 6) problems.push(q.id + ' 解析过短');
    if (q.opts && new Set(q.opts).size !== q.opts.length) problems.push(q.id + ' 选项有重复');
    perCh[q.ch] = (perCh[q.ch] || 0) + 1;
  });

  const cardCh = {};
  cards.forEach((c, i) => {
    if (!chIds.has(c.ch)) problems.push(`card#${i}(${c.t}) 章节 ${c.ch} 非法`);
    if (!c.t || !c.b) problems.push(`card#${i} 缺标题或正文`);
    cardCh[c.ch] = (cardCh[c.ch] || 0) + 1;
  });

  const emptyCh = [...chIds].filter(c => !perCh[c]);
  const emptyCardCh = [...chIds].filter(c => !cardCh[c]);
  report.push({
    sid, name: SUB[sid].name, q: qs.length, cards: cards.length,
    perCh, cardCh,
    emptyCh: emptyCh.length ? emptyCh : '(无)',
    emptyCardCh: emptyCardCh.length ? emptyCardCh : '(无)'
  });
}

console.log('\n=== 覆盖度 ===');
for (const r of report) {
  console.log(`${r.name.padEnd(8, '　')} 题 ${String(r.q).padStart(3)}  卡 ${String(r.cards).padStart(3)}  章节 ${Object.keys(r.perCh).length}  ` +
    `空题章: ${Array.isArray(r.emptyCh) ? r.emptyCh.join(',') : r.emptyCh}`);
  console.log('   题/章: ' + JSON.stringify(r.perCh));
}
const totQ = report.reduce((a, r) => a + r.q, 0);
const totC = report.reduce((a, r) => a + r.cards, 0);
console.log(`\n合计：${totQ} 题 / ${totC} 张卡片`);

if (problems.length) {
  console.log('\n❌ 发现 ' + problems.length + ' 个问题：');
  problems.slice(0, 60).forEach(p => console.log('  - ' + p));
  process.exit(1);
} else {
  console.log('\n✅ 数据结构校验全部通过');
}
