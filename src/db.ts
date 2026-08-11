import Dexie, { type Table } from 'dexie';
import type { Problem, TestCase, Subtask, Sample } from './types';

export class LuoguTDKDB extends Dexie {
  problems!: Table<Problem, string>;
  testCases!: Table<TestCase, string>;
  subtasks!: Table<Subtask, string>;
  samples!: Table<Sample, string>;

  constructor() {
    super('luogu-tdk');
    this.version(1).stores({
      problems: 'id, slug, updatedAt',
      testCases: 'id, problemId, number',
      subtasks: 'id, problemId, index',
      samples: 'id, problemId',
    });
  }
}

export const db = new LuoguTDKDB();

// ====== 题目 CRUD ======

export async function createProblem(data: Pick<Problem, 'slug' | 'title'> & { source?: string }): Promise<Problem> {
  const now = Date.now();
  const problem: Problem = {
    id: crypto.randomUUID(),
    slug: data.slug,
    title: data.title,
    tags: [],
    config: {
      type: 'default',
      timeLimitMs: 1000,
      memoryLimitMB: 128,
      enableO2: true,
      isInteractive: false,
      useSpj: false,
      fileIO: { enabled: false, inputFileName: '', outputFileName: '' },
    },
    statement: '',
    source: data.source || 'OI_Manager',
    createdAt: now,
    updatedAt: now,
  };
  await db.problems.add(problem);
  return problem;
}

export async function updateProblem(id: string, patch: Partial<Problem>): Promise<void> {
  await db.problems.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteProblem(id: string): Promise<void> {
  await db.transaction('rw', db.problems, db.testCases, db.subtasks, db.samples, async () => {
    await db.testCases.where('problemId').equals(id).delete();
    await db.subtasks.where('problemId').equals(id).delete();
    await db.samples.where('problemId').equals(id).delete();
    await db.problems.delete(id);
  });
}

// ====== 测试点 CRUD ======

export async function addTestCase(data: Pick<TestCase, 'problemId' | 'inputContent' | 'outputContent' | 'note'>): Promise<TestCase> {
  // 计算下一个编号
  const existing = await db.testCases.where('problemId').equals(data.problemId).toArray();
  const maxNum = existing.reduce((m, tc) => Math.max(m, tc.number), 0);

  const tc: TestCase = {
    id: crypto.randomUUID(),
    problemId: data.problemId,
    number: maxNum + 1,
    note: data.note || '',
    inputContent: data.inputContent,
    outputContent: data.outputContent,
    inputSize: new Blob([data.inputContent]).size,
    outputSize: new Blob([data.outputContent]).size,
    subtaskIds: [],
    createdAt: Date.now(),
  };
  await db.testCases.add(tc);
  return tc;
}

export async function updateTestCase(id: string, patch: Partial<TestCase>): Promise<void> {
  const update = { ...patch };
  if (patch.inputContent !== undefined) update.inputSize = new Blob([patch.inputContent]).size;
  if (patch.outputContent !== undefined) update.outputSize = new Blob([patch.outputContent]).size;
  await db.testCases.update(id, update);
}

export async function deleteTestCase(id: string): Promise<void> {
  const tc = await db.testCases.get(id);
  await db.testCases.delete(id);
  // 重新编号
  if (tc) {
    const remaining = await db.testCases.where('problemId').equals(tc.problemId).sortBy('number');
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].number !== i + 1) {
        await db.testCases.update(remaining[i].id, { number: i + 1 });
      }
    }
  }
}

// ====== Subtask CRUD ======

export async function addSubtask(problemId: string): Promise<Subtask> {
  const existing = await db.subtasks.where('problemId').equals(problemId).toArray();
  const maxIdx = existing.reduce((m, s) => Math.max(m, s.index), 0);

  const sub: Subtask = {
    id: crypto.randomUUID(),
    problemId,
    index: maxIdx + 1,
    name: `Subtask ${maxIdx + 1}`,
    score: 0,
    scoringType: 'min',
    dependsOn: [],
    createdAt: Date.now(),
  };
  await db.subtasks.add(sub);
  return sub;
}

export async function updateSubtask(id: string, patch: Partial<Subtask>): Promise<void> {
  await db.subtasks.update(id, patch);
}

export async function deleteSubtask(id: string): Promise<void> {
  await db.subtasks.delete(id);
}
