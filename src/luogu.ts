import type { Problem, TestCase, Subtask } from './types';

/**
 * 洛谷格式适配器
 * 生成 problem.conf + config.yml + data/ 目录结构
 */

/** 生成 problem.conf 内容 */
export function generateProblemConf(
  problem: Problem,
  subtasks: Subtask[],
  testCases: TestCase[],
): string {
  const lines: string[] = [];
  const c = problem.config;
  // 确保 type 字段存在（旧数据兼容）
  const type: 'default' | 'interactive' | 'submit_answer' = (c as any).type || (c.isInteractive ? 'interactive' : 'default');

  lines.push(`title=${problem.title}`);

  if (type === 'submit_answer') {
    // 提交答案题：时限内存写默认值，但不影响实际评测
    lines.push(`timelimit=1.0`);
    lines.push(`memorylimit=128`);
    lines.push(`submit_answer=on`);
  } else {
    lines.push(`timelimit=${(c.timeLimitMs / 1000).toFixed(1)}`);
    lines.push(`memorylimit=${c.memoryLimitMB}`);
  }

  if (type !== 'submit_answer' && c.enableO2) {
    lines.push(`enable_o2=1`);
  }

  if (c.useSpj) {
    lines.push(`using_answer_checker=on`);
    lines.push(`answer_checker_cmd=./spj`);
  } else if (type === 'submit_answer') {
    // 提交答案题默认使用内置 checker
    lines.push(`use_builtin_checker=on`);
  } else {
    lines.push(`use_builtin_checker=on`);
  }

  if (type === 'interactive') {
    lines.push(`interactive=on`);
  }

  if (c.fileIO.enabled && type !== 'submit_answer') {
    lines.push(`file_io_input_name=${c.fileIO.inputFileName}`);
    lines.push(`file_io_output_name=${c.fileIO.outputFileName}`);
  }

  lines.push(`subtask_count=${subtasks.length}`);

  // 按 index 排序 subtask
  const sorted = [...subtasks].sort((a, b) => a.index - b.index);

  for (const sub of sorted) {
    const subCases = testCases.filter(tc => tc.subtaskIds.includes(sub.id));
    const caseNumbers = subCases.map(tc => tc.number).sort((a, b) => a - b);

    lines.push('');
    lines.push(`subtask${sub.index}_begin`);
    lines.push(`score=${sub.score}`);
    lines.push(`type=${sub.scoringType}`);
    lines.push(`case_num_begin`);
    lines.push(`${caseNumbers.length}`);
    lines.push(caseNumbers.join(' '));
    lines.push(`case_num_end`);
    lines.push(`depend_begin`);
    lines.push(`${sub.dependsOn.length}`);
    lines.push(sub.dependsOn.join(' '));
    lines.push(`depend_end`);
    lines.push(`subtask${sub.index}_end`);
  }

  return lines.join('\n') + '\n';
}

/** 生成 config.yml 内容（洛谷增强格式） */
export function generateConfigYml(
  problem: Problem,
  subtasks: Subtask[],
  testCases: TestCase[],
): string {
  const c = problem.config;
  const type: 'default' | 'interactive' | 'submit_answer' = (c as any).type || (c.isInteractive ? 'interactive' : 'default');
  const lines: string[] = [];

  lines.push(`type: ${type}`);
  lines.push(``);
  lines.push(`time_limit: ${type === 'submit_answer' ? 1000 : c.timeLimitMs}`);
  lines.push(`memory_limit: ${(type === 'submit_answer' ? 128 : c.memoryLimitMB) * 1024 * 1024}`);
  lines.push(``);

  if (c.useSpj) {
    lines.push(`checker:`);
    lines.push(`  type: custom`);
    lines.push(`  checker: ./spj`);
    lines.push(`  lang: cpp`);
  } else {
    lines.push(`checker:`);
    lines.push(`  type: default`);
  }
  lines.push(``);

  lines.push(`subtasks:`);
  const sorted = [...subtasks].sort((a, b) => a.index - b.index);

  for (const sub of sorted) {
    const subCases = testCases.filter(tc => tc.subtaskIds.includes(sub.id));
    const caseNumbers = subCases.map(tc => tc.number).sort((a, b) => a - b);

    lines.push(`  - id: ${sub.index}`);
    lines.push(`    score: ${sub.score}`);
    lines.push(`    type: ${sub.scoringType}`);
    lines.push(`    cases: [${caseNumbers.join(', ')}]`);
    if (sub.dependsOn.length > 0) {
      lines.push(`    depends: [${sub.dependsOn.join(', ')}]`);
    } else {
      lines.push(`    depends: []`);
    }
  }

  return lines.join('\n') + '\n';
}

/** 导出完整洛谷 ZIP 包 */
export async function exportLuoguZip(
  problem: Problem,
  subtasks: Subtask[],
  testCases: TestCase[],
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // 顶层目录名：{slug}-{title}
  const dirName = `${problem.slug}-${problem.title}`.replace(/[^\w\-]/g, '_');
  const root = zip.folder(dirName)!;
  const c = problem.config;
  const type: 'default' | 'interactive' | 'submit_answer' = (c as any).type || (c.isInteractive ? 'interactive' : 'default');

  // problem.conf
  root.file('problem.conf', generateProblemConf(problem, subtasks, testCases));

  // config.yml
  root.file('config.yml', generateConfigYml(problem, subtasks, testCases));

  // data/ 目录
  const dataDir = root.folder('data')!;
  const sorted = [...testCases].sort((a, b) => a.number - b.number);
  for (const tc of sorted) {
    // 提交答案题：仅写 .out
    if (type !== 'submit_answer' && tc.inputContent) {
      dataDir.file(`${tc.number}.in`, tc.inputContent);
    }
    if (tc.outputContent) {
      dataDir.file(`${tc.number}.out`, tc.outputContent);
    }
  }

  // 提交答案题额外说明
  if (type === 'submit_answer') {
    root.file('README-SUBMIT-ANSWER.txt',
      '这是一道提交答案题。\n学生需要提交的文件是压缩包，每道测试点一个 out，命名方式：{number}.out\n\n' +
      '洛谷中 upload_subtask_answer 字段对应请参考：https://help.luogu.com.cn/docs/intro/luogu-features/problem-maker/'
    );
  }

  return zip.generateAsync({ type: 'blob' });
}

/** 仅导出测试点数据 ZIP（不含 problem.conf / config.yml，用于洛谷手动配置） */
export async function exportTestCasesOnlyZip(
  problem: Problem,
  testCases: TestCase[],
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const dirName = `${problem.slug}-${problem.title}`.replace(/[^\w\-]/g, '_');
  const root = zip.folder(dirName)!;
  const dataDir = root.folder('data')!;

  const sorted = [...testCases].sort((a, b) => a.number - b.number);
  for (const tc of sorted) {
    if (tc.inputContent) {
      dataDir.file(`${tc.number}.in`, tc.inputContent);
    }
    if (tc.outputContent) {
      dataDir.file(`${tc.number}.out`, tc.outputContent);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}
