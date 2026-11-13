/* ============================================================
   研途 408 · 应用逻辑
   ============================================================ */
(function () {
'use strict';

var D = window.DATA;
var APP = document.getElementById('app');
var TOAST = document.getElementById('toast');
var APP_VER = '__APP_VERSION__';   /* 构建时由 tools/build.mjs 用 version.json 替换 */

/* ---------------- 工具 ---------------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

/* 轻量标记：**粗体**  `代码`  __高亮__  !!提示  / - 列表 / | 表格 | / 空行分段 */
function rich(s, cls) {
  var lines = String(s == null ? '' : s).split('\n');
  var out = [], listOpen = false;
  function closeList() { if (listOpen) { out.push('</ul>'); listOpen = false; } }
  function inline(t) {
    t = esc(t);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    t = t.replace(/__([^_]+)__/g, '<span class="hl">$1</span>');
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    return t;
  }
  /* 表格行：以 | 开头、且至少有两个 | */
  function isRow(t) { return t.charAt(0) === '|' && t.lastIndexOf('|') > 0; }
  /* 分隔行：|---|---| 或 | :--- | ---: | */
  function isSep(t) {
    return isRow(t) && t.replace(/[|\s:-]/g, '') === '' && t.indexOf('-') >= 0;
  }
  function cells(t) {
    return t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (x) { return x.trim(); });
  }
  function table(rows) {
    var head = null, body = rows;
    if (rows.length > 1 && isSep(rows[1])) { head = cells(rows[0]); body = rows.slice(2); }
    var h = '<div class="kp-table-wrap"><table class="kp-table">';
    if (head) {
      h += '<thead><tr>' + head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead>';
    }
    h += '<tbody>' + body.map(function (r) {
      return '<tr>' + cells(r).map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
    return h;
  }
  var i = 0;
  while (i < lines.length) {
    var t = lines[i].trim();
    if (!t) { closeList(); i++; continue; }
    if (t.indexOf('!!') === 0) {
      closeList(); out.push('<span class="tip">' + inline(t.slice(2).trim()) + '</span>'); i++; continue;
    }
    if (t.indexOf('- ') === 0) {
      if (!listOpen) { out.push('<ul>'); listOpen = true; }
      out.push('<li>' + inline(t.slice(2)) + '</li>'); i++; continue;
    }
    if (isRow(t)) {
      closeList();
      var rows = [];
      while (i < lines.length && isRow(lines[i].trim())) { rows.push(lines[i].trim()); i++; }
      out.push(table(rows));
      continue;
    }
    closeList();
    out.push(inline(t));
    i++;
  }
  closeList();
  return cls ? '<div class="' + cls + '">' + out.join('') + '</div>' : out.join('');
}

function fmtTime(ms) {
  var s = Math.max(0, Math.round(ms / 1000));
  var m = Math.floor(s / 60), ss = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
}
function today() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function daysTo(dateStr) {
  var t = new Date(dateStr + 'T00:00:00').getTime() - Date.now();
  return Math.max(0, Math.ceil(t / 86400000));
}
function shuffle(a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function toast(msg) {
  TOAST.textContent = msg;
  TOAST.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { TOAST.classList.remove('on'); }, 1700);
}
function haptic(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms || 8); } catch (e) {} } }

/* ---------------- 图标 ---------------- */
var IC = {
  home: '<path d="M3 10.5 12 3.2l9 7.3V20a1 1 0 0 1-1 1h-4.6v-6.2H8.6V21H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 5.2A1.8 1.8 0 0 1 5.8 3.4H20v13.4H5.8A1.8 1.8 0 0 0 4 18.6z"/><path d="M4 18.6A1.8 1.8 0 0 1 5.8 20.4H20"/>',
  edit: '<path d="M4 20h4.2L20 8.2 15.8 4 4 15.8z"/><path d="M13.6 6.2 17.8 10.4"/>',
  chart: '<path d="M4 20V11M9.3 20V5M14.7 20v-6.5M20 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.2 21c0-4.1 3.5-6.3 7.8-6.3s7.8 2.2 7.8 6.3"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  star: '<path d="M12 3.2l2.85 5.9 6.45.9-4.7 4.5 1.15 6.4-5.75-3.1-5.75 3.1 1.15-6.4L3.7 10l6.45-.9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
  check: '<path d="M4.5 12.5l4.8 4.8L19.5 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7.6"/><path d="M21 21l-4.4-4.4"/>',
  shuffle: '<path d="M16.5 3.5H21v4.5M3.5 20.5 21 3M21 16.5V21h-4.5M14.5 14.5 21 21M3.5 3.5l4.6 4.6"/>',
  flame: '<path d="M12 22c4.1 0 7-2.8 7-6.6 0-4-2.9-5.9-4.4-8.4C13.2 4.3 13.2 2 12 2c0 3.1-2 4.7-3.5 7.2C7 11.7 5 12.8 5 15.4 5 19.2 7.9 22 12 22z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.2"/>',
  refresh: '<path d="M20.5 12a8.5 8.5 0 0 1-14.6 6.1M3.5 12a8.5 8.5 0 0 1 14.6-6.1"/><path d="M20.5 3.4v5.2h-5.2M3.5 20.6v-5.2h5.2"/>',
  trash: '<path d="M4 6.8h16M9.2 6.8V3.9h5.6v2.9M6.4 6.8l.9 14.3h9.4l.9-14.3"/>',
  moon: '<path d="M20.5 14.4A8.7 8.7 0 1 1 9.6 3.5a6.9 6.9 0 0 0 10.9 10.9z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>',
  tree: '<path d="M12 3v5M12 8 6.5 12M12 8l5.5 4M6.5 12v3.5M17.5 12v3.5"/><path d="M3.6 21h5.8v-3.6H3.6zM14.6 21h5.8v-3.6h-5.8z"/>',
  cpu: '<rect x="4.6" y="4.6" width="14.8" height="14.8" rx="2.4"/><rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1"/><path d="M9 2v2.6M15 2v2.6M9 19.4V22M15 19.4V22M2 9h2.6M2 15h2.6M19.4 9H22M19.4 15H22"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.6a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.03z"/>',
  network: '<circle cx="12" cy="4.6" r="2.6"/><circle cx="4.8" cy="19" r="2.6"/><circle cx="19.2" cy="19" r="2.6"/><path d="M12 7.2v4.4M12 11.6 6.4 16.6M12 11.6l5.6 5"/>',
  sigma: '<path d="M18.4 4H6.6l6.2 8-6.2 8h11.8"/>',
  layers: '<path d="M12 3 21 8l-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  play: '<path d="M8 5.2l11.2 6.8L8 18.8z"/>',
  list: '<path d="M8.6 6.4H21M8.6 12H21M8.6 17.6H21"/><circle cx="4" cy="6.4" r="1.1"/><circle cx="4" cy="12" r="1.1"/><circle cx="4" cy="17.6" r="1.1"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  filter: '<path d="M3.6 5.4h16.8l-6.6 7.8v6.4l-3.6 1.8v-8.2z"/>',
  zap: '<path d="M13.4 2.4 4.6 13.8h6.2l-1.2 7.8 9-11.4h-6.4z"/>',
  bookmark: '<path d="M6 3.6h12v17l-6-4.2-6 4.2z"/>',
  card: '<rect x="2.6" y="5.6" width="18.8" height="12.8" rx="2.4"/><path d="M2.6 9.8h18.8"/>',
  back: '<path d="M15 19l-7-7 7-7"/>',
  clock2: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 1.9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.4M12 7.8v.2"/>'
};
function ic(n, sz) {
  return '<svg class="ic" viewBox="0 0 24 24" width="' + (sz || 20) + '" height="' + (sz || 20) + '">' + (IC[n] || '') + '</svg>';
}

/* ---------------- 存储 ---------------- */
var KEY = 'ky408_v1';
var ST = loadST();
function loadST() {
  try {
    var o = JSON.parse(localStorage.getItem(KEY));
    if (!o) throw 0;
    o.wrong = o.wrong || {}; o.fav = o.fav || {}; o.stats = o.stats || { total: 0, right: 0, days: {} };
    o.stats.days = o.stats.days || {};
    return o;
  } catch (e) {
    return { wrong: {}, fav: {}, stats: { total: 0, right: 0, days: {} }, theme: null, last: null };
  }
}
function saveST() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }

