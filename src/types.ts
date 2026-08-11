// ====== 领域模型类型定义 ======

/** 题型 */
export type ProblemType =
  | 'default'      // 传统题：编译运行 + 输入输出比对
  | 'interactive'  // 交互题
  | 'submit_answer'; // 提交答案题：只有 .out

/** 题目配置 */
export interface ProblemConfig {
  type: ProblemType;
  timeLimitMs: number;
  memoryLimitMB: number;
  enableO2: boolean;
  isInteractive: boolean; // 保留向后兼容，实际优先使用 type
  useSpj: boolean;
  fileIO: {
    enabled: boolean;
    inputFileName: string;
    outputFileName: string;
  };
}

/** 题目 */
export interface Problem {
  id: string;
  slug: string; // 题目编号，如 P1001
  title: string;
  tags: string[];
  config: ProblemConfig;
  statement: string; // Markdown 题面
  source?: string; // 题目出处，如 "洛谷" / "Codeforces" / "AtCoder" / "粘贴导入" / "OI_Manager"（新建默认）
  createdAt: number;
  updatedAt: number;
}

/** 测试点 */
export interface TestCase {
  id: string;
  problemId: string;
  number: number; // 导出编号
  note: string;
  inputContent: string; // 文本内容（原型阶段直接存字符串）
  outputContent: string;
  inputSize: number;
  outputSize: number;
  subtaskIds: string[]; // 所属 Subtask
  createdAt: number;
}

/** Subtask */
export interface Subtask {
  id: string;
  problemId: string;
  index: number; // 从 1 开始
  name: string;
  score: number;
  scoringType: 'min' | 'sum';
  dependsOn: number[]; // 依赖的 Subtask index 列表
  createdAt: number;
}

/** 样例 */
export interface Sample {
  id: string;
  problemId: string;
  inputContent: string;
  outputContent: string;
}

/** 默认题目配置 */
export function defaultConfig(): ProblemConfig {
  return {
    type: 'default',
    timeLimitMs: 1000,
    memoryLimitMB: 128,
    enableO2: true,
    isInteractive: false,
    useSpj: false,
    fileIO: {
      enabled: false,
      inputFileName: '',
      outputFileName: '',
    },
  };
}
