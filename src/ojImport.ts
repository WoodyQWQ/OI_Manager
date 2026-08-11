/**
 * OJ 题目导入适配器
 *
 * 1. 洛谷：HTML 页面内嵌 JSON（需 CORS 代理，解析 <script> 中 currentData）
 * 2. Codeforces：官方 API（支持 CORS，可直连）
 * 3. 通用粘贴：手动粘贴题面
 */

export type OJSource = 'luogu' | 'codeforces' | 'paste';

export interface ImportResult {
  slug: string;
  title: string;
  statement: string;
  timeLimitMs?: number;
  memoryLimitMB?: number;
  tags?: string[];
  samples?: { input: string; output: string }[];
  source?: string; // 题目出处，如 "洛谷" / "Codeforces" / "粘贴导入"
}

/** CORS 代理列表（按优先级尝试） */
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

/** 带超时的 fetch */
async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** 通过代理获取 HTML 文本 */
async function fetchHtmlViaProxy(pageUrl: string): Promise<string> {
  let lastErr: unknown;
  for (const makeUrl of CORS_PROXIES) {
    try {
      const res = await fetchWithTimeout(makeUrl(pageUrl));
      const text = await res.text();
      if (text.length < 1000) throw new Error('响应过短，可能被代理拦截');
      return text;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`所有代理均失败：${lastErr instanceof Error ? lastErr.message : '未知错误'}`);
}

/**
 * 从洛谷页面 HTML 中提取嵌入的 JSON 数据。
 * 洛谷新版前端将数据嵌入在一个 <script> 标签中，
 * 以 {"instance":"main",...} 开头，包含 data.problem 等完整信息。
 */
function extractLuoguData(html: string): any {
  // 找到包含 "instance":"main" 的 <script> 标签
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(html)) !== null) {
    const content = m[1].trim();
    if (content.startsWith('{"instance"')) {
      try {
        return JSON.parse(content);
      } catch {
        // 可能包含 HTML 转义，尝试清理
        throw new Error('JSON 解析失败，数据可能被转义');
      }
    }
  }
  throw new Error('页面中未找到洛谷数据（可能是页面结构已更新）');
}

/** 洛谷导入 */
export async function importFromLuogu(pid: string): Promise<ImportResult> {
  const cleanPid = pid.trim().toUpperCase();
  const pageUrl = `https://www.luogu.com.cn/problem/${cleanPid}`;

  const html = await fetchHtmlViaProxy(pageUrl);
  const parsed = extractLuoguData(html);
  const p = parsed?.data?.problem || parsed?.problem;
  if (!p) throw new Error('未找到题目数据，请检查题号是否正确');

  // 新版洛谷结构：content 对象包含 name/background/description/formatI/formatO/hint
  // content.locale 为 'zh-CN'，contenu 为英文/法文
  const zh = p.content && typeof p.content === 'object' ? p.content : {};
  const en = p.contenu && typeof p.contenu === 'object' ? p.contenu : {};

  const title = zh.name || en.name || p.name || cleanPid;
  const background = zh.background || en.background || '';
  const description = zh.description || en.description || '';
  const formatI = zh.formatI || en.formatI || '';
  const formatO = zh.formatO || en.formatO || '';
  const hint = zh.hint || en.hint || '';

  const sections: string[] = [];
  if (background) sections.push(`## 题目背景\n\n${background}\n`);
  if (description) sections.push(`## 题目描述\n\n${description}\n`);
  if (formatI) sections.push(`## 输入格式\n\n${formatI}\n`);
  if (formatO) sections.push(`## 输出格式\n\n${formatO}\n`);

  const samples: { input: string; output: string }[] = [];
  if (Array.isArray(p.samples)) {
    p.samples.forEach((s: [string, string], i: number) => {
      const inp = Array.isArray(s) ? s[0] : '';
      const out = Array.isArray(s) ? s[1] : '';
      samples.push({ input: inp, output: out });
      sections.push(`### 样例 ${i + 1}\n\n**输入**\n\n\`\`\`\n${inp}\n\`\`\`\n\n**输出**\n\n\`\`\`\n${out}\n\`\`\`\n`);
    });
  }

  if (hint) sections.push(`## 提示\n\n${hint}\n`);

  // 解析时空限制
  const limits = p.limits;
  let timeMs = 1000;
  let memMB = 128;
  if (limits?.time?.['c++']?.[0] !== undefined) timeMs = limits.time['c++'][0];
  else if (limits?.time?.default?.[0] !== undefined) timeMs = limits.time.default[0];
  if (limits?.memory?.['c++']?.[0] !== undefined) memMB = Math.round(limits.memory['c++'][0] / 1024);
  else if (limits?.memory?.default?.[0] !== undefined) memMB = Math.round(limits.memory.default[0] / 1024);

  return {
    slug: cleanPid,
    title,
    statement: sections.join('\n'),
    timeLimitMs: timeMs,
    memoryLimitMB: memMB,
    tags: p.tags || [],
    samples,
    source: '洛谷',
  };
}

