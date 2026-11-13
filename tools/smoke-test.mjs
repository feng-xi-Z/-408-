/* 用 jsdom 真实加载单文件应用并模拟操作，验证渲染与答题链路 */
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync('dist/kaoyan-408.html', 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://appassets.androidplatform.net/kaoyan.html',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.scrollTo = () => {};
    window.HTMLElement.prototype.scrollTo = () => {};
  }
});
const { window } = dom;
const doc = window.document;

const fails = [];
function ok(cond, msg) {
  if (cond) console.log('  ✅ ' + msg);
  else { console.log('  ❌ ' + msg); fails.push(msg); }
}
function click(el) {
  if (!el) throw new Error('要点击的元素不存在');
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}
function q(sel) { return doc.querySelector(sel); }
function text() { return (doc.getElementById('app') || {}).textContent || ''; }
function byAct(act, scope) { return [...(scope || doc).querySelectorAll('[data-act="' + act + '"]')]; }

await new Promise(r => setTimeout(r, 400));

console.log('\n[1] 数据装载');
const D = window.DATA;
ok(D && D.subjects, 'DATA.subjects 存在');
const totQ = Object.values(D.q).reduce((a, b) => a + b.length, 0);
const totC = Object.values(D.k).reduce((a, b) => a + b.length, 0);
ok(totQ > 150, `题库共 ${totQ} 题`);
ok(totC > 100, `卡片共 ${totC} 张`);

console.log('\n[2] 首页渲染');
ok(!!q('.hero'), 'Hero 卡片渲染');
ok(text().includes('模拟题练习'), '入口 1：模拟题练习');
ok(text().includes('知识点速查'), '入口 2：知识点速查');
ok(text().includes('408 综合'), '首页出现 408 综合');
ok(doc.querySelectorAll('.subj').length === 6, '首页 1 张综合卡 + 5 个单科入口');

console.log('\n[3] 进入模拟题练习（二级科目选择）');
click([...doc.querySelectorAll('.entry')].find(e => e.textContent.includes('模拟题练习')));
ok(text().includes('单科专项'), '进入科目选择页');
const rows = [...doc.querySelectorAll('.row')].map(r => r.textContent.replace(/\s+/g, ' '));
ok(rows.some(r => r.includes('408 综合')), '二级页含 408 综合');
for (const n of ['数据结构', '计算机组成原理', '操作系统', '计算机网络', '高等数学']) {
  ok(rows.some(r => r.includes(n)), '二级页含 ' + n);
}

console.log('\n[4] 进入数据结构科目详情');
click([...doc.querySelectorAll('.row')].find(r => r.textContent.includes('数据结构')));
ok(text().includes('开始整卷练习'), '有整卷练习按钮');
ok(doc.querySelectorAll('.ch-row').length === 8, '章节列表 8 章');

console.log('\n[5] 开始答题');
click([...doc.querySelectorAll('.ch-row')].find(e => e.textContent.includes('绪论')));
ok(!!q('.q-stem'), '题干渲染');
ok(doc.querySelectorAll('.opt').length === 4, '选项 4 个');
const stemText = q('.q-stem').textContent;

console.log('\n[6] 作答并判定（故意选错）');
const Q = D.q.ds.find(x => x.id === 'ds-101');
const wrongIdx = [0, 1, 2, 3].find(i => !Q.ans.includes(i));
click([...doc.querySelectorAll('.opt')][wrongIdx]);
ok(text().includes('回答错误'), '判错提示出现');
ok(!!q('.explain'), '解析面板展开');
ok(text().includes('正确答案'), '显示正确答案');
ok(window.localStorage.getItem('ky408_v1') !== null, '答题记录已写入本地存储');
const saved = JSON.parse(window.localStorage.getItem('ky408_v1'));
ok(Object.keys(saved.wrong).length === 1, '错题已收录');
ok(saved.stats.total === 1, '统计累计 1 题');
ok(saved.done['ds-101'] === 1, '已练记录标记');

