import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTestCase, deleteTestCase, updateTestCase } from '../db';
import { pairFiles, formatSize, type ProblemType } from '../utils';
import type { Subtask } from '../types';
import DiffViewer from './DiffViewer';

interface Props {
  problemId: string;
  subtasks: Subtask[];
  problemType: ProblemType;
}

/** 编辑模式 */
type EditorMode = 'cards' | 'editor' | 'diff';

export default function TestCaseUploader({ problemId, subtasks, problemType }: Props) {
  const testCases = useLiveQuery(
    () => db.testCases.where('problemId').equals(problemId).sortBy('number'),
    [problemId],
  );
  const [dragging, setDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('cards');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [diffLeft, setDiffLeft] = useState<string>('');
  const [diffRight, setDiffRight] = useState<string>('');
  const [diffLeftTitle, setDiffLeftTitle] = useState('测试点 A');
  const [diffRightTitle, setDiffRightTitle] = useState('测试点 B');
  const [diffMode, setDiffMode] = useState<'inline' | 'split'>('inline');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickInRef = useRef<HTMLTextAreaElement>(null);
  const quickOutRef = useRef<HTMLTextAreaElement>(null);
  const quickNoteRef = useRef<HTMLInputElement>(null);

  const isSubmitAnswer = problemType === 'submit_answer';

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const paired = await pairFiles(fileArr);

    // 获取当前题目的已有测试点，按 note(baseName) 索引
    const existing = await db.testCases.where('problemId').equals(problemId).toArray();
    const noteMap = new Map(existing.map(tc => [tc.note, tc]));

    for (const p of paired) {
      const existingTc = noteMap.get(p.baseName);
      if (existingTc) {
        // 已存在同名测试点，合并更新对应字段
        const patch: Partial<{ inputContent: string; outputContent: string }> = {};
        if (p.hasInput) patch.inputContent = p.inputContent;
        if (p.hasOutput) patch.outputContent = p.outputContent;
        if (Object.keys(patch).length > 0) {
          await updateTestCase(existingTc.id, patch);
        }
      } else {
        // 新建测试点
        await addTestCase({
          problemId,
          inputContent: p.inputContent,
          outputContent: p.outputContent,
          note: p.baseName,
        });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const toggleSubtask = async (tcId: string, subtaskId: string) => {
    const tc = await db.testCases.get(tcId);
    if (!tc) return;
    const ids = tc.subtaskIds.includes(subtaskId)
      ? tc.subtaskIds.filter(id => id !== subtaskId)
      : [...tc.subtaskIds, subtaskId];
    await updateTestCase(tcId, { subtaskIds: ids });
  };

  const handleQuickAdd = async () => {
    const inContent = quickInRef.current?.value || '';
    const outContent = quickOutRef.current?.value || '';
    if (!inContent && !outContent) return;
    await addTestCase({
      problemId,
      inputContent: inContent,
      outputContent: outContent,
      note: quickNoteRef.current?.value?.trim() || '',
    });
    if (quickInRef.current) quickInRef.current.value = '';
    if (quickOutRef.current) quickOutRef.current.value = '';
    if (quickNoteRef.current) quickNoteRef.current.value = '';
    setShowQuickAdd(false);
  };

  const getStatusColor = (tc: { inputContent: string; outputContent: string }) => {
    if (!tc.inputContent && !tc.outputContent) return 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    if (isSubmitAnswer) {
      if (!tc.outputContent) return 'bg-red-100 dark:bg-black text-red-500 dark:text-red-100 border-red-300 dark:border-red-600';
      return 'bg-green-100 dark:bg-black text-green-700 dark:text-green-100 border-green-300 dark:border-green-600';
    }
    if (!tc.outputContent) return 'bg-yellow-100 dark:bg-black text-yellow-700 dark:text-yellow-100 border-yellow-300 dark:border-yellow-600';
    return 'bg-green-100 dark:bg-black text-green-700 dark:text-green-100 border-green-300 dark:border-green-600';
  };

  const activeTc = testCases?.find(tc => tc.id === activeId);

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 text-xs font-medium">
          {([
            ['cards', '📋 卡片视图'],
            ['editor', '✏️ 编辑器'],
            ['diff', '🔀 对比'],
          ] as [EditorMode, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setEditorMode(k)}
              className={`px-3 py-1.5 rounded-md transition ${
                editorMode === k ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickAdd(s => !s)}
            className="px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md font-medium border border-purple-200 dark:border-purple-700"
          >
            + 快速添加
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md font-medium border border-blue-200 dark:border-blue-700"
          >
            📁 选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".in,.out,.ans"
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* 拖拽上传区（仅卡片 / 编辑器模式） */}
      {editorMode !== 'diff' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl py-6 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-blue-400 bg-blue-50 scale-[1.005]'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 bg-white dark:bg-gray-900'
          }`}
        >
          <div className="text-3xl mb-1">{dragging ? '📥' : '☁️'}</div>
          <p className="text-sm text-gray-600 font-medium">
            {dragging ? '释放以上传文件' : '拖拽 .in / .out 文件到此处，或点击选择'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isSubmitAnswer ? '提交答案题：只需要 .out/.ans' : '自动按文件名配对：1.in ↔ 1.out'}
          </p>
        </div>
      )}

      {/* 快速添加面板 */}
      {showQuickAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 border-b border-purple-100 dark:border-purple-800">
            <h3 className="text-sm font-semibold text-purple-700">✨ 快速添加测试点</h3>
            <button onClick={() => setShowQuickAdd(false)} className="text-purple-400 hover:text-purple-600 text-sm">
              ✕
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <input
                ref={quickNoteRef}
                placeholder="测试点备注（可选，如：n=1e5 链 极限卡常）"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium mb-1 flex items-center justify-between ${
                  isSubmitAnswer ? 'text-gray-400' : 'text-blue-600'
                }`}>
                  <span>📥 输入 (.in)</span>
                  {isSubmitAnswer && <span className="text-gray-300">（提交答案题可留空）</span>}
                </label>
                <textarea
                  ref={quickInRef}
                  placeholder={isSubmitAnswer ? '（可选）提交答案题可不填输入' : '粘贴或输入测试数据'}
                  className="w-full h-40 px-3 py-2 text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white dark:focus:bg-gray-700 resize-y"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 flex items-center gap-1 text-green-600">
                  <span>📤 输出 (.out)</span>
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={quickOutRef}
                  placeholder="必须提供期望输出"
                  className="w-full h-40 px-3 py-2 text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-300 focus:bg-white dark:focus:bg-gray-700 resize-y"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-1.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleQuickAdd}
                className="px-4 py-1.5 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium"
              >
                添加测试点
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === 编辑器模式 === */}
      {editorMode === 'editor' && activeTc && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-black text-blue-700 dark:text-blue-100 border border-blue-200 dark:border-gray-700 font-bold flex items-center justify-center text-sm">
                {activeTc.number}
              </span>
              <input
                value={activeTc.note}
                onChange={e => updateTestCase(activeTc.id, { note: e.target.value })}
                className="px-2 py-1 text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              {subtasks.sort((a, b) => a.index - b.index).map(sub => (
                <button
                  key={sub.id}
                  onClick={() => toggleSubtask(activeTc.id, sub.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    activeTc.subtaskIds.includes(sub.id)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  ST{sub.index}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className={`${isSubmitAnswer ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50/60 border-b border-blue-100 text-xs font-medium text-blue-600">
                <span>📥 输入文件 — {formatSize(activeTc.inputSize)}</span>
                {isSubmitAnswer && <span className="text-gray-400 dark:text-gray-500">（可选）</span>}
              </div>
              <textarea
                value={activeTc.inputContent}
                onChange={e => updateTestCase(activeTc.id, { inputContent: e.target.value })}
                placeholder={isSubmitAnswer ? '提交答案题：可留空' : '测试点输入内容'}
                className="w-full h-[460px] p-3 text-xs font-mono bg-white dark:bg-gray-900 dark:text-gray-100 border-0 focus:outline-none resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between px-3 py-2 bg-green-50/60 border-b border-green-100 text-xs font-medium text-green-600">
                <span>📤 输出文件 — {formatSize(activeTc.outputSize)}</span>
                <button
                  onClick={() => {
                    setDiffLeft(activeTc.outputContent);
                    setDiffRight(activeTc.outputContent);
                    setDiffLeftTitle(`测试点 ${activeTc.number} (当前)`);
                    setDiffRightTitle('粘贴其他版本或同学的答案');
                    setEditorMode('diff');
                  }}
                  className="text-gray-400 hover:text-green-600"
                >
                  拿去对比 →
                </button>
              </div>
              <textarea
                value={activeTc.outputContent}
                onChange={e => updateTestCase(activeTc.id, { outputContent: e.target.value })}
                placeholder="期望输出"
                className="w-full h-[460px] p-3 text-xs font-mono bg-white dark:bg-gray-900 dark:text-gray-100 border-0 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {editorMode === 'editor' && !activeTc && testCases && testCases.length > 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          👈 请从下方列表点击要编辑的测试点
        </div>
      )}

      {/* === Diff 对比模式 === */}
      {editorMode === 'diff' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">🔀 文件对比工具</h3>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5 text-xs">
                <button
                  onClick={() => setDiffMode('inline')}
                  className={`px-2.5 py-1 rounded ${diffMode === 'inline' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  内联
                </button>
                <button
                  onClick={() => setDiffMode('split')}
                  className={`px-2.5 py-1 rounded ${diffMode === 'split' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  并排
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-red-500 block mb-1">左：{diffLeftTitle}</label>
                <textarea
                  value={diffLeft}
                  onChange={e => setDiffLeft(e.target.value)}
                  placeholder="粘贴左侧内容，或从其他测试点点击「拿去对比」按钮"
                  className="w-full h-28 p-2 text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-300 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-green-600 block mb-1">右：{diffRightTitle}</label>
                <textarea
                  value={diffRight}
                  onChange={e => setDiffRight(e.target.value)}
                  placeholder="粘贴右侧内容进行对比"
                  className="w-full h-28 p-2 text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-green-300 resize-none"
                />
              </div>
            </div>
            {testCases && testCases.length >= 2 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400 py-1.5">或快速比较两个测试点：</span>
                {testCases.slice(0, 10).map((tc, i, arr) => (
                  <div key={tc.id} className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setDiffLeft(tc.outputContent);
                        setDiffLeftTitle(`测试点 ${tc.number}`);
                        const next = arr[(i + 1) % arr.length];
                        if (next.id !== tc.id) {
                          setDiffRight(next.outputContent);
                          setDiffRightTitle(`测试点 ${next.number}`);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 border border-gray-200"
                    >
                      #{tc.number}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DiffViewer
            left={diffLeft}
            right={diffRight}
            leftTitle={diffLeftTitle}
            rightTitle={diffRightTitle}
            mode={diffMode}
          />
        </div>
      )}

      {/* === 卡片视图 / 列表 === */}
      {(editorMode === 'cards' || (editorMode === 'editor' && testCases && testCases.length > 0)) && (
        <div>
          {testCases && testCases.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                {editorMode === 'cards' ? `📋 共 ${testCases.length} 个测试点` : '测试点列表（点击选中进行编辑）'}
              </h4>
            </div>
          )}

          <div className={editorMode === 'cards' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2'}>
            {testCases?.map(tc => {
              const stColor = getStatusColor(tc);
              if (editorMode === 'cards') {
                return (
                  <div
                    key={tc.id}
                    className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition p-3 cursor-pointer"
                    onClick={() => { setActiveId(tc.id); setEditorMode('editor'); }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${stColor}`}>
                          {tc.number}
                        </span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteTestCase(tc.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition text-xs"
                        title="删除"
                      >
                        🗑
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate" title={tc.note}>
                      {tc.note || `测试点 ${tc.number}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                      {!isSubmitAnswer && (
                        <span className={`px-1.5 py-0.5 rounded ${tc.inputContent ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-400'}`}>
                          in {formatSize(tc.inputSize)}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded ${tc.outputContent ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                        out {formatSize(tc.outputSize)}
                      </span>
                    </div>
                    {subtasks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {subtasks.sort((a, b) => a.index - b.index).map(sub => (
                          <span
                            key={sub.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              tc.subtaskIds.includes(sub.id)
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-50 text-gray-300'
                            }`}
                          >
                            S{sub.index}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={tc.id}
                  onClick={() => setActiveId(tc.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition ${
                    activeId === tc.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border ${stColor}`}>
                      {tc.number}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {tc.note || `测试点 ${tc.number}`}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {!isSubmitAnswer && `in ${formatSize(tc.inputSize)} · `}out {formatSize(tc.outputSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {subtasks.sort((a, b) => a.index - b.index).map(sub => (
                      <span
                        key={sub.id}
                        className={`w-6 h-6 inline-flex items-center justify-center rounded text-[10px] font-medium ${
                          tc.subtaskIds.includes(sub.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {sub.index}
                      </span>
                    ))}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (!diffLeft) {
                          setDiffLeft(tc.outputContent);
                          setDiffLeftTitle(`测试点 ${tc.number}`);
                        } else {
                          setDiffRight(tc.outputContent);
                          setDiffRightTitle(`测试点 ${tc.number}`);
                          setEditorMode('diff');
                        }
                      }}
                      className="ml-2 text-xs text-gray-400 hover:text-blue-500 px-2 py-1"
                      title="加入对比"
                    >
                      🔀
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTestCase(tc.id); }}
                      className="text-xs text-gray-300 hover:text-red-500 px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {testCases && testCases.length === 0 && (
            <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">还没有测试点，拖拽文件或点击「快速添加」开始</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
