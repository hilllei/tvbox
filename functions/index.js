// Cloudflare Pages Function —— TVBox 源「伪装网关」
// ----------------------------------------------------------------------------
// 文件位置（在你的 GitHub 仓库里）：functions/index.js
//   - 浏览器访问站点根路径  → 显示诗词网页
//   - TVBox / OkHttp 访问   → 返回同仓库 ok.json 的内容（URL 不变，最像伪装）
//
// 为什么能行：TVBox 拉源只发 HTTP GET 并解析 JSON、不执行 JS，
//   必须在服务端按 User-Agent 分流。Pages Function 就是跑在服务端的 JS。
//
// 部署：把本文件和 ok.json 一起 push 到 GitHub，Cloudflare Pages 自动同步重部署。
//   原有 ok.json 直链 (/ok.json) 依旧可用；新增的 / 变成伪装网关。
// ----------------------------------------------------------------------------

// ===================== 配置区（按需修改） =====================
const SITE_TITLE   = 'Find TV';
const SITE_SUB     = '山有木兮木有枝';
const SITE_TAGLINE = 'Mountains bear trees; my heart bears you .';
const SHOW_STAT    = true;

// 真实源：同仓库的 ok.json（用当前请求域名自动拼绝对地址，跟随部署环境）
// 想换成外部源时，直接改成完整 https 地址，例如 'https://tv.050700.xyz/ok.json'
const SOURCE_PATH  = 'ok.json';
// =============================================================

// 判断是否为 TVBox / 抓取类请求（与 PHP 版规则一致）
function isTvboxRequest(ua) {
  if (!ua) return true;                          // 空 UA → 当作 TVBox / 脚本
  if (!/mozilla/i.test(ua)) return true;         // 不含 Mozilla → 基本是 OkHttp
  const bots = ['okhttp', 'tvbox', 'catbox', 'json', 'spider', 'curl', 'wget',
    'python', 'go-http', 'java/', 'libwww', 'dalvik',
    '影视仓', '影視倉', 'ysc', 'fongmi'];
  const low = ua.toLowerCase();
  return bots.some(b => low.includes(b));
}

// 浏览器看到的诗词网页
function renderHtml(ip, browser) {
  const stat = SHOW_STAT
    ? `<div class="stat">IP：${ip} · 浏览器：${browser}</div>` : '';
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${SITE_TITLE}</title><style>
:root{--bg:#f6f7fb;--card:#fff;--text:#1f2430;--muted:#7a8194;--line:#e8eaf0;--accent:#4f7cff}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
background:linear-gradient(180deg,#eef1f8,#f6f7fb);color:var(--text);
min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;max-width:560px;
width:100%;padding:40px 36px;box-shadow:0 12px 40px rgba(31,36,48,.08)}
.badge{display:inline-block;font-size:12px;color:var(--accent);background:#eef2ff;
padding:4px 10px;border-radius:999px;margin-bottom:18px}
h1{font-size:26px;font-weight:700;margin-bottom:6px}
.sub{color:var(--muted);font-size:14px;margin-bottom:22px}
.desc{line-height:1.8;color:#4a5160;font-size:15px;margin-bottom:24px}
.poem{border-top:1px solid var(--line);padding-top:24px;line-height:2.2;color:#4a5160;font-size:15px}
.poem em{display:block;margin-top:14px;text-align:right;font-style:normal;color:var(--muted);font-size:12px}
footer{margin-top:26px;font-size:12px;color:var(--muted);text-align:center}
.stat{margin-top:8px;font-size:11px;color:var(--muted);text-align:center}
</style></head><body><main class="card">
<span class="badge">${SITE_TITLE}</span><h1>${SITE_SUB}</h1>
<div class="sub">${SITE_TAGLINE}</div><p class="desc">The TV is working correctly.</p>
<div class="poem">今夕何夕兮，搴舟中流。<br>今日何日兮，得与王子同舟。<br>
蒙羞被好兮，不訾诟耻。<br>心几烦而不绝兮，得知王子。<br>
山有木兮木有枝，心悦君兮君不知。
<em>—— 先秦《越人歌》· 载于 西汉·刘向《说苑·善说》</em></div>
<footer>© ${new Date().getFullYear()} ${SITE_TITLE}. All rights reserved.</footer>${stat}
</main></body></html>`;
}

export async function onRequest(context) {
  const { request } = context;
  const ua = request.headers.get('user-agent') || '';
  const ip = request.headers.get('cf-connecting-ip') || '';

  if (isTvboxRequest(ua)) {
    // TVBox：拉取同站 ok.json 并原样返回（URL 不变，最像伪装）
    const target = new URL(SOURCE_PATH, request.url);
    const resp = await fetch(target.toString(), { headers: { 'user-agent': ua } });
    return new Response(resp.body, {
      status: resp.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }

  // 浏览器：返回诗词网页
  return new Response(renderHtml(ip, ua || '未知客户端'), {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