console.log('\n[7] 下一题');
click([...doc.querySelectorAll('.btn')].find(b => b.textContent.includes('下一题')));
ok(q('.q-stem').textContent !== stemText, '切到下一题');
ok(q('.cnt').textContent.includes('2/'), '题号前进到 2');

console.log('\n[8] 答题卡抽屉');
click(byAct('card')[0]);
ok(!!doc.getElementById('sheet'), '答题卡抽屉打开');
const introCount = D.q.ds.filter(x => x.ch === 'ds-1').length;
ok(doc.querySelectorAll('.jg').length === introCount, `答题卡 ${introCount} 个格子（绪论 ${introCount} 题）`);
ok(!!q('.jg.ok') || !!q('.jg.bad'), '已答题有对错标记');
click(byAct('jump', doc.getElementById('sheet'))[0]);
await new Promise(r => setTimeout(r, 250));
ok(!doc.getElementById('sheet'), '跳题后抽屉关闭');

console.log('\n[9] 返回并进入知识点速查');
window.__back();
ok(text().includes('开始整卷练习'), '回到科目详情');
window.__nav('/memory');
ok(text().includes('知识点速查'), '进入速背科目选择');
click([...doc.querySelectorAll('.row')].find(r => r.textContent.includes('计算机组成原理')));
ok(text().includes('按章节'), '进入计组速背页');
ok(doc.querySelectorAll('.ch-row').length === 7, '计组速背 7 章');
click([...doc.querySelectorAll('.ch-row')].find(e => e.textContent.includes('存储系统')));
ok(doc.querySelectorAll('.kp').length > 0, `存储系统 ${doc.querySelectorAll('.kp').length} 张卡片`);
ok(text().includes('Cache'), '卡片正文含 Cache');
ok(doc.querySelectorAll('.kp-table').length >= 1, `卡片里的表格已渲染为真表格（${doc.querySelectorAll('.kp-table').length} 个）`);
ok(!text().includes('|---|'), '不再把 Markdown 分隔行当正文显示');
ok(doc.querySelectorAll('.kp-table th').length >= 3, `表头 ${doc.querySelectorAll('.kp-table th').length} 列`);

console.log('\n[9b] 其余科目表格与版本号');
window.__nav('/memory/os/os-6');
ok(doc.querySelectorAll('.kp-table').length >= 1, '操作系统「分段 vs 分页」对照表已渲染');
window.__nav('/memory/cn/cn-5');
ok(doc.querySelectorAll('.kp-table').length >= 1, '计网「TCP vs UDP」对照表已渲染');
window.__nav('/me');
ok(/v1\.0\.\d{2}/.test(text()), '关于页显示 v1.0.xx 版本号：' + (text().match(/v1\.0\.\d{2}/) || [''])[0]);

console.log('\n[10] 收藏与搜索');
window.__nav('/memory/co/co-3');
ok(!!doc.querySelector('.kp .star'), '回到卡片列表，收藏按钮存在');
click(doc.querySelector('.kp .star'));
const st2 = JSON.parse(window.localStorage.getItem('ky408_v1'));
ok(Object.keys(st2.fav).length === 1, '收藏已保存');
const kw = doc.getElementById('kw');
kw.value = '流水线';
kw.dispatchEvent(new window.Event('input', { bubbles: true }));
ok(doc.getElementById('kplist').textContent.includes('流水线'), '搜索「流水线」命中');
kw.value = 'zzzzzz';
kw.dispatchEvent(new window.Event('input', { bubbles: true }));
ok(doc.getElementById('kplist').textContent.includes('没有匹配'), '无结果时给出空状态');