/** Codeforces 导入（API 支持 CORS，直连无需代理） */
export async function importFromCodeforces(contestId: string, index: string): Promise<ImportResult> {
  const cid = contestId.trim();
  const idx = index.trim().toUpperCase();
  const slug = `CF${cid}${idx}`;

  // 使用 contest.standings 获取特定比赛题目列表
  const apiUrl = `https://codeforces.com/api/contest.standings?contestId=${cid}&from=1&count=1`;

  let json: any;
  try {
    const res = await fetchWithTimeout(apiUrl);
    json = await res.json();
  } catch {
    json = await fetchJsonViaProxy(apiUrl);
  }

  if (json.status !== 'OK') throw new Error('Codeforces API 返回错误');

  const problem = json.result?.problems?.find(
    (p: any) => String(p.contestId) === cid && p.index === idx
  );

  if (!problem) throw new Error(`未找到题目 ${cid}${idx}`);

  const statement = `## ${problem.name}\n\n> 从 Codeforces 导入（题号 ${cid}${idx}）\n>\n> Codeforces API 不提供题面内容，请手动粘贴题目描述。\n>\n> 题目链接：https://codeforces.com/contest/${cid}/problem/${idx}\n\n## TODO: 手动补充题面\n\n请从 [题目页面](https://codeforces.com/contest/${cid}/problem/${idx}) 复制题面内容到此处。\n`;

  return {
    slug,
    title: problem.name,
    statement,
    timeLimitMs: problem.timeLimit ? problem.timeLimit * 1000 : 1000,
    memoryLimitMB: problem.memoryLimit ? Math.round(problem.memoryLimit / 1024) : 256,
    tags: problem.tags || [],
    source: 'Codeforces',
  };
}

/** 通过代理获取 JSON（用于 CF 回退） */
async function fetchJsonViaProxy(apiUrl: string): Promise<any> {
  let lastErr: unknown;
  for (const makeUrl of CORS_PROXIES) {
    try {
      const res = await fetchWithTimeout(makeUrl(apiUrl));
      const text = await res.text();
      if (text.trimStart().startsWith('<')) {
        throw new Error('代理返回了 HTML 而非 JSON');
      }
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`所有代理均失败：${lastErr instanceof Error ? lastErr.message : '未知错误'}`);
}

/** 粘贴导入 */
export function importFromPaste(
  slug: string,
  title: string,
  statement: string,
  opts?: { timeLimitMs?: number; memoryLimitMB?: number; tags?: string[] }
): ImportResult {
  return {
    slug: slug.trim(),
    title: title.trim(),
    statement,
    timeLimitMs: opts?.timeLimitMs ?? 1000,
    memoryLimitMB: opts?.memoryLimitMB ?? 256,
    tags: opts?.tags ?? [],
    source: '粘贴导入',
  };
}
