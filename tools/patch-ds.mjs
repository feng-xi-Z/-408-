/* 校正 data-ds.js 中自评存疑的题目，并重写为规范格式 */
import fs from 'node:fs';

const P = 'web/data-ds.js';
const src = fs.readFileSync(P, 'utf8');
const win = { DATA: {} };
new Function('window', src)(win);
const ds = win.DATA.q.ds, cards = win.DATA.k.ds;
const byId = {};
ds.forEach(q => { byId[q.id] = q; });

Object.assign(byId['ds-305'], {
  stem: '元素 1、2、3、4 依次入栈（入栈过程中允许出栈），下列出栈序列中不可能出现的是（　）。',
  opts: ['1,2,3,4', '2,3,4,1', '3,2,1,4', '4,1,2,3'],
  ans: [3],
  ex: '序列中出现 4 先出栈，说明 1、2、3、4 已全部入栈，此时栈内自底向上为 1、2、3，出栈只能按 3、2、1 的顺序进行，所以 4 之后不可能紧接 1。其余三项都能通过控制入出栈时机实现。'
});
Object.assign(byId['ds-403'], {
  stem: '串是一种特殊的线性表，其特殊性主要体现在（　）。',
  opts: ['数据元素个数有限', '数据元素本身是单个字符', '可以顺序存储或链式存储', '串的长度可以为 0'],
  ans: [1],
  ex: '串是元素为字符的线性表，这一点区别于一般线性表。空串（长度 0）与空格串（只含空格）不同，但「长度可为 0」并非串独有的性质。'
});
Object.assign(byId['ds-501'], {
  stem: '一棵二叉树中有 20 个度为 1 的结点、10 个叶子结点，则该二叉树的结点总数为（　）。',
  opts: ['39', '40', '41', '无法确定'],
  ans: [0],
  ex: '设度为 0、1、2 的结点数分别为 n0、n1、n2。已知 n0=10、n1=20；由 n0 = n2 + 1 得 n2 = 9。于是总数 = 10 + 20 + 9 = 39。'
});
Object.assign(byId['ds-504'], {
  stem: '对权值集合 {2,3,4,5,6} 构造哈夫曼树，其带权路径长度 WPL 为（　）。',
  opts: ['45', '42', '40', '36'],
  ans: [0],
  ex: '合并过程：2+3=5 → {4,5,5,6}；4+5=9 → {5,6,9}；5+6=11 → {9,11}；9+11=20。WPL 等于各次合并所得新结点权值之和：5+9+11+20 = 45。'
});
Object.assign(byId['ds-705'], {
  stem: '采用开放定址法处理冲突的散列表，其平均查找长度主要取决于（　）。',
  opts: ['关键字的总个数 n', '散列表的长度 m', '装填因子 α 与冲突处理方法', '关键字的取值分布'],
  ans: [2],
  ex: 'ASL 只与装填因子 α = n/m 和冲突处理方法有关，而与 n、m 的绝对大小无关——这正是散列表「以空间换时间」的理论依据。'
});
Object.assign(byId['ds-803'], {
  stem: '对序列 {49,38,65,97,76,13,27,49} 按首元素 49 为基准进行一趟快速排序（挖坑填数法），结果是（　）。',
  opts: ['{13,27,38,49,49,76,97,65}', '{27,38,13,49,97,76,65,49}', '{27,13,38,49,97,76,49,65}', '{49,38,27,13,49,65,76,97}'],
  ans: [1],
  ex: '挖坑法：右端找 <49 的 27 填到左坑 → 左端找 >49 的 65 填到右坑 → 右端找 <49 的 13 填到左坑 → 左端找 >49 的 97 填到右坑 → 两指针相遇于位置 3，填入基准 49。结果 {27,38,13,49,97,76,65,49}，且左侧全部 ≤49、右侧全部 ≥49、基准已就位。'
});
Object.assign(byId['ds-805'], {
  stem: '对 20000 个记录做外部排序，内存一次最多容纳 1000 个记录，采用 10 路归并，则归并趟数为（　）。',
  opts: ['1', '2', '3', '4'],
  ans: [1],
  ex: '初始归并段数 r = ⌈20000/1000⌉ = 20 段。归并趟数 S = ⌈log₁₀ 20⌉ = 2（10 路第一趟合并出 2 段，第二趟合并为 1 段）。'
});

/* ---- 校验 ---- */
const problems = [];
ds.forEach(q => {
  if (!q.opts || q.opts.length < 2) problems.push(q.id + ' opts 不足');
  if (!q.ans || !q.ans.length) problems.push(q.id + ' 缺答案');
  q.ans.forEach(a => { if (a < 0 || a >= q.opts.length) problems.push(q.id + ' 答案越界 ' + a); });
  if (!q.ex) problems.push(q.id + ' 缺解析');
  if (!/^ds-[1-8]$/.test(q.ch)) problems.push(q.id + ' 章节非法 ' + q.ch);
});
const chSet = new Set(['ds-1', 'ds-2', 'ds-3', 'ds-4', 'ds-5', 'ds-6', 'ds-7', 'ds-8']);
cards.forEach((c, i) => {
  if (!chSet.has(c.ch)) problems.push('card#' + i + ' 章节非法 ' + c.ch);
  if (!c.t || !c.b) problems.push('card#' + i + ' 缺标题或正文');
});
const per = {};
ds.forEach(q => { per[q.ch] = (per[q.ch] || 0) + 1; });

const out = `/* 数据结构 · 题库 + 速背卡片 */
window.DATA.q = window.DATA.q || {};
window.DATA.k = window.DATA.k || {};

window.DATA.q.ds = [
${ds.map(q => '  ' + JSON.stringify(q)).join(',\n')}
];

window.DATA.k.ds = [
${cards.map(c => '  ' + JSON.stringify(c)).join(',\n')}
];
`;
fs.writeFileSync(P, out, 'utf8');
console.log('题目数:', ds.length, ' 卡片数:', cards.length);
console.log('每章题数:', JSON.stringify(per));
console.log('卡片每章:', JSON.stringify(cards.reduce((a, c) => (a[c.ch] = (a[c.ch] || 0) + 1, a), {})));
console.log(problems.length ? '❌ 问题:\n' + problems.join('\n') : '✅ 校验通过');