console.log('\n[11] 翻卡模式');
window.__nav('/flip/co/all');
ok(!!q('.flipcard'), '翻卡卡片渲染');
const flipT = q('.flipcard h2').textContent;
const nextBtn = [...doc.querySelectorAll('.btn')].find(b => b.textContent.includes('下一张'));
click(nextBtn);
ok(q('.flipcard h2').textContent !== flipT, '翻到下一张');
click(byAct('shuffle')[0]);
ok(!!q('.flipcard'), '打乱后仍正常渲染');

console.log('\n[12] 错题本 + 题目详解');
window.__nav('/wrong');
ok(text().includes('错题本'), '错题本页');
ok(text().includes('正确答案'), '错题含答案');
ok(doc.querySelectorAll('.ansopt').length >= 4, `错题本里能看到选项内容（${doc.querySelectorAll('.ansopt').length} 项）`);
ok(!!doc.querySelector('.ansopt.ok'), '正确选项有绿色标记');
const wrongCard = doc.querySelector('.qcard[data-act="go"]');
ok(!!wrongCard, '错题卡片可点击');
click(wrongCard);
ok(text().includes('题目详解'), '跳转到题目详解页');
ok(!!q('.q-stem'), '详解页有题干');
ok(doc.querySelectorAll('.opt').length === 4, '详解页给出可作答的选项');
ok(text().includes('同类题'), '详解页有同类题');
ok(doc.querySelectorAll('.miniq').length > 0, `同类题 ${doc.querySelectorAll('.miniq').length} 道`);
ok(text().includes('相关知识点'), '详解页有相关知识点');
ok(doc.querySelectorAll('.kp').length > 0, `相关知识点卡片 ${doc.querySelectorAll('.kp').length} 张`);
click([...doc.querySelectorAll('.opt')][0]);
ok(/回答正确|回答错误/.test(text()), '详解页可以作答并判定');
ok(!!q('.explain'), '详解页判定后展示解析');
click([...doc.querySelectorAll('.miniq')][0]);
ok(text().includes('题目详解') && !!q('.q-stem'), '可继续跳转到同类题');
window.__nav('/me');
ok(text().includes('各科进度'), '我的页含各科进度');
ok(text().includes('累计答题'), '我的页含统计');
ok(text().includes('研途 408'), '关于信息存在');
ok(!text().includes('操作系 ') && !/操作系[^统]/.test(text().replace(/操作系统/g, 'OS')), '「操作系统」名称完整');

console.log('\n[13] 408 综合组卷');
window.__startQuiz('all', 'all');
ok(!!q('.q-stem'), '408 综合卷可答题');
ok(text().includes('408 综合'), '卷面标题为 408 综合');
const total = D.compositePlan.reduce((a, p) => a + p.n, 0);
ok(q('.cnt').textContent.includes('/' + total), `卷面题量 ${total} 题（按真实配比）`);

console.log('\n[14] 交卷结果页');
for (let i = 0; i < total; i++) {
  const opts = [...doc.querySelectorAll('.opt')];
  if (opts.length) click(opts[0]);
  const nb = [...doc.querySelectorAll('.btn')].find(b => b.textContent.includes('下一题') || b.textContent.includes('查看结果'));
  if (!nb) break;
  click(nb);
}
ok(text().includes('正确率'), '结果页显示正确率');
ok(!!q('.res-stats') || text().includes('答对'), '结果页显示统计');
ok(text().includes('错题回顾') || text().includes('全对'), '结果页有错题回顾或全对提示');
ok(text().includes('回到首页'), '结果页有一键回首页');
ok(text().includes('返回本科目'), '结果页有返回本科目');
ok(doc.querySelectorAll('.ansopt').length > 0, '结果页错题回顾也展示选项');
click([...doc.querySelectorAll('[data-act="go"]')].find(b => b.getAttribute('data-h') === '/'));
ok(!!q('.hero'), '点「回到首页」确实回到首页');

console.log('\n' + (fails.length ? `❌ ${fails.length} 项失败：\n  - ` + fails.join('\n  - ') : '✅ 全部交互测试通过'));
process.exit(fails.length ? 1 : 0);
