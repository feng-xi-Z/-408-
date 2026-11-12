/* 本地预览服务器：node tools/serve.mjs 然后浏览器打开 http://127.0.0.1:8080 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 8080);
const FILE = path.resolve('dist/kaoyan-408.html');

http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  try {
    const html = fs.readFileSync(FILE);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(html);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('请先运行 node tools/build.mjs 生成 dist/kaoyan-408.html');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`预览地址：http://127.0.0.1:${PORT}`);
  console.log('（按 Ctrl+C 停止）');
});
