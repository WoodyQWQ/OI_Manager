import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createProblem, deleteProblem, updateProblem } from '../db';
import { useTheme } from '../useTheme';
import ImportModal from './ImportModal';
import type { ImportResult } from '../ojImport';

export default function ProblemList({ onOpen }: { onOpen: (id: string) => void }) {
  const problems = useLiveQuery(() => db.problems.orderBy('updatedAt').reverse().toArray(), []);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const { theme, toggle } = useTheme();

  const handleCreate = async () => {
    if (!slug.trim() || !title.trim()) return;
    const problem = await createProblem({ slug: slug.trim(), title: title.trim() });
    setSlug('');
    setTitle('');
    setShowForm(false);
    onOpen(problem.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确认删除该题目及其所有测试点？')) {
      await deleteProblem(id);
    }
  };

  const handleImport = async (result: ImportResult) => {
    const problem = await createProblem({ slug: result.slug, title: result.title, source: result.source || '洛谷' });
    await updateProblem(problem.id, {
      statement: result.statement,
      tags: result.tags || [],
      config: {
        type: 'default',
        timeLimitMs: result.timeLimitMs || 1000,
        memoryLimitMB: result.memoryLimitMB || 128,
        enableO2: true,
        isInteractive: false,
        useSpj: false,
        fileIO: { enabled: false, inputFileName: '', outputFileName: '' },
      },
    });
    onOpen(problem.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-950 transition-colors">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-700/60 px-6 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              OI
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">OI_Manager</h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">OI 竞赛题目测试点管理</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="切换主题"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-3.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition border border-indigo-200 dark:border-indigo-800/60"
          >
            导入题目
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-xs font-medium shadow-sm hover:shadow"
          >
            + 新建题目
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 新建表单 */}
        {showForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">新建题目</h2>
            <div className="flex gap-3">
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="题目编号 (如 P1001)"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="题目标题"
                className="flex-[2] px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition shadow-sm"
              >
                创建
              </button>
            </div>
          </div>
        )}

        {/* 题目列表 */}
        {problems === undefined ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-20">加载中...</p>
        ) : problems.length === 0 ? (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-sm">还没有题目</p>
            <p className="text-xs mt-1 text-gray-400">点击右上角「新建题目」或「导入题目」开始</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {problems.map(p => {
              const sourceLabel = p.source && p.source !== 'OI_Manager'
                ? `出处：${p.source}`
                : '于 OI_Manager 建立';
              const problemType = (p.config as any)?.type || (p.config?.isInteractive ? 'interactive' : 'default');
              return (
                <div
                  key={p.id}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-5 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/10 transition-all duration-200 cursor-pointer group"
                  onClick={() => onOpen(p.id)}
                >
                  {/* 悬停出处提示 */}
                  <div className="pointer-events-none absolute -top-10 left-5 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-10 translate-y-1 group-hover:translate-y-0">
                    {sourceLabel}
                    <div className="absolute left-5 -bottom-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-mono font-semibold tracking-wide">
                      {p.slug}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{p.title}</h3>
                        {problemType === 'submit_answer' && <span className="badge bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">提交答案</span>}
                        {problemType === 'interactive' && <span className="badge bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">交互题</span>}
                        {problemType === 'default' && <span className="badge bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">传统题</span>}
                      </div>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 font-mono">
                        {p.config.timeLimitMs}ms · {p.config.memoryLimitMB}MB
                        {p.config.enableO2 && ' · O2'}
                        {p.config.useSpj && ' · SPJ'}
                        {p.tags.length > 0 && ` · ${p.tags.slice(0, 3).join(', ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {new Date(p.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-all"
                    >
                      删除
                    </button>
                    <span className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} onImport={handleImport} />
    </div>
  );
}
