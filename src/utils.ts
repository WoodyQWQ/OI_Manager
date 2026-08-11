/**
 * 工具函数
 */
export type ProblemType = 'default' | 'interactive' | 'submit_answer';

/** 格式化文件大小 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 从文件名提取测试点编号 */
export function parseTestCaseName(filename: string): { base: string; ext: string } | null {
  const match = filename.match(/^(.+?)\.(in|out|ans)$/i);
  if (!match) return null;
  return { base: match[1], ext: match[2].toLowerCase() };
}

/**
 * 智能配对上传的文件
 * 将 .in 和 .out/.ans 文件按 base 名配对
 */
export interface PairedTestCase {
  baseName: string;
  inputContent: string;
  outputContent: string;
  hasInput: boolean;
  hasOutput: boolean;
}

export async function pairFiles(files: File[]): Promise<PairedTestCase[]> {
  const map = new Map<string, { input?: File; output?: File }>();

  for (const file of files) {
    const parsed = parseTestCaseName(file.name);
    if (!parsed) continue;

    const entry = map.get(parsed.base) || {};
    if (parsed.ext === 'in') {
      entry.input = file;
    } else {
      entry.output = file;
    }
    map.set(parsed.base, entry);
  }

  const result: PairedTestCase[] = [];
  for (const [baseName, { input, output }] of map) {
    const inputContent = input ? await input.text() : '';
    const outputContent = output ? await output.text() : '';
    result.push({
      baseName,
      inputContent,
      outputContent,
      hasInput: !!input,
      hasOutput: !!output,
    });
  }

  // 按文件名排序
  result.sort((a, b) => a.baseName.localeCompare(b.baseName, undefined, { numeric: true }));
  return result;
}

/** 下载 Blob 为文件 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 验证：Subtask 依赖图无环（拓扑排序） */
export function hasDependencyCycle(subtasks: any[]): boolean {
  const inDegree = new Map<number, number>();
  const adj = new Map<number, number[]>();

  for (const s of subtasks) {
    inDegree.set(s.index, 0);
    adj.set(s.index, []);
  }
  for (const s of subtasks) {
    for (const dep of s.dependsOn) {
      if (!inDegree.has(dep)) continue;
      adj.get(dep)!.push(s.index);
      inDegree.set(s.index, (inDegree.get(s.index) || 0) + 1);
    }
  }

  const queue: number[] = [];
  inDegree.forEach((deg, idx) => { if (deg === 0) queue.push(idx); });

  let count = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    count++;
    for (const next of adj.get(cur) || []) {
      const d = (inDegree.get(next) || 0) - 1;
      inDegree.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  return count !== subtasks.length;
}

/** 校验结果项 */
export interface ValidationItem {
  level: 'error' | 'warning' | 'ok';
  message: string;
}

/** 完整校验 */
export function validateProblem(
  problem: any,
  subtasks: any[],
  testCases: any[],
): ValidationItem[] {
  const items: ValidationItem[] = [];
  const isSubmitAnswer = problem?.config?.type === 'submit_answer';

  // 1. 输入输出合法性校验（提交答案题可无 in，普通题必须 out）
  for (const tc of testCases) {
    if (!tc.inputContent && !tc.outputContent) {
      items.push({ level: 'error', message: `测试点 ${tc.number} 输入输出均为空` });
    } else if (!tc.outputContent) {
      items.push({ level: 'error', message: `测试点 ${tc.number} 缺少输出文件（.out）` });
    } else if (!isSubmitAnswer && !tc.inputContent) {
      items.push({ level: 'warning', message: `测试点 ${tc.number} 缺少输入文件（.in）` });
    }
  }

  // 2. Subtask 分数之和 == 100
  const totalScore = subtasks.reduce((sum, s) => sum + s.score, 0);
  if (subtasks.length > 0 && totalScore !== 100) {
    items.push({ level: 'error', message: `Subtask 总分 ${totalScore}，应为 100` });
  }

  // 3. 依赖图无环
  if (hasDependencyCycle(subtasks)) {
    items.push({ level: 'error', message: 'Subtask 依赖关系存在环' });
  }

  // 4. 测试点至少属于一个 Subtask
  for (const tc of testCases) {
    if (tc.subtaskIds.length === 0) {
      items.push({ level: 'warning', message: `测试点 ${tc.number} 未分配到任何 Subtask` });
    }
  }

  // 5. 依赖的 Subtask 存在
  const indices = new Set(subtasks.map(s => s.index));
  for (const sub of subtasks) {
    for (const dep of sub.dependsOn) {
      if (!indices.has(dep)) {
        items.push({ level: 'error', message: `Subtask ${sub.index} 依赖了不存在的 Subtask ${dep}` });
      }
    }
  }

  if (items.length === 0) {
    items.push({ level: 'ok', message: '所有校验通过' });
  }

  return items;
}