function statDay() {
  var d = today();
  if (!ST.stats.days[d]) ST.stats.days[d] = { n: 0, r: 0 };
  return ST.stats.days[d];
}
function recordAnswer(q, ok, picks) {
  ST.stats.total++; if (ok) ST.stats.right++;
  var d = statDay(); d.n++; if (ok) d.r++;
  if (!ok) {
    var w = ST.wrong[q.id] || { c: 0, t: 0 };
    w.c++; w.t = Date.now();
    if (picks && picks.length) w.p = picks.slice();
    ST.wrong[q.id] = w;
  }
  saveST();
}

/* ---------------- 数据索引 ---------------- */
var SUB = D.subjects;
var QINDEX = {}, QLIST = {}, CLIST = {};
function buildIndex() {
  Object.keys(D.q || {}).forEach(function (sid) {
    var arr = D.q[sid] || [];
    QLIST[sid] = arr;
    arr.forEach(function (q) { q.sid = sid; QINDEX[q.id] = q; });
  });
  ['ds', 'co', 'os', 'cn', 'math'].forEach(function (sid) { CLIST[sid] = (D.k && D.k[sid]) || []; });
}
function qOf(sid) { return QLIST[sid] || []; }
function cardsOf(sid) {
  if (sid === 'all') {
    var out = [];
    (SUB.all.from || []).forEach(function (s) { out = out.concat(CLIST[s] || []); });
    return out;
  }
  return CLIST[sid] || [];
}
function chName(sid, chId) {
  if (sid === 'all') {
    for (var i = 0; i < SUB.all.from.length; i++) {
      var s = SUB.all.from[i], ch = (SUB[s].chapters || []).filter(function (c) { return c.id === chId; })[0];
      if (ch) return ch.n;
    }
    return '综合';
  }
  var cs = (SUB[sid] && SUB[sid].chapters) || [];
  for (var j = 0; j < cs.length; j++) if (cs[j].id === chId) return cs[j].n;
  return '未分类';
}
function subjShort(q) { var s = SUB[q.sid]; return s ? s.short : ''; }

/* 组卷 */
function buildPaper(sid, chId) {
  if (sid === 'all') {
    var out = [];
    (D.compositePlan || []).forEach(function (p) {
      var pool = qOf(p.sid), picked = shuffle(pool).slice(0, p.n);
      out = out.concat(picked);
    });
    return shuffle(out);
  }
  var list = chId && chId !== 'all' ? qOf(sid).filter(function (q) { return q.ch === chId; }) : qOf(sid);
  return chId === 'all' ? shuffle(list) : list;
}

