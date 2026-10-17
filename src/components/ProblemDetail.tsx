import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateProblem } from '../db';
import { exportLuoguZip, exportTestCasesOnlyZip } from '../luogu';
import { validateProblem, downloadBlob, type ValidationItem, type ProblemType } from '../utils';
import { useTheme } from '../useTheme';
import TestCaseUploader from './TestCaseUploader';
import SubtaskEditor from './SubtaskEditor';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  problemId: string;
  onBack: () => void;
}

type Tab = 'testcases' | 'subtasks' | 'statement' | 'validate';

const TYPE_OPTIONS: { value: ProblemType; label: string; icon: string; desc: string }[] = [
  { value: 'default', label: '传统题', icon: '💻', desc: '编译运行 + 输入输出比对' },
  { value: 'submit_answer', label: '提交答案', icon: '📝', desc: '只需要 .out，学生提交答案包' },
  { value: 'interactive', label: '交互题', icon: '🔄', desc: '使用 interactor 与标程管道通信' },
];

export default function ProblemDetail({ problemId, onBack }: Props) {
  const problem = useLiveQuery(() => db.problems.get(problemId), [problemId]);
  const testCases = useLiveQuery(
    () => db.testCases.where('problemId').equals(problemId).sortBy('number'),
    [problemId],
  );
  const subtasks = useLiveQuery(
    () => db.subtasks.where('problemId').equals(problemId).sortBy('index'),
    [problemId],
  );

  const [tab, setTab] = useState<Tab>('testcases');
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showConfPreview, setShowConfPreview] = useState(false);
  const [statementView, setStatementView] = useState<'edit' | 'preview'>('edit');
  const { theme, toggle } = useTheme();

  if (!problem) return <div className="p-8 text-gray-400">加载中...</div>;

  // 旧数据迁移：确保 type 字段存在
  const rawType = (problem.config as any).type;
  const problemType: ProblemType = rawType || (problem.config.isInteractive ? 'interactive' : 'default');

  if (!rawType) {
    // 静默迁移
    (async () => {
      await updateProblem(problemId, {
        config: { ...problem.config, type: problemType },
      });
    })();
  }

  const c = problem.config;
  const validationItems: ValidationItem[] = problem && subtasks && testCases
    ? validateProblem(problem, subtasks, testCases)
    : [];

  const handleExport = async (mode: 'full' | 'testcases') => {
    if (!problem || !testCases) return;
    setExporting(true);
    setExportMenuOpen(false);
    try {
      let blob: Blob;
      if (mode === 'testcases') {
        blob = await exportTestCasesOnlyZip(problem, testCases);
      } else {
        if (!subtasks) return;
        blob = await exportLuoguZip(problem, subtasks, testCases);
      }
      downloadBlob(blob, `${problem.slug}-${problem.title}.zip`);
    } finally {
      setExporting(false);
    }
  };

  const setType = async (t: ProblemType) => {
    await updateProblem(problemId, {
      config: { ...c, type: t, isInteractive: t === 'interactive' },
    });
  };

  const errorCount = validationItems.filter(v => v.level === 'error').length;
  const warnCount = validationItems.filter(v => v.level === 'warning').length;

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: 'testcases', label: '测试点', badge: testCases?.length?.toString() },
    { key: 'subtasks', label: 'Subtask', badge: subtasks?.length?.toString() },
    { key: 'statement', label: '题面' },
    { key: 'validate', label: '校验', badge: errorCount > 0 ? `${errorCount}错误` : warnCount > 0 ? `${warnCount}警告` : undefined },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-950 transition-colors">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-700/60 px-6 py-2.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition">
            ← 返回
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-[11px] font-mono font-semibold tracking-wide">
            {problem.slug}
          </span>
          <input
            value={problem.title}
            onChange={e => updateProblem(problemId, { title: e.target.value })}
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-700 rounded-md px-2 py-1 w-72 tracking-tight"
          />
          {(() => {
            const t = problemType;
            const cls = t === 'submit_answer' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                       t === 'interactive' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' :
                       'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300';
            return <span className={`badge ${cls}`}>{TYPE_OPTIONS.find(o => o.value === t)?.label}</span>;
          })()}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="切换主题"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setShowConfPreview(!showConfPreview)}
            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition"
          >
            {showConfPreview ? '隐藏配置' : '预览配置'}
          </button>
          {/* 导出下拉菜单 */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={exporting}
              className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-xs font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-sm hover:shadow transition flex items-center gap-1"
            >
              {exporting ? '导出中...' : '📤 导出'}
              <span className={`text-[10px] transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-40">
                  <button
                    onClick={() => handleExport('full')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">📦 完整 ZIP</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">含 problem.conf + config.yml + data</span>
                  </button>
                  <button
                    onClick={() => handleExport('testcases')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">📁 仅测试点</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">只含 data/，洛谷手动配置</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 主内容区 */}
        <main className="flex-1 px-6 py-4">
          {/* 题型选择卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-5 mb-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">题目类型</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {TYPE_OPTIONS.map(opt => {
                const active = problemType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      active
                        ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-900/20 shadow-md shadow-blue-100/50 dark:shadow-blue-900/10'
                        : 'border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    {active && <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center shadow-sm">✓</span>}
                    <div className="text-xl mb-1.5">{opt.icon}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opt.label}</div>
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* 其他参数 */}
            <div className={`mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid gap-3 items-center ${
              problemType === 'submit_answer' ? 'grid-cols-1 opacity-60' : 'grid-cols-6'
            }`}>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400 whitespace-nowrap dark:text-gray-500">时限(ms)</span>
                <input
                  type="number"
                  value={c.timeLimitMs}
                  disabled={problemType === 'submit_answer'}
                  onChange={e => updateProblem(problemId, { config: { ...c, timeLimitMs: parseInt(e.target.value) || 1000 } })}
                  className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400 whitespace-nowrap dark:text-gray-500">内存(MB)</span>
                <input
                  type="number"
                  value={c.memoryLimitMB}
                  disabled={problemType === 'submit_answer'}
                  onChange={e => updateProblem(problemId, { config: { ...c, memoryLimitMB: parseInt(e.target.value) || 128 } })}
                  className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={c.enableO2 && problemType !== 'submit_answer'}
                  disabled={problemType === 'submit_answer'}
                  onChange={e => updateProblem(problemId, { config: { ...c, enableO2: e.target.checked } })}
                  className="rounded accent-blue-500 dark:accent-blue-400"
                />
                <span className="text-gray-600 dark:text-gray-300">O2 优化</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={c.useSpj}
                  onChange={e => updateProblem(problemId, { config: { ...c, useSpj: e.target.checked } })}
                  className="rounded accent-blue-500 dark:accent-blue-400"
                />
                <span className="text-gray-600 dark:text-gray-300">自定义 SPJ</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={c.fileIO.enabled && problemType !== 'submit_answer'}
                  disabled={problemType === 'submit_answer' || problemType === 'interactive'}
                  onChange={e => updateProblem(problemId, { config: { ...c, fileIO: { ...c.fileIO, enabled: e.target.checked } } })}
                  className="rounded accent-blue-500 dark:accent-blue-400"
                />
                <span className="text-gray-600 dark:text-gray-300">文件 IO</span>
              </label>
              <div />
            </div>
            {c.fileIO.enabled && problemType !== 'submit_answer' && problemType !== 'interactive' && (
              <div className="flex gap-3 mt-3 text-xs">
                <label className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500">输入文件名</span>
                  <input
                    value={c.fileIO.inputFileName}
                    onChange={e => updateProblem(problemId, { config: { ...c, fileIO: { ...c.fileIO, inputFileName: e.target.value } } })}
                    placeholder="apple.in"
                    className="w-32 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500">输出文件名</span>
                  <input
                    value={c.fileIO.outputFileName}
                    onChange={e => updateProblem(problemId, { config: { ...c, fileIO: { ...c.fileIO, outputFileName: e.target.value } } })}
                    placeholder="apple.out"
                    className="w-32 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Tab 栏 */}
          <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.label}
                {t.badge && (
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    t.key === 'validate' && errorCount > 0
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          {tab === 'testcases' && (
            <TestCaseUploader problemId={problemId} subtasks={subtasks ?? []} problemType={problemType} />
          )}

          {tab === 'subtasks' && (
            <SubtaskEditor problemId={problemId} />
          )}

          {tab === 'statement' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 dark:text-gray-500">使用 Markdown 编写题面，支持 LaTeX 公式（$...$ / $$...$$）、代码块、表格</p>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5 text-xs">
                  <button
                    onClick={() => setStatementView('edit')}
                    className={`px-3 py-1 rounded ${statementView === 'edit' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    onClick={() => setStatementView('preview')}
                    className={`px-3 py-1 rounded ${statementView === 'preview' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    👁️ 预览
                  </button>
                </div>
              </div>
              {statementView === 'edit' ? (
                <textarea
                  value={problem.statement}
                  onChange={e => updateProblem(problemId, { statement: e.target.value })}
                  placeholder={`## 题目描述\n\n## 输入格式\n\n## 输出格式\n\n## 样例\n\n## 数据范围`}
                  className="w-full h-[480px] px-4 py-3 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y shadow-sm"
                />
              ) : (
                <div className="w-full min-h-[480px] px-6 py-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm overflow-auto">
                  <MarkdownRenderer content={problem.statement} />
                </div>
              )}
            </div>
          )}

          {tab === 'validate' && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 mb-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-colors">
                <span className={`text-sm font-bold ${
                  errorCount > 0 ? 'text-red-600' :
                  warnCount > 0 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {errorCount > 0 ? `❌ ${errorCount} 个错误` :
                   warnCount > 0 ? `⚠️ ${warnCount} 个警告` :
                   '✅ 全部通过'}
                </span>
                {subtasks && subtasks.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    Subtask 总分: <span className={`font-bold ${
                      subtasks.reduce((s, sub) => s + sub.score, 0) === 100 ? 'text-green-600' : 'text-red-600'
                    }`}>{subtasks.reduce((s, sub) => s + sub.score, 0)}</span> / 100
                  </span>
                )}
              </div>
              {validationItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-4 py-2.5 rounded-xl text-sm shadow-sm border ${
                    item.level === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800' :
                    item.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-yellow-800' :
                    'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800'
                  }`}
                >
                  <span>{item.level === 'error' ? '❌' : item.level === 'warning' ? '⚠️' : '✅'}</span>
                  <span>{item.message}</span>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* 配置预览侧栏 */}
        {showConfPreview && (
          <aside className="w-[32rem] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-auto transition-colors" style={{ maxHeight: 'calc(100vh - 56px)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">📄 配置文件实时预览</h3>
              <button onClick={() => setShowConfPreview(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs transition-colors">✕</button>
            </div>
            <ConfPreview problemId={problemId} />
          </aside>
        )}
      </div>
    </div>
  );
}

/** 配置文件实时预览 */
function ConfPreview({ problemId }: { problemId: string }) {
  const problem = useLiveQuery(() => db.problems.get(problemId), [problemId]);
  const testCases = useLiveQuery(
    () => db.testCases.where('problemId').equals(problemId).sortBy('number'),
    [problemId],
  );
  const subtasks = useLiveQuery(
    () => db.subtasks.where('problemId').equals(problemId).sortBy('index'),
    [problemId],
  );

  const [tab, setTab] = useState<'conf' | 'yml'>('conf');

  if (!problem || !testCases || !subtasks) return <p className="text-gray-500 text-xs">加载中...</p>;

  const conf = generateConfSync(problem, subtasks, testCases);
  const yml = generateYmlSync(problem, subtasks, testCases);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 text-xs">
        <button onClick={() => setTab('conf')} className={`px-3 py-1 rounded ${tab === 'conf' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          problem.conf
        </button>
        <button onClick={() => setTab('yml')} className={`px-3 py-1 rounded ${tab === 'yml' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          config.yml
        </button>
      </div>
      <pre className="text-[11px] text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-[75vh] overflow-auto leading-5 border border-gray-200 dark:border-gray-700/60">{tab === 'conf' ? conf : yml}</pre>
    </div>
  );
}

function typeOf(problem: { config: any }): 'default' | 'interactive' | 'submit_answer' {
  return problem.config.type || (problem.config.isInteractive ? 'interactive' : 'default');
}

// 内联生成函数（与 luogu.ts 保持一致）
function generateConfSync(problem: { title: string; config: any }, subtasks: any[], testCases: any[]): string {
  const lines: string[] = [];
  const c = problem.config;
  const t = typeOf(problem as any);
  lines.push(`title=${problem.title}`);
  if (t === 'submit_answer') {
    lines.push(`timelimit=1.0`);
    lines.push(`memorylimit=128`);
    lines.push(`submit_answer=on`);
  } else {
    lines.push(`timelimit=${(c.timeLimitMs / 1000).toFixed(1)}`);
    lines.push(`memorylimit=${c.memoryLimitMB}`);
  }
  if (t !== 'submit_answer' && c.enableO2) lines.push(`enable_o2=1`);
  if (c.useSpj) { lines.push(`using_answer_checker=on`); lines.push(`answer_checker_cmd=./spj`); }
  else lines.push(`use_builtin_checker=on`);
  if (t === 'interactive') lines.push(`interactive=on`);
  if (c.fileIO.enabled && t !== 'submit_answer') {
    lines.push(`file_io_input_name=${c.fileIO.inputFileName}`);
    lines.push(`file_io_output_name=${c.fileIO.outputFileName}`);
  }
  lines.push(`subtask_count=${subtasks.length}`);
  for (const sub of subtasks) {
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

function generateYmlSync(problem: { title: string; config: any }, subtasks: any[], testCases: any[]): string {
  const c = problem.config;
  const t = typeOf(problem as any);
  const lines: string[] = [];
  lines.push(`type: ${t}`);
  lines.push('');
  lines.push(`time_limit: ${t === 'submit_answer' ? 1000 : c.timeLimitMs}`);
  lines.push(`memory_limit: ${(t === 'submit_answer' ? 128 : c.memoryLimitMB) * 1024 * 1024}`);
  lines.push('');
  lines.push(`checker:`);
  lines.push(`  type: ${c.useSpj ? 'custom' : 'default'}`);
  if (c.useSpj) { lines.push(`  checker: ./spj`); lines.push(`  lang: cpp`); }
  lines.push('');
  lines.push(`subtasks:`);
  for (const sub of subtasks) {
    const subCases = testCases.filter(tc => tc.subtaskIds.includes(sub.id));
    const caseNumbers = subCases.map(tc => tc.number).sort((a, b) => a - b);
    lines.push(`  - id: ${sub.index}`);
    lines.push(`    score: ${sub.score}`);
    lines.push(`    type: ${sub.scoringType}`);
    lines.push(`    cases: [${caseNumbers.join(', ')}]`);
    lines.push(`    depends: [${sub.dependsOn.join(', ')}]`);
  }
  return lines.join('\n') + '\n';
}
