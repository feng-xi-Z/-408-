/* ============================================================
   研途 408 · 数据内核（科目元信息 / 章节定义）
   题库在 data-*.js 里追加到 DATA.q[科目id]、DATA.k[科目id]
   ============================================================ */
window.DATA = {
  version: 1,
  builtAt: '',
  subjects: {
    all: {
      id: 'all', name: '408 综合', short: '408', kind: 'composite',
      tag: '统考真题风格 · 四科合卷', score: '150 分',
      color: '#1E56C4', soft: '#E8EEFB', icon: 'layers',
      desc: '按真实 408 卷面比例（数据结构 45 / 计组 45 / 操作系统 35 / 计算机网络 25）动态组卷，一次刷完四科。',
      chapters: [], from: ['ds', 'co', 'os', 'cn']
    },
    ds: {
      id: 'ds', name: '数据结构', short: '数据结构', kind: 'subject',
      tag: '408 · 45 分', score: '45 分', color: '#2B6DE5', soft: '#EAF1FE', icon: 'tree',
      desc: '线性表、树、图的存储与算法，查找与排序的复杂度对照，是 408 里最讲究手感的一科。',
      chapters: [
        { id: 'ds-1', n: '绪论', d: '逻辑结构 / 存储结构 / 复杂度分析', hot: 1 },
        { id: 'ds-2', n: '线性表', d: '顺序表、链表、就地逆置与合并', hot: 1 },
        { id: 'ds-3', n: '栈、队列和数组', d: '循环队列、表达式求值、矩阵压缩', hot: 1 },
        { id: 'ds-4', n: '串', d: 'KMP 的 next / nextval 手算', hot: 0 },
        { id: 'ds-5', n: '树与二叉树', d: '性质、遍历还原、线索树、哈夫曼', hot: 1 },
        { id: 'ds-6', n: '图', d: '存储结构、最小生成树、最短路径、关键路径', hot: 1 },
        { id: 'ds-7', n: '查找', d: '折半判定树、B/B+ 树、散列表 ASL', hot: 1 },
        { id: 'ds-8', n: '排序', d: '八大排序对照、一趟特征反推、外部排序', hot: 1 }
      ]
    },
    co: {
      id: 'co', name: '计算机组成原理', short: '计组', kind: 'subject',
      tag: '408 · 45 分', score: '45 分', color: '#7C5CE0', soft: '#F0ECFD', icon: 'cpu',
      desc: '从数据表示到流水线，算得清楚比分得清更重要：地址位划分、补码运算、CPI 与 Amdahl。',
      chapters: [
        { id: 'co-1', n: '计算机系统概述', d: '冯·诺依曼结构、CPI / MIPS / 性能公式', hot: 1 },
        { id: 'co-2', n: '数据的表示和运算', d: '原反补移、IEEE 754、加法器与乘除法', hot: 1 },
        { id: 'co-3', n: '存储系统', d: 'SRAM/DRAM、Cache 映射、虚拟存储、AMAT', hot: 1 },
        { id: 'co-4', n: '指令系统', d: '寻址方式、指令格式、CISC 与 RISC', hot: 1 },
        { id: 'co-5', n: '中央处理器', d: '数据通路、控制器、流水线与数据冒险', hot: 1 },
        { id: 'co-6', n: '总线', d: '总线仲裁、定时、带宽计算', hot: 0 },
        { id: 'co-7', n: '输入/输出系统', d: '中断、DMA、程序查询方式', hot: 1 }
      ]
    },
    os: {
      id: 'os', name: '操作系统', short: '操作系统', kind: 'subject',
      tag: '408 · 35 分', score: '35 分', color: '#0FAF83', soft: '#E6F7F1', icon: 'gear',
      desc: '进程同步是命门，内存与文件是主战场，调度和死锁算的是表格与公式。',
      chapters: [
        { id: 'os-1', n: '计算机系统概述', d: 'OS 特征与功能、内核态与用户态', hot: 1 },
        { id: 'os-2', n: '进程与线程', d: 'PCB、状态转换、线程模型、通信', hot: 1 },
        { id: 'os-3', n: '处理机调度', d: 'FCFS/SJF/优先级/多级反馈、周转时间', hot: 1 },
        { id: 'os-4', n: '同步与互斥', d: 'PV 操作、管程、经典同步问题', hot: 1 },
        { id: 'os-5', n: '死锁', d: '四个必要条件、银行家算法、安全序列', hot: 1 },
        { id: 'os-6', n: '内存管理', d: '分页分段、页面置换、虚拟内存、地址变换', hot: 1 },
        { id: 'os-7', n: '文件管理', d: '目录结构、文件分配、磁盘空间管理', hot: 1 },
        { id: 'os-8', n: '输入/输出管理', d: 'I/O 软件层次、SPOOLing、磁盘调度', hot: 1 }
      ]
    },
    cn: {
      id: 'cn', name: '计算机网络', short: '计网', kind: 'subject',
      tag: '408 · 25 分', score: '25 分', color: '#0E9AA7', soft: '#E3F6F8', icon: 'network',
      desc: '分层背清楚、算得细：子网划分、滑动窗口、拥塞控制、TCP 序号与握手挥手。',
      chapters: [
        { id: 'cn-1', n: '计算机网络体系结构', d: 'OSI 七层与 TCP/IP 四层、各层协议栈', hot: 1 },
        { id: 'cn-2', n: '物理层', d: '码元与速率、编码调制、奈氏与香农', hot: 1 },
        { id: 'cn-3', n: '数据链路层', d: '差错控制、CSMA/CD、以太网帧、交换机', hot: 1 },
        { id: 'cn-4', n: '网络层', d: 'IPv4 地址与子网、路由协议、NAT、ARP', hot: 1 },
        { id: 'cn-5', n: '传输层', d: 'TCP 连接管理、滑动窗口、拥塞控制', hot: 1 },
        { id: 'cn-6', n: '应用层', d: 'DNS、HTTP、FTP、电子邮件', hot: 0 }
      ]
    },
    math: {
      id: 'math', name: '高等数学（一）', short: '高数', kind: 'subject',
      tag: '数学一 · 约 82 分', score: '82 分', color: '#FF7A45', soft: '#FFF1EA', icon: 'sigma',
      desc: '按历年数学一真题的题型与难度整理：极限、中值定理、重积分、级数与微分方程。',
      chapters: [
        { id: 'm-1', n: '函数、极限与连续', d: '等价无穷小、洛必达、连续性判定', hot: 1 },
        { id: 'm-2', n: '一元函数微分学', d: '导数与微分、中值定理、单调与极值', hot: 1 },
        { id: 'm-3', n: '一元函数积分学', d: '不定积分、定积分、反常积分', hot: 1 },
        { id: 'm-4', n: '向量代数与空间解析几何', d: '平面与直线、曲面方程', hot: 0 },
        { id: 'm-5', n: '多元函数微分学', d: '偏导与全微分、极值、方向导数', hot: 1 },
        { id: 'm-6', n: '多元函数积分学', d: '二重/三重积分、曲线曲面积分、格林公式', hot: 1 },
        { id: 'm-7', n: '无穷级数', d: '常数项级数判敛、幂级数、傅里叶级数', hot: 1 },
        { id: 'm-8', n: '常微分方程', d: '一阶方程、可降阶、二阶常系数', hot: 1 }
      ]
    }
  },
  /* 408 综合卷配比（题数），按真实卷面分值比例 */
  compositePlan: [
    { sid: 'ds', n: 12 }, { sid: 'co', n: 12 }, { sid: 'os', n: 9 }, { sid: 'cn', n: 7 }
  ],
  subjectsOrder: ['all', 'ds', 'co', 'os', 'cn', 'math'],
  subjectOrder: ['ds', 'co', 'os', 'cn', 'math'],
  q: {},   /* question bank: { ds:[...], ... } */
  k: {}    /* knowledge cards:  { ds:[...], ... } */
};