/* ---------------- 路由 ---------------- */
var STACK = ['/'];
function curHash() { return STACK[STACK.length - 1]; }
function parse(h) {
  var parts = (h || '/').replace(/^#/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { page: parts[0] || 'home', a: parts[1] || null, b: parts[2] || null };
}
function go(h) {
  h = h.replace(/^#?\/*/, '/');
  if (h === STACK[STACK.length - 1]) return;
  STACK.push(h);
  if (STACK.length > 40) STACK.shift();
  try { history.replaceState(null, '', '#' + h); } catch (e) {}
  render();
}
function goReplace(h) {
  STACK[STACK.length - 1] = h.replace(/^#?\/*/, '/');
  try { history.replaceState(null, '', '#' + h); } catch (e) {}
  render();
}
function back() {
  if (STACK.length > 1) STACK.pop();
  try { history.replaceState(null, '', '#' + curHash()); } catch (e) {}
  render();
}
window.__back = function () { if (STACK.length > 1) { back(); return true; } return false; };

/* ---------------- 渲染 ---------------- */
var scrollMap = {};
function render() {
  var r = parse(curHash());
  var html = '', h = '';
  if (r.page === 'home') { h = renderHome(); }
  else if (r.page === 'practice') { h = r.a ? renderSubjectPractice(r.a) : renderSubjectPick('practice'); }
  else if (r.page === 'quiz') { h = renderQuiz(); }
  else if (r.page === 'result') { h = renderResult(); }
  else if (r.page === 'memory') { h = r.b ? renderCardList(r.a, r.b) : (r.a ? renderMemorySubject(r.a) : renderSubjectPick('memory')); }
  else if (r.page === 'flip') { h = renderFlip(r.a, r.b); }
  else if (r.page === 'wrong') { h = renderWrong(); }
  else if (r.page === 'q') { h = renderQuestionDetail(r.a); }
  else if (r.page === 'fav') { h = renderFav(); }
  else if (r.page === 'me') { h = renderMe(); }
  else { h = renderHome(); }
  APP.innerHTML = h;
  window.scrollTo(0, 0);
  afterRender(r);
}

function navBar(title, opt) {
  opt = opt || {};
  var left = '';
  if (opt.back !== false) left = '<button class="nav-btn" data-act="back">' + ic('back', 22) + '</button>';
  else left = '<div style="width:38px"></div>';
  return '<div class="nav">' + left +
    '<div class="nav-title">' + esc(title) + (opt.sub ? '<small>' + esc(opt.sub) + '</small>' : '') + '</div>' +
    '<div class="nav-right">' + (opt.right || '') + '</div></div>';
}

/* ---------- 首页 ---------- */
var EXAM_DATE = '2026-12-19';
function renderHome() {
  var dd = daysTo(EXAM_DATE);
  var d = statDay();
  var acc = d.n ? Math.round(d.r / d.n * 100) : 0;
  var totalQ = 0;
  (D.subjectOrder || []).forEach(function (s) { totalQ += qOf(s).length; });

  var subGrid = '<button class="subj wide" data-act="go" data-h="/practice/all">' +
    '<span class="em" style="background:' + SUB.all.soft + ';color:' + SUB.all.color + '">' + ic('layers', 22) + '</span>' +
    '<span class="tx"><b>408 综合</b><span>四科合卷 · 数据结构/计组/操作系统/计网</span></span>' +
    '<span class="pill" style="background:' + SUB.all.soft + ';color:' + SUB.all.color + '">推荐</span>' +
    '</button>' +
    (D.subjectOrder || []).map(function (sid) {
      var s = SUB[sid], n = qOf(sid).length;
      return '<button class="subj" data-act="go" data-h="/practice/' + sid + '">' +
        '<span class="em" style="background:' + s.soft + ';color:' + s.color + '">' + ic(s.icon, 22) + '</span>' +
        '<span class="tx"><b>' + esc(s.name) + '</b><span>' + n + ' 题 · ' + esc(s.tag) + '</span></span>' +
        '</button>';
    }).join('');

  return '<div class="page" style="padding-top:0">' +
    navBar('研途 408', {
      back: false,
      sub: '考 研 刷 题 · 速 背',
      right: '<button class="nav-btn" data-act="theme">' + ic(isDark() ? 'sun' : 'moon', 20) + '</button>'
    }) +
    '<div class="hero">' +
      '<div class="hero-top">' + ic('flame', 15) + '<span>距离 2027 考研初试</span></div>' +
      '<div class="hero-title">还有 ' + dd + ' 天</div>' +
      '<div class="hero-desc">' + (d.n ? '今天已练 ' + d.n + ' 题，正确率 ' + acc + '%，保持手感。' : '今天还没开始，先刷 10 道找找感觉。') + '</div>' +
      '<div class="hero-stats">' +
        '<div><b>' + d.n + '</b><span>今日题量</span></div>' +
        '<div><b>' + acc + '%</b><span>今日正确率</span></div>' +
        '<div><b>' + Object.keys(ST.wrong).length + '</b><span>待巩固错题</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="entries">' +
      '<button class="entry" data-act="go" data-h="/practice">' +
        '<span class="em" style="background:var(--brand-soft);color:var(--brand)">' + ic('edit', 21) + '</span>' +
        '<h3>模拟题练习</h3><p>408 四科 + 高数一<br>按章节刷真题风格题</p>' +
        '<span class="badge" style="background:var(--brand-soft);color:var(--brand)">' + totalQ + ' 题</span>' +
      '</button>' +
      '<button class="entry" data-act="go" data-h="/memory">' +
        '<span class="em" style="background:var(--purple-soft);color:var(--purple)">' + ic('book', 21) + '</span>' +
        '<h3>知识点速查</h3><p>考前速背卡片<br>翻卡模式 + 收藏</p>' +
        '<span class="badge" style="background:var(--purple-soft);color:var(--purple)">速背</span>' +
      '</button>' +
    '</div>' +
    '<div class="sec-title">按科目练 <span class="sub">点击直接进入</span></div>' +
    '<div class="grid-sub">' + subGrid + '</div>' +
    '<div class="sec-title">快捷入口</div>' +
    '<div class="card">' +
      rowItem('404', 'target', 'var(--red)', 'var(--red-soft)', '错题本', Object.keys(ST.wrong).length + ' 道待巩固', '/wrong') +
      rowItem('star', 'star', '#FFB020', '#FFF7E6', '我的收藏', Object.keys(ST.fav).length + ' 张卡片', '/fav') +
      rowItem('chart', 'chart', 'var(--green)', 'var(--green-soft)', '学习数据', '累计 ' + ST.stats.total + ' 题', '/me') +
    '</div>' +
    '<div style="height:8px"></div>' +
  '</div>' + tabBar('');
}
function rowItem(key, icon, color, soft, title, sub, href) {
  return '<button class="row" data-act="go" data-h="' + href + '">' +
    '<span class="em" style="background:' + soft + ';color:' + color + '">' + ic(icon, 19) + '</span>' +
    '<span class="tx"><b>' + esc(title) + '</b><span>' + esc(sub) + '</span></span>' +
    '<span class="rt">' + ic('chev', 16) + '</span></button>';
}

/* ---------- 底部导航 ---------- */
function tabBar(active) {
  var items = [
    { k: 'home', t: '首页', i: 'home', h: '/' },
    { k: 'practice', t: '练习', i: 'edit', h: '/practice' },
    { k: 'memory', t: '速背', i: 'book', h: '/memory' },
    { k: 'me', t: '我的', i: 'user', h: '/me' }
  ];
  return '<div class="tabbar"><div class="in">' + items.map(function (it) {
    return '<button class="tab ' + (active === it.k ? 'on' : '') + '" data-act="go" data-h="' + it.h + '">' +
      ic(it.i, 22) + '<span>' + it.t + '</span></button>';
  }).join('') + '</div></div>';
}

/* ---------- 科目选择（二级页面） ---------- */
function renderSubjectPick(mode) {
  var isP = mode === 'practice';
  var h = '<div class="page">' +
    navBar(isP ? '模拟题练习' : '知识点速查', { sub: isP ? '选择科目 · 开始刷题' : '选择科目 · 速查速背' });

  if (isP) {
    var all = SUB.all, aq = 0;
    (all.from || []).forEach(function (s) { aq += qOf(s).length; });
    h += '<div class="card" style="padding:0;margin-bottom:12px"><button class="row" data-act="go" data-h="/practice/all" style="padding:16px 14px">' +
      '<span class="em" style="width:46px;height:46px;border-radius:13px;background:' + all.soft + ';color:' + all.color + '">' + ic(all.icon, 24) + '</span>' +
      '<span class="tx" style="flex:1"><b style="font-size:15.5px">' + esc(all.name) + '</b>' +
      '<span style="font-size:11.5px">四科合卷 · 约 40 题 / 卷 · 从 ' + aq + ' 道题中抽</span></span>' +
      '<span class="pill" style="background:' + all.soft + ';color:' + all.color + '">推荐</span>' +
      '</button></div>';
    h += '<div class="sec-title">单科专项 <span class="sub">按章节精准练</span></div>';
  }

  var subs = D.subjectOrder || [];
  h += '<div class="card">';
  h += subs.map(function (sid) {
    var s = SUB[sid], n = qOf(sid).length;
    var done = qOf(sid).filter(function (q) { return ST.wrong && ST.stats && false; }).length;
    var cardN = cardsOf(sid).length;
    var meta = isP ? (n + ' 题 · ' + ((s.chapters || []).length) + ' 章') : (cardN + ' 张卡片 · ' + ((s.chapters || []).length) + ' 章');
    var href = isP ? '/practice/' + sid : '/memory/' + sid;
    return '<button class="row" data-act="go" data-h="' + href + '">' +
      '<span class="em" style="background:' + s.soft + ';color:' + s.color + '">' + ic(s.icon, 20) + '</span>' +
      '<span class="tx"><b>' + esc(s.name) + '</b><span>' + meta + '</span></span>' +
      '<span class="rt"><span class="pill" style="background:' + s.soft + ';color:' + s.color + '">' + esc(s.score) + '</span>' + ic('chev', 16) + '</span></button>';
  }).join('');
  h += '</div>';

  if (isP) {
    h += '<div class="sec-title">强化 <span class="sub">只练错的</span></div><div class="card">' +
      rowItem('x', 'target', 'var(--red)', 'var(--red-soft)', '错题重练', Object.keys(ST.wrong).length + ' 道错题', '/wrong') +
      '</div>';
  } else {
    h += '<div class="sec-title">我的 <span class="sub">收藏夹</span></div><div class="card">' +
      rowItem('s', 'star', '#FFB020', '#FFF7E6', '收藏的卡片', Object.keys(ST.fav).length + ' 张', '/fav') +
      '</div>';
  }
  h += '<div style="height:8px"></div></div>';
  h += tabBar(isP ? 'practice' : 'memory');
  return h;
}

/* ---------- 科目详情（练习） ---------- */
function renderSubjectPractice(sid) {
  var s = SUB[sid];
  if (!s) return renderSubjectPick('practice');
  var allQ = qOf(sid);
  var doneN = allQ.filter(function (q) { return ST.wrong && ST.done && ST.done[q.id]; }).length;
  var wrongN = allQ.filter(function (q) { return ST.wrong[q.id]; }).length;
  var pct = allQ.length ? Math.round(doneN / allQ.length * 100) : 0;

  var h = '<div class="page">' + navBar(s.name, { sub: s.tag + ' · ' + allQ.length + ' 题' });
  h += '<div class="hero" style="background:linear-gradient(135deg,' + s.color + ',' + shade(s.color, -18) + ')">' +
    '<div class="hero-top">' + ic(s.icon, 15) + '<span>' + esc(s.tag) + '</span></div>' +
    '<div class="hero-title" style="font-size:19px">' + esc(s.name) + '</div>' +
    '<div class="hero-desc">' + esc(s.desc || '') + '</div>' +
    '<div class="hero-stats">' +
      '<div><b>' + allQ.length + '</b><span>题库</span></div>' +
      '<div><b>' + pct + '%</b><span>已练</span></div>' +
      '<div><b>' + wrongN + '</b><span>错题</span></div>' +
    '</div></div>';

  h += '<div class="actbar" style="margin-top:14px;position:static;padding:14px 0 0;background:none">' +
    '<button class="btn primary" data-act="start" data-sid="' + sid + '" data-ch="all">' + ic('play', 18) + '开始整卷练习（' + allQ.length + ' 题）</button>' +
    '</div>';

  h += '<div class="sec-title">按章节练 <span class="sub">' + ((s.chapters || []).length) + ' 章</span></div>';
  h += '<div class="card">';
  h += (s.chapters || []).map(function (c, i) {
    var cq = allQ.filter(function (q) { return q.ch === c.id; });
    var cdone = cq.filter(function (q) { return ST.done && ST.done[q.id]; }).length;
    var cp = cq.length ? cdone / cq.length : 0;
    var cn = cq.length;
    return '<button class="ch-row" data-act="start" data-sid="' + sid + '" data-ch="' + c.id + '"' + (cn ? '' : ' disabled style="opacity:.5"') + '>' +
      '<span class="num">' + (i + 1) + '</span>' +
      '<span class="tx"><b>' + esc(c.n) + (c.hot ? ' <span class="pill" style="background:var(--red-soft);color:var(--red);font-size:10px">高频</span>' : '') + '</b>' +
      '<span style="display:block;font-size:11px;color:var(--ink-3);margin-top:2px">' + esc(c.d || '') + '</span>' +
      '<span class="meta"><span class="bar"><i style="width:' + (cp * 100) + '%"></i></span>' +
      '<span>' + (cn ? cdone + '/' + cn : '暂未收录') + '</span></span></span>' +
      '<span class="rt">' + ic('chev', 16) + '</span></button>';
  }).join('');
  h += '</div><div style="height:10px"></div></div>';
  return h;
}
function shade(hex, amt) {
  var c = hex.replace('#', '');
  var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
  return '#' + [r, g, b].map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
}

/* ---------- 答题 ---------- */
var QZ = null;
function startQuiz(sid, chId) {
  var paper = buildPaper(sid, chId);
  if (!paper.length) { toast('这一章还没有题目'); return; }
  var topicName = chId === 'all'
    ? (((SUB[sid] && SUB[sid].name) || '练习') + ' · 整卷')
    : chName(sid, chId);
  QZ = {
    sid: sid, ch: chId, list: paper, idx: 0,
    picks: {}, locked: {}, t0: Date.now(), topic: topicName,
    finished: false
  };
  go('/quiz/' + sid);
}
function renderQuiz() {
  if (!QZ) return renderHome();
  var q = QZ.list[QZ.idx];
  var total = QZ.list.length, i = QZ.idx;
  var locked = !!QZ.locked[q.id];
  var picks = QZ.picks[q.id] || [];
  var multi = (q.ans || []).length > 1;
  var s = SUB[q.sid] || SUB.all;
  var elapsed = Date.now() - QZ.t0;

  var h = '<div class="page no-tab">' +
    navBar(QZ.topic, {
      sub: subjShort(q) + ' · ' + qName(q.sid),
      right: '<button class="nav-btn" data-act="card">' + ic('list', 20) + '</button>'
    });
  h += '<div class="quiz-head"><div class="quiz-prog"><span class="cnt"><em>' + (i + 1) + '</em>/' + total + '</span>' +
    '<span class="bar"><i style="width:' + ((i + 1) / total * 100) + '%"></i></span>' +
    '<span class="tm" id="qclock">' + fmtTime(elapsed) + '</span></div></div>';

  h += '<div class="q-tags">' +
    '<span class="pill" style="background:' + s.soft + ';color:' + s.color + '">' + subjShort(q) + '</span>' +
    '<span class="pill" style="background:var(--line-2);color:var(--ink-2)">' + (multi ? '多选题' : '单选题') + '</span>' +
    (q.tag ? '<span class="pill" style="background:var(--orange-soft);color:#B45309">' + esc(q.tag) + '</span>' : '') +
    (q.ch ? '<span class="pill" style="background:var(--line-2);color:var(--ink-3)">' + esc(chName(q.sid, q.ch)) + '</span>' : '') +
    '</div>';

  h += '<div class="q-stem">' + rich(q.stem) + '</div>';

  h += '<div class="opts">' + (q.opts || []).map(function (op, k) {
    var cls = 'opt';
    if (locked) {
      var isAns = (q.ans || []).indexOf(k) >= 0;
      var isPick = picks.indexOf(k) >= 0;
      if (isAns) cls += ' ok';
      else if (isPick) cls += ' bad';
    } else if (picks.indexOf(k) >= 0) cls += ' sel';
    return '<button class="' + cls + '" data-act="pick" data-k="' + k + '"' + (locked ? ' disabled' : '') + '>' +
      '<span class="k">' + 'ABCDEFGH'[k] + '</span><span class="v">' + rich(op) + '</span></button>';
  }).join('') + '</div>';

  if (locked) {
    var ok = sameSet(picks, q.ans || []);
    h += '<div class="verdict ' + (ok ? 'ok' : 'bad') + '">' + ic(ok ? 'check' : 'x', 17) +
      (ok ? '回答正确' : '回答错误，正确答案 ' + (q.ans || []).map(function (k) { return 'ABCDEFGH'[k]; }).join('')) + '</div>';
    if (q.ex) h += '<div class="explain"><div class="explain-h">' + ic('zap', 16) + '解析</div>' +
      '<div class="explain-b">' + rich(q.ex) + '</div></div>';
  }

  // 操作条
  h += '<div class="actbar">';
  h += '<button class="btn ghost" data-act="prev"' + (i === 0 ? ' disabled' : '') + '>' + ic('back', 18) + '</button>';
  if (!locked) {
    h += '<button class="btn primary" data-act="submit"' + (picks.length ? '' : ' disabled') + '>' +
      (multi ? '提交答案' : '确认选择') + '</button>';
  } else {
    var last = i === total - 1;
    h += '<button class="btn ' + (last ? 'done' : 'primary') + '" data-act="next">' +
      (last ? '查看结果' : '下一题') + ic('chev', 18) + '</button>';
  }
  h += '</div></div>';
  return h;
}
function qName(sid) {
  var names = { ds: '数据结构', co: '计算机组成原理', os: '操作系统', cn: '计算机网络', math: '高等数学（一）', all: '408 综合' };
  return names[sid] || '';
}
function sameSet(a, b) {
  if (a.length !== b.length) return false;
  var x = a.slice().sort(), y = b.slice().sort();
  for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}

/* ---------- 结果 ---------- */
var RESULT = null;
function finishQuiz() {
  var total = QZ.list.length, right = 0, wrongList = [];
  QZ.list.forEach(function (q) {
    var ok = sameSet(QZ.picks[q.id] || [], q.ans || []);
    if (ok) right++; else wrongList.push(q);
  });
  RESULT = {
    total: total, right: right, wrong: wrongList,
    ms: Date.now() - QZ.t0, sid: QZ.sid, topic: QZ.topic,
    picks: JSON.parse(JSON.stringify(QZ.picks))
  };
  go('/result');
}
function renderResult() {
  var r = RESULT;
  if (!r) return renderHome();
  var pct = Math.round(r.right / r.total * 100);
  var cls = pct >= 80 ? '' : (pct >= 60 ? 'mid' : 'low');
  var C = 2 * Math.PI * 52, off = C * (1 - pct / 100);
  var h = '<div class="page no-tab">' + navBar('练习结果', { sub: r.topic + ' · ' + qName(r.sid) });
  h += '<div class="result-hero ' + cls + '">' +
    '<div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="9"/>' +
    '<circle cx="60" cy="60" r="52" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + off + '"/></svg>' +
    '<div class="val"><b>' + pct + '<span style="font-size:15px">%</span></b><span>正确率</span></div></div>' +
    '<div style="font-size:13px;opacity:.92">' + (pct >= 80 ? '稳住了，继续保持这个手感' : pct >= 60 ? '还有提升空间，错题回顾一遍' : '基础要点需要再看一遍') + '</div>' +
    '</div>';
  h += '<div class="res-stats">' +
    '<div><b style="color:var(--green)">' + r.right + '</b><span>答对</span></div>' +
    '<div><b style="color:var(--red)">' + (r.total - r.right) + '</b><span>答错</span></div>' +
    '<div><b>' + fmtTime(r.ms) + '</b><span>用时</span></div>' +
    '</div>';
  h += '<div class="actbar" style="position:static;background:none;margin-top:16px;margin-bottom:0">' +
    (r.wrong.length ? '<button class="btn primary" data-act="redo">' + ic('refresh', 18) + '重做错题（' + r.wrong.length + '）</button>' : '') +
    '<button class="btn ghost" data-act="again">再来一遍</button></div>';
  h += '<div class="rowbtns">' +
    '<button class="btn ghost" data-act="go" data-h="/">' + ic('home', 16) + '回到首页</button>' +
    '<button class="btn ghost" data-act="go" data-h="/practice/' + (r.sid || 'all') + '">' + ic('list', 16) + '返回本科目</button>' +
    '</div>';
  if (r.wrong.length) {
    h += '<div class="sec-title">错题回顾 <span class="sub">点开看解析</span></div>';
    h += r.wrong.map(function (q, i) {
      var my = r.picks[q.id] || [];
      return '<div class="qcard"><div class="h"><span class="idx">' + (i + 1) + '</span>' +
        '<span>' + subjShort(q) + ' · ' + chName(q.sid, q.ch) + '</span></div>' +
        '<div class="s">' + rich(q.stem) + '</div>' +
        optionsHtml(q, my) +
        '<div class="qex"><b style="color:var(--red)">你的答案 ' + (my.length ? letters(my) : '未作答') + '</b>' +
        '　<b style="color:var(--green)">正确答案 ' + letters(q.ans) + '</b>' +
        (q.ex ? '<div style="margin-top:6px">' + rich(q.ex) + '</div>' : '') +
        '</div></div>';
    }).join('');
  } else {
    h += '<div class="empty"><span class="em">' + ic('check', 30) + '</span><b>全对！</b><span>这一组题没有问题，可以换一章继续。</span></div>';
  }
  h += '<div style="height:16px"></div></div>';
  return h;
}

/* ---------------- 答题卡抽屉 ---------------- */
function renderSheetCard() {
  if (!QZ) return '';
  var h = '<div style="display:flex;align-items:center;padding:2px 2px 0"><b style="font-size:15.5px;flex:1">答题卡</b>' +
    '<span style="font-size:12px;color:var(--ink-3)">共 ' + QZ.list.length + ' 题</span></div>';
  h += '<div class="jumpgrid">' + QZ.list.map(function (q, i) {
    var cls = 'jg';
    if (QZ.locked[q.id]) cls += sameSet(QZ.picks[q.id] || [], q.ans || []) ? ' ok' : ' bad';
    else if ((QZ.picks[q.id] || []).length) cls += ' has';
    if (i === QZ.idx) cls += ' cur';
    return '<button class="' + cls + '" data-act="jump" data-i="' + i + '">' + (i + 1) + '</button>';
  }).join('') + '</div>';
  h += '<div class="legend">' +
    '<span><i class="dot" style="background:var(--green)"></i>答对</span>' +
    '<span><i class="dot" style="background:var(--red)"></i>答错</span>' +
    '<span><i class="dot" style="background:var(--brand-soft);border:1.5px solid var(--brand)"></i>已选未判</span>' +
    '<span><i class="dot" style="background:var(--line-2)"></i>未做</span></div>';
  h += '<div style="display:flex;gap:10px;padding:14px 0 4px">' +
    '<button class="btn ghost" data-act="closesheet">继续答题</button>' +
    '<button class="btn primary" data-act="finish">交卷看结果</button></div>';
  return h;
}
function openSheet(html) {
  closeSheet();
  var d = document.createElement('div');
  d.className = 'sheet-mask'; d.id = 'sheet';
  d.innerHTML = '<div class="sheet">' + html + '</div>';
  document.body.appendChild(d);
  requestAnimationFrame(function () { d.classList.add('on'); });
}
function closeSheet() {
  var d = document.getElementById('sheet');
  if (d) { d.classList.remove('on'); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 200); }
}

/* ---------------- 知识点速查 / 速背 ---------------- */
var SEARCH = { kw: '', sid: null, ch: null };
function cardKey(c) { return c.id; }
function renderMemorySubject(sid) {
  var s = SUB[sid];
  if (!s) return renderSubjectPick('memory');
  var all = cardsOf(sid);
  var favN = all.filter(function (c) { return ST.fav[c.id]; }).length;
  var chs = sid === 'all' ? [] : (s.chapters || []);

  var h = '<div class="page">' + navBar(s.name + ' · 速背', { sub: all.length + ' 张卡片' });
  h += '<div class="mini-hero" style="background:' + s.soft + ';color:' + s.color + '">' +
    '<div style="display:flex;align-items:center;gap:8px">' + ic(s.icon, 17) + '<b style="font-size:14px">' + esc(s.tag) + '</b></div>' +
    '<p>' + esc(s.desc || '') + '</p>' +
    '<div class="mh-nums"><span><b>' + all.length + '</b> 张卡片</span><span><b>' + (chs.length || 4) + '</b> 个章节</span><span><b>' + favN + '</b> 已收藏</span></div>' +
    '</div>';
  h += '<div class="actbar" style="position:static;background:none;padding:14px 0 0;margin:0">' +
    '<button class="btn primary" data-act="go" data-h="/flip/' + sid + '/all">' + ic('card', 18) + '随机翻卡速背</button></div>';

  h += '<div class="sec-title">按章节 <span class="sub">先过一遍，再翻卡</span></div>';
  h += '<div class="card">';
  if (sid === 'all') {
    h += (s.from || []).map(function (x) {
      var ss = SUB[x], n = (CLIST[x] || []).length;
      return '<button class="ch-row" data-act="go" data-h="/memory/' + x + '">' +
        '<span class="num" style="background:' + ss.soft + ';color:' + ss.color + '">' + ic(ss.icon, 14) + '</span>' +
        '<span class="tx"><b>' + esc(ss.name) + '</b><span style="display:block;font-size:11px;color:var(--ink-3);margin-top:2px">' + n + ' 张卡片</span></span>' +
        '<span class="rt">' + ic('chev', 16) + '</span></button>';
    }).join('');
  } else {
    h += chs.map(function (c, i) {
      var n = all.filter(function (k) { return k.ch === c.id; }).length;
      return '<button class="ch-row" data-act="go" data-h="/memory/' + sid + '/' + c.id + '"' + (n ? '' : ' disabled style="opacity:.5"') + '>' +
        '<span class="num">' + (i + 1) + '</span>' +
        '<span class="tx"><b>' + esc(c.n) + (c.hot ? ' <span class="pill" style="background:var(--red-soft);color:var(--red);font-size:10px">必背</span>' : '') + '</b>' +
        '<span style="display:block;font-size:11px;color:var(--ink-3);margin-top:2px">' + n + ' 张卡片</span></span>' +
        '<span class="rt">' + ic('chev', 16) + '</span></button>';
    }).join('');
  }
  h += '</div><div style="height:8px"></div></div>';
  h += tabBar('memory');
  return h;
}

function renderCardList(sid, chId) {
  var s = SUB[sid] || SUB.all;
  var all = cardsOf(sid);
  SEARCH.sid = sid; SEARCH.ch = chId || 'all';
  var list = filterCards();
  var title = chId === 'all' ? '全部卡片' : chName(sid, chId);
  var h = '<div class="page">' + navBar(title, { sub: s.name + ' · ' + list.length + ' 张' });
  h += '<div class="kp-toolbar">' +
    '<label class="search">' + ic('search', 18) +
    '<input id="kw" type="search" placeholder="搜索考点关键词…" value="' + esc(SEARCH.kw) + '"></label>' +
    '<button class="btn ghost" style="height:40px;padding:0 14px" data-act="go" data-h="/flip/' + sid + '/' + (chId || 'all') + '">' + ic('shuffle', 18) + '</button>' +
    '</div>';
  h += '<div id="kplist">' + kpListInner(s) + '</div>';
  h += '<div style="height:12px"></div></div>';
  return h;
}
function filterCards() {
  var all = cardsOf(SEARCH.sid);
  var ch = SEARCH.ch;
  if (SEARCH.kw) {
    var kw = SEARCH.kw.toLowerCase();
    return all.filter(function (c) { return (c.t + ' ' + c.b + ' ' + (c.tag || '')).toLowerCase().indexOf(kw) >= 0; });
  }
  return ch && ch !== 'all' ? all.filter(function (c) { return c.ch === ch; }) : all;
}
function kpListInner(s) {
  var list = filterCards();
  if (!list.length) {
    return '<div class="empty"><span class="em">' + ic('search', 30) + '</span><b>' + (SEARCH.kw ? '没有匹配的卡片' : '这一章还没有卡片') + '</b>' +
      '<span>' + (SEARCH.kw ? '换个关键词试试，比如「Cache」「KMP」「极限」。' : '去其他章节看看，或点右上角翻卡。') + '</span></div>';
  }
  return list.map(function (c) { return kpCard(c, s || SUB[c.sid] || SUB.all); }).join('');
}

function kpCard(c, s) {
  var on = ST.fav[c.id];
  return '<div class="kp" style="border-left-color:' + (s.color || 'var(--brand)') + '">' +
    '<div class="kp-h"><h3>' + esc(c.t) + '</h3>' +
    (c.tag ? '<span class="pill" style="background:' + (s.soft || 'var(--line-2)') + ';color:' + (s.color || 'var(--ink-2)') + ';font-size:10px">' + esc(c.tag) + '</span>' : '') +
    '<button class="star ' + (on ? 'on' : '') + '" data-act="fav" data-id="' + esc(c.id) + '">' + ic('star', 17) + '</button></div>' +
    '<div class="kp-b">' + rich(c.b) + '</div></div>';
}

/* ---------------- 翻卡 ---------------- */
var FLIP = null;
function startFlip(sid, chId) {
  var all = cardsOf(sid);
  var list = chId && chId !== 'all' ? all.filter(function (c) { return c.ch === chId; }) : all;
  if (!list.length) { toast('这一章还没有卡片'); return; }
  FLIP = { sid: sid, ch: chId, list: shuffle(list), i: 0, rev: {} };
  go('/flip/' + sid + '/' + (chId || 'all'));
}
function renderFlip(sid, chId) {
  var s = SUB[sid] || SUB.all;
  var all = cardsOf(sid);
  var list = chId && chId !== 'all' ? all.filter(function (c) { return c.ch === chId; }) : all;
  if (!FLIP || FLIP.sid !== sid || FLIP.ch !== (chId || 'all')) {
    var sl = chId && chId !== 'all' ? all.filter(function (c) { return c.ch === chId; }) : all;
    if (!sl.length) {
      return '<div class="page">' + navBar('翻卡速背') +
        '<div class="empty"><span class="em">' + ic('card', 30) + '</span><b>这一章还没有卡片</b><span>换一章试试。</span></div></div>';
    }
    FLIP = { sid: sid, ch: chId || 'all', list: shuffle(sl), i: 0 };
  }
  var c = FLIP.list[FLIP.i];
  if (!c) return renderHome();
  var on = ST.fav[c.id];
  var h = '<div class="page no-tab">' + navBar('翻卡速背', { sub: chName(sid, c.ch) || s.name });
  h += '<div class="quiz-prog" style="margin-bottom:14px"><span class="cnt"><em>' + (FLIP.i + 1) + '</em>/' + FLIP.list.length + '</span>' +
    '<span class="bar"><i style="width:' + ((FLIP.i + 1) / FLIP.list.length * 100) + '%"></i></span>' +
    '<button class="nav-btn" data-act="shuffle" style="width:34px;height:34px">' + ic('shuffle', 18) + '</button></div>';
  h += '<div class="flipcard">' +
    '<span class="tagm" style="background:' + s.soft + ';color:' + s.color + '">' + esc(c.tag || chName(sid, c.ch) || '考点') + '</span>' +
    '<h2>' + esc(c.t) + '</h2>' +
    '<div class="body">' + rich(c.b) + '</div>' +
    '<div style="display:flex;gap:8px;align-items:center;margin-top:14px">' +
    '<button class="star ' + (on ? 'on' : '') + '" style="width:36px;height:36px;border-radius:11px" data-act="fav" data-id="' + esc(c.id) + '">' + ic('star', 18) + '</button>' +
    '<span style="font-size:11px;color:var(--ink-3);flex:1">已收藏的卡片可以在「我的」里复习</span></div>' +
    '</div>';
  h += '<div class="flipnav">' +
    '<button class="btn ghost" data-act="fprev"' + (FLIP.i === 0 ? ' disabled' : '') + '>' + ic('back', 18) + '</button>' +
    '<button class="btn primary" data-act="fnext">' + (FLIP.i === FLIP.list.length - 1 ? '再来一轮' : '下一张') + ic('chev', 18) + '</button>' +
    '</div>';
  h += '<div style="text-align:center;margin-top:12px"><button style="font-size:12px;color:var(--ink-3)" data-act="go" data-h="/memory/' + sid + '/' + (chId || 'all') + '">退出翻卡，看完整卡片</button></div>';
  h += '<div style="height:20px"></div></div>';
  return h;
}

/* ---------------- 错题本 ---------------- */
/* ---------------- 错题本 ---------------- */
function plainText(s) {
  return String(s == null ? '' : s).replace(/\*\*|__|`/g, '').replace(/\s*\n\s*/g, ' ').trim();
}
function letters(arr) { return (arr || []).map(function (k) { return 'ABCDEFGH'[k]; }).join(''); }

/* 只读选项列表：正确项标绿，自己选错的标红 */
function optionsHtml(q, myPicks) {
  myPicks = myPicks || [];
  return '<div class="ansopts">' + (q.opts || []).map(function (op, k) {
    var cls = 'ansopt';
    if ((q.ans || []).indexOf(k) >= 0) cls += ' ok';
    else if (myPicks.indexOf(k) >= 0) cls += ' bad';
    return '<div class="' + cls + '"><span class="k">' + 'ABCDEFGH'[k] + '</span>' +
      '<span class="v">' + rich(op) + '</span></div>';
  }).join('') + '</div>';
}

function renderWrong() {
  var ids = Object.keys(ST.wrong).filter(function (id) { return QINDEX[id]; });
  var h = '<div class="page">' + navBar('错题本', { sub: ids.length + ' 道待巩固' });
  if (!ids.length) {
    h += '<div class="empty"><span class="em">' + ic('check', 30) + '</span><b>还没有错题</b><span>去练习里刷几道，答错的题会自动收进这里。</span></div>';
  } else {
    var groups = {};
    ids.forEach(function (id) {
      var q = QINDEX[id];
      if (!q) return;
      if (!groups[q.sid]) groups[q.sid] = [];
      groups[q.sid].push(q);
    });
    h += '<div class="hint-bar">' + ic('info', 14) + '<span>点任意一道题可看详解：题目、同类题与本章知识点</span></div>';
    var order = ['ds', 'co', 'os', 'cn', 'math', 'all'];
    order.forEach(function (sid) {
      var g = groups[sid];
      if (!g || !g.length) return;
      var s = SUB[sid];
      h += '<div class="sec-title">' + esc(s.name) + ' <span class="sub">' + g.length + ' 题</span></div>';
      h += g.map(function (q) {
        var w = ST.wrong[q.id] || { c: 1 };
        var myPicks = w.p || [];
        return '<div class="qcard tap" data-act="go" data-h="/q/' + q.id + '">' +
          '<div class="h"><span class="idx" style="background:var(--red-soft);color:var(--red)">' + w.c + '×</span>' +
          '<span>' + esc(chName(q.sid, q.ch)) + '</span>' +
          '<span class="tap-hint">详解' + ic('chev', 12) + '</span>' +
          '<button class="xdel" data-act="rmwrong" data-id="' + q.id + '">' + ic('x', 14) + '</button></div>' +
          '<div class="s">' + rich(q.stem) + '</div>' +
          optionsHtml(q, myPicks) +
          '<div class="qex"><b style="color:var(--green)">正确答案 ' + letters(q.ans) + '</b>' +
          (myPicks.length ? '　<b style="color:var(--red)">你的答案 ' + letters(myPicks) + '</b>' : '') +
          (q.ex ? '<div style="margin-top:6px">' + rich(q.ex) + '</div>' : '') + '</div>' +
          '</div>';
      }).join('');
    });
    h += '<div style="height:8px"></div>';
    h += '<div class="card" style="margin-top:6px"><button class="row" data-act="clearwrong">' +
      '<span class="em" style="background:var(--red-soft);color:var(--red)">' + ic('trash', 18) + '</span>' +
      '<span class="tx"><b>清空错题本</b><span>删除全部错题记录</span></span></button></div>';
  }
  h += '<div style="height:12px"></div></div>';
  return h;
}

/* ---------------- 题目详解（从错题本跳转：本题 + 同类题 + 相关知识点） ---------------- */
var DQ = { picks: {}, locked: {} };
function miniQCard(x) {
  var badge = ST.wrong[x.id]
    ? '<span class="pill" style="background:var(--red-soft);color:var(--red);font-size:10px">错过</span>'
    : (ST.done && ST.done[x.id]
      ? '<span class="pill" style="background:var(--green-soft);color:var(--green);font-size:10px">做过</span>'
      : '<span class="pill" style="background:var(--line-2);color:var(--ink-3);font-size:10px">未做</span>');
  var t = plainText(x.stem);
  if (t.length > 56) t = t.slice(0, 56) + '…';
  return '<button class="row miniq" data-act="go" data-h="/q/' + x.id + '">' +
    '<span class="tx"><b>' + esc(t) + '</b></span>' +
    '<span class="rt">' + badge + ic('chev', 15) + '</span></button>';
}

function djudge(qid) {
  var q = QINDEX[qid];
  if (!q || DQ.locked[qid]) return;
  var picks = DQ.picks[qid] || [];
  if (!picks.length) { toast('先选一个答案'); return; }
  DQ.locked[qid] = true;
  var ok = sameSet(picks, q.ans || []);
  ST.done = ST.done || {};
  ST.done[q.id] = 1;
  recordAnswer(q, ok, picks);
  haptic(ok ? 6 : 16);
  render();
}

function renderQuestionDetail(qid) {
  var q = QINDEX[qid];
  if (!q) {
    return '<div class="page">' + navBar('题目详解') +
      '<div class="empty"><span class="em">' + ic('info', 30) + '</span><b>找不到这道题</b><span>它可能已被移出错题本。</span></div></div>';
  }
  var s = SUB[q.sid] || SUB.all;
  var picks = DQ.picks[qid] || [];
  var locked = !!DQ.locked[qid];
  var multi = (q.ans || []).length > 1;
  var w = ST.wrong[qid];

  var h = '<div class="page no-tab">' +
    navBar('题目详解', { sub: subjShort(q) + ' · ' + chName(q.sid, q.ch) });
  h += '<div class="q-tags">' +
    '<span class="pill" style="background:' + s.soft + ';color:' + s.color + '">' + esc(s.name) + '</span>' +
    '<span class="pill" style="background:var(--line-2);color:var(--ink-2)">' + (multi ? '多选题' : '单选题') + '</span>' +
    (q.tag ? '<span class="pill" style="background:var(--orange-soft);color:#B45309">' + esc(q.tag) + '</span>' : '') +
    (w ? '<span class="pill" style="background:var(--red-soft);color:var(--red)">错 ' + w.c + ' 次</span>' : '') +
    '</div>';
  h += '<div class="q-stem">' + rich(q.stem) + '</div>';

  h += '<div class="opts">' + (q.opts || []).map(function (op, k) {
    var cls = 'opt';
    if (locked) {
      if ((q.ans || []).indexOf(k) >= 0) cls += ' ok';
      else if (picks.indexOf(k) >= 0) cls += ' bad';
    } else if (picks.indexOf(k) >= 0) cls += ' sel';
    return '<button class="' + cls + '" data-act="dpick" data-k="' + k + '" data-qid="' + qid + '"' +
      (locked ? ' disabled' : '') + '>' +
      '<span class="k">' + 'ABCDEFGH'[k] + '</span><span class="v">' + rich(op) + '</span></button>';
  }).join('') + '</div>';

  if (!locked) {
    h += '<div class="actbar" style="position:static;background:none;padding:14px 0 0;margin:0">' +
      '<button class="btn primary" data-act="dsubmit" data-qid="' + qid + '"' + (picks.length ? '' : ' disabled') + '>' +
      (multi ? '提交答案' : '确认选择') + '</button></div>';
  } else {
    var ok = sameSet(picks, q.ans || []);
    h += '<div class="verdict ' + (ok ? 'ok' : 'bad') + '">' + ic(ok ? 'check' : 'x', 17) +
      (ok ? '回答正确' : '回答错误，正确答案 ' + letters(q.ans)) + '</div>';
    if (q.ex) {
      h += '<div class="explain"><div class="explain-h">' + ic('zap', 16) + '解析</div>' +
        '<div class="explain-b">' + rich(q.ex) + '</div></div>';
    }
    h += '<div class="actbar" style="position:static;background:none;padding:14px 0 0;margin:0">' +
      '<button class="btn ghost" data-act="dreset" data-qid="' + qid + '">' + ic('refresh', 16) + '再做一次</button>' +
      (w ? '<button class="btn ghost" data-act="rmwrong" data-id="' + qid + '">' + ic('check', 16) + '已掌握</button>' : '') +
      '</div>';
  }

  var same = qOf(q.sid).filter(function (x) { return x.ch === q.ch && x.id !== q.id; }).slice(0, 6);
  if (same.length) {
    h += '<div class="sec-title">同类题 <span class="sub">' + esc(chName(q.sid, q.ch)) + ' · ' + same.length + ' 道</span></div>';
    h += '<div class="card">' + same.map(miniQCard).join('') + '</div>';
  }

  var cards = cardsOf(q.sid).filter(function (c) { return c.ch === q.ch; });
  if (cards.length) {
    h += '<div class="sec-title">相关知识点 <span class="sub">' + cards.length + ' 张卡片</span></div>';
    h += cards.map(function (c) { return kpCard(c, s); }).join('');
  }
  h += '<div style="height:16px"></div></div>';
  return h;
}

/* ---------------- 收藏 ---------------- */
function renderFav() {
  var ids = Object.keys(ST.fav);
  var h = '<div class="page">' + navBar('我的收藏', { sub: ids.length + ' 张卡片' });
  if (!ids.length) {
    h += '<div class="empty"><span class="em">' + ic('star', 30) + '</span><b>还没有收藏</b><span>在速背卡片右上角点一下星星，就能把重点收进来。</span></div>';
  } else {
    var all = [];
    (D.subjectOrder || []).forEach(function (sid) {
      cardsOf(sid).forEach(function (c) { if (ST.fav[c.id]) all.push({ c: c, s: SUB[sid] }); });
    });
    h += all.map(function (x) { return kpCard(x.c, x.s); }).join('');
  }
  h += '<div style="height:12px"></div></div>';
  return h;
}

/* ---------------- 我的 ---------------- */
function renderMe() {
  var total = ST.stats.total, right = ST.stats.right;
  var acc = total ? Math.round(right / total * 100) : 0;
  var days = Object.keys(ST.stats.days || {}).length;
  var h = '<div class="page">' + navBar('我的', { sub: '学习数据与设置' });
  h += '<div class="me-head"><div class="avatar">' + ic('user', 26) + '</div>' +
    '<div><b>研途 408</b><span>' + (total ? '累计练习 ' + total + ' 题' : '还没有开始，先刷一组') + '</span></div></div>';
  h += '<div class="stat-grid" style="margin-bottom:10px">' +
    '<div class="stat"><span class="lb">' + ic('edit', 13) + '累计答题</span><b>' + total + '<i>题</i></b></div>' +
    '<div class="stat"><span class="lb">' + ic('target', 13) + '平均正确率</span><b>' + acc + '<i>%</i></b></div>' +
    '<div class="stat"><span class="lb">' + ic('x', 13) + '错题待巩固</span><b>' + Object.keys(ST.wrong).length + '<i>题</i></b></div>' +
    '<div class="stat"><span class="lb">' + ic('clock', 13) + '有记录天数</span><b>' + days + '<i>天</i></b></div>' +
    '</div>';

  h += '<div class="sec-title">各科进度</div><div class="card" style="padding:14px">';
  h += (D.subjectOrder || []).map(function (sid) {
    var s = SUB[sid], qs = qOf(sid);
    var done = qs.filter(function (q) { return ST.done && ST.done[q.id]; }).length;
    var p = qs.length ? Math.round(done / qs.length * 100) : 0;
    return '<div style="margin-bottom:12px"><div style="display:flex;font-size:12.5px;margin-bottom:5px">' +
      '<span style="flex:1;font-weight:560">' + esc(s.name) + '</span>' +
      '<span style="color:var(--ink-3);font-variant-numeric:tabular-nums">' + done + '/' + qs.length + '</span></div>' +
      '<div class="bar"><i style="width:' + p + '%;background:' + s.color + '"></i></div></div>';
  }).join('');
  h += '</div>';

  h += '<div class="sec-title">设置</div><div class="card">' +
    '<button class="row" data-act="theme"><span class="em" style="background:var(--line-2);color:var(--ink-2)">' + ic(isDark() ? 'moon' : 'sun', 18) + '</span>' +
    '<span class="tx"><b>外观主题</b><span>' + (ST.theme === 'dark' ? '深色' : ST.theme === 'light' ? '浅色' : '跟随系统') + '</span></span>' +
    '<span class="rt">' + ic('chev', 16) + '</span></button>' +
    '<button class="row" data-act="go" data-h="/wrong"><span class="em" style="background:var(--red-soft);color:var(--red)">' + ic('x', 18) + '</span>' +
    '<span class="tx"><b>错题本</b><span>' + Object.keys(ST.wrong).length + ' 道</span></span><span class="rt">' + ic('chev', 16) + '</span></button>' +
    '<button class="row" data-act="go" data-h="/fav"><span class="em" style="background:#FFF7E6;color:#FFB020">' + ic('star', 18) + '</span>' +
    '<span class="tx"><b>我的收藏</b><span>' + Object.keys(ST.fav).length + ' 张卡片</span></span><span class="rt">' + ic('chev', 16) + '</span></button>' +
    '</div>';

  h += '<div class="sec-title">关于</div><div class="card" style="padding:14px">' +
    '<div style="font-size:12.5px;line-height:1.85;color:var(--ink-2)">' +
    '<b style="color:var(--ink)">研途 408 · v' + esc(APP_VER) + '</b><br>' +
    '题库按 408 统考真题与数学一历年真题的考点与难度整理，覆盖数据结构、计算机组成原理、操作系统、计算机网络与高等数学（一）。<br>' +
    '所有内容与答题记录都存在本机，不联网、不上传。</div>' +
    '<button class="btn ghost" style="margin-top:14px;width:100%" data-act="cleardata">' + ic('trash', 16) + '清除全部学习记录</button>' +
    '</div>';
  h += '<div style="height:12px"></div></div>';
  h += tabBar('me');
  return h;
}

/* ---------------- 渲染后处理 ---------------- */
var clockTimer = null;
function afterRender(r) {
  if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
  if (r.page === 'quiz' && QZ) {
    clockTimer = setInterval(function () {
      var el = document.getElementById('qclock');
      if (el) el.textContent = fmtTime(Date.now() - QZ.t0);
    }, 1000);
  }
  var kw = document.getElementById('kw');
  if (kw) {
    kw.addEventListener('input', function () {
      SEARCH.kw = this.value.trim();
      var box = document.getElementById('kplist');
      if (box) box.innerHTML = kpListInner(SUB[SEARCH.sid] || SUB.all);
      var sub = document.querySelector('.nav-title small');
      if (sub) sub.textContent = (SUB[SEARCH.sid] ? SUB[SEARCH.sid].name : '') + ' · ' + filterCards().length + ' 张';
    });
  }
}

/* ---------------- 事件 ---------------- */
function findAct(el) {
  while (el && el !== document.body) {
    if (el.getAttribute && el.getAttribute('data-act')) return el;
    el = el.parentElement;
  }
  return null;
}
function actHandlers(el) {
  var act = el.getAttribute('data-act');
  var ds = el.dataset || {};
  switch (act) {
    case 'go': SEARCH.kw = ''; go(ds.h); return;
    case 'back': back(); return;
    case 'theme': {
      var order = [null, 'light', 'dark'];
      var i = order.indexOf(ST.theme);
      ST.theme = order[(i + 1) % 3];
      saveST(); applyTheme(); toast(ST.theme === 'dark' ? '深色模式' : ST.theme === 'light' ? '浅色模式' : '跟随系统'); render(); return;
    }
    case 'start': startQuiz(ds.sid, ds.ch); return;
    case 'pick': {
      if (!QZ) return;
      var q = QZ.list[QZ.idx];
      if (QZ.locked[q.id]) return;
      var k = +ds.k, multi = (q.ans || []).length > 1;
      var pk = QZ.picks[q.id] || [];
      if (multi) {
        var pos = pk.indexOf(k);
        if (pos >= 0) pk.splice(pos, 1); else pk.push(k);
        QZ.picks[q.id] = pk.sort();
        render();
      } else {
        QZ.picks[q.id] = [k];
        judge();
      }
      return;
    }
    case 'submit': judge(); return;
    case 'next': {
      if (QZ.idx >= QZ.list.length - 1) { finishQuiz(); return; }
      QZ.idx++; render(); return;
    }
    case 'prev': { if (QZ.idx > 0) QZ.idx--; render(); return; }
    case 'jump': {
      closeSheet();
      var ii = +ds.i;
      if (QZ && ii >= 0 && ii < QZ.list.length) { QZ.idx = ii; render(); }
      return;
    }
    case 'finish': closeSheet(); if (QZ) finishQuiz(); return;
    case 'card': openSheet(renderSheetCard()); return;
    case 'closesheet': closeSheet(); return;
    case 'redo': {
      if (!RESULT || !RESULT.wrong.length) return;
      QZ = { sid: RESULT.sid, ch: 'redo', list: RESULT.wrong.slice(), idx: 0, picks: {}, locked: {}, t0: Date.now(), topic: '错题重练' };
      go('/quiz/' + RESULT.sid); return;
    }
    case 'again': { if (RESULT) { startQuiz(RESULT.sid, 'all'); } return; }
    case 'fav': {
      var id = ds.id;
      if (ST.fav[id]) delete ST.fav[id]; else ST.fav[id] = Date.now();
      saveST(); haptic(6);
      toast(ST.fav[id] ? '已收藏' : '已取消收藏');
      // 只更新图标，避免整页重绘导致滚动跳动
      var on = !!ST.fav[id];
      el.classList.toggle('on', on);
      return;
    }
    case 'flip': startFlip(); return;
    case 'fnext': {
      if (!FLIP) return;
      if (FLIP.i >= FLIP.list.length - 1) { FLIP.list = shuffle(FLIP.list); FLIP.i = 0; toast('重新打乱'); }
      else FLIP.i++;
      render(); return;
    }
    case 'fprev': { if (FLIP && FLIP.i > 0) { FLIP.i--; render(); } return; }
    case 'shuffle': { if (FLIP) { FLIP.list = shuffle(FLIP.list); FLIP.i = 0; render(); } return; }
    case 'dpick': {
      var dqq = QINDEX[ds.qid];
      if (!dqq || DQ.locked[ds.qid]) return;
      var dk = +ds.k, dmulti = (dqq.ans || []).length > 1;
      var dp = DQ.picks[ds.qid] || [];
      if (dmulti) {
        var dpos = dp.indexOf(dk);
        if (dpos >= 0) dp.splice(dpos, 1); else dp.push(dk);
        DQ.picks[ds.qid] = dp.sort();
        render();
      } else {
        DQ.picks[ds.qid] = [dk];
        djudge(ds.qid);
      }
      return;
    }
    case 'dsubmit': djudge(ds.qid); return;
    case 'dreset': { DQ.picks[ds.qid] = []; DQ.locked[ds.qid] = false; render(); return; }
    case 'rmwrong': { delete ST.wrong[ds.id]; saveST(); render(); return; }
    case 'clearwrong': {
      if (Object.keys(ST.wrong).length && confirm('清空全部错题记录？')) { ST.wrong = {}; saveST(); render(); }
      return;
    }
    case 'cleardata': {
      if (confirm('清除全部学习记录（答题、错题、收藏）？此操作不可撤销。')) {
        localStorage.removeItem(KEY); ST = loadST(); saveST(); toast('已清除'); render();
      }
      return;
    }
  }
}

function judge() {
  if (!QZ) return;
  var q = QZ.list[QZ.idx];
  if (QZ.locked[q.id]) return;
  var picks = QZ.picks[q.id] || [];
  if (!picks.length) { toast('先选一个答案'); return; }
  QZ.locked[q.id] = true;
  var ok = sameSet(picks, q.ans || []);
  ST.done = ST.done || {};
  ST.done[q.id] = 1;
  recordAnswer(q, ok, picks);
  haptic(ok ? 6 : 16);
  render();
}

/* ---------------- 主题 ---------------- */
function sysDark() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}
function isDark() {
  if (ST.theme === 'dark') return true;
  if (ST.theme === 'light') return false;
  return sysDark();
}
function applyTheme() {
  var t = ST.theme || (sysDark() ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
}
function watchSystemTheme() {
  if (!window.matchMedia) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onChange = function () { if (!ST.theme) { applyTheme(); render(); } };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

/* ---------------- 启动 ---------------- */
function init() {
  buildIndex();
  // 补全卡片 id
  Object.keys(CLIST).forEach(function (sid) {
    CLIST[sid].forEach(function (c, i) {
      if (!c.id) c.id = sid + '-' + (i + 1);
      if (!c.sid) c.sid = sid;
    });
  });
  applyTheme();
  watchSystemTheme();
  // 支持从 hash 直接进入
  var h = (location.hash || '').replace(/^#/, '');
  if (h && h.length > 1) {
    STACK = [h.startsWith('/') ? h : '/' + h];
    try { history.replaceState(null, '', '#' + STACK[0]); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var el = findAct(e.target);
    if (!el) {
      if (e.target && e.target.id === 'sheet') closeSheet();
      return;
    }
    actHandlers(el);
  });
  // 安卓物理返回键（WebView 通过 JS 调用）
  render();
}

window.__nav = function (h) { go(h); };
window.__startQuiz = function (sid, ch) { startQuiz(sid, ch || 'all'); };

init();
})();

