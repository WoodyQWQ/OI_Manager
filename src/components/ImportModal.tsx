import { useEffect, useState } from 'react';
import { importFromLuogu, importFromCodeforces, importFromPaste, type OJSource, type ImportResult } from '../ojImport';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (result: ImportResult) => void;
}

const OJ_TABS: { key: OJSource; label: string; icon: string; desc: string }[] = [
  { key: 'luogu', label: '洛谷', icon: '🟢', desc: '输入题号自动拉取题面（JSON API）' },
  { key: 'codeforces', label: 'Codeforces', icon: '🔵', desc: '输入比赛ID+题号拉取元数据' },
  { key: 'paste', label: '粘贴导入', icon: '📋', desc: '手动粘贴，适用 AtCoder / Vjudge / 任意来源' },
];

export default function ImportModal({ open, onClose, onImport }: Props) {
  const [source, setSource] = useState<OJSource>('luogu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 洛谷
  const [luoguPid, setLuoguPid] = useState('');
  // CF
  const [cfContest, setCfContest] = useState('');
  const [cfIndex, setCfIndex] = useState('');
  // 粘贴
  const [pasteSlug, setPasteSlug] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteStatement, setPasteStatement] = useState('');
  const [pasteTime, setPasteTime] = useState('1000');
  const [pasteMem, setPasteMem] = useState('256');
  // 关闭时先播出场动画，动画结束后再真正卸载
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  if (!open) return null;

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 160);
  };

  const handleImport = async () => {
    setError('');
    setLoading(true);
    try {
      let result: ImportResult;
      if (source === 'luogu') {
        if (!luoguPid.trim()) throw new Error('请输入洛谷题号');
        result = await importFromLuogu(luoguPid);
      } else if (source === 'codeforces') {
        if (!cfContest.trim() || !cfIndex.trim()) throw new Error('请输入比赛ID和题号');
        result = await importFromCodeforces(cfContest, cfIndex);
      } else {
        if (!pasteSlug.trim() || !pasteTitle.trim()) throw new Error('请至少填写题号和标题');
        result = importFromPaste(pasteSlug, pasteTitle, pasteStatement, {
          timeLimitMs: parseInt(pasteTime) || 1000,
          memoryLimitMB: parseInt(pasteMem) || 256,
        });
      }
      onImport(result);
      requestClose();
    } catch (e: any) {
      setError(e.message || '导入失败，请检查网络或题号');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${closing ? 'anim-fade-out pointer-events-none' : 'anim-fade-in'}`}
      onClick={requestClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700 ${closing ? 'anim-modal-out' : 'anim-modal-in'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">📥 导入题目</h2>
          <button onClick={requestClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl transition-transform duration-200 hover:rotate-90">✕</button>
        </div>

        {/* OJ 选择 Tab */}
        <div className="flex gap-1 px-6 pt-4">
          {OJ_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setSource(tab.key); setError(''); }}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition border-b-2 ${
                source === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="p-6">
          <div key={source} className="anim-fade-up">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {OJ_TABS.find(t => t.key === source)?.desc}
          </p>

          {source === 'luogu' && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">洛谷题号</span>
                <input
                  value={luoguPid}
                  onChange={e => setLuoguPid(e.target.value)}
                  placeholder="如 P1001、CF1835C、U295036"
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100"
                  onKeyDown={e => e.key === 'Enter' && handleImport()}
                />
              </label>
              <div className="text-xs text-gray-400 dark:text-gray-500 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3">
                💡 通过解析洛谷页面内嵌数据获取，包含完整 Markdown 题面、样例、时空限制。
                <br />⚠️ 使用公共 CORS 代理，如失败请检查网络或使用粘贴导入。
              </div>
            </div>
          )}

          {source === 'codeforces' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <label className="block col-span-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">比赛 ID</span>
                  <input
                    value={cfContest}
                    onChange={e => setCfContest(e.target.value)}
                    placeholder="如 1835"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">题号</span>
                  <input
                    value={cfIndex}
                    onChange={e => setCfIndex(e.target.value)}
                    placeholder="如 A"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100"
                  />
                </label>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg p-3">
                ⚠️ Codeforces 官方 API 仅提供元数据（标题/标签/rating），<b>不含题面和时空限制</b>。
                导入后需手动补充题面内容。
              </div>
            </div>
          )}

          {source === 'paste' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">题号</span>
                  <input
                    value={pasteSlug}
                    onChange={e => setPasteSlug(e.target.value)}
                    placeholder="如 ABC100_A、HDU-1000"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">标题</span>
                  <input
                    value={pasteTitle}
                    onChange={e => setPasteTitle(e.target.value)}
                    placeholder="题目标题"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">时间限制 (ms)</span>
                  <input
                    type="number"
                    value={pasteTime}
                    onChange={e => setPasteTime(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">内存限制 (MB)</span>
                  <input
                    type="number"
                    value={pasteMem}
                    onChange={e => setPasteMem(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">题面（Markdown）</span>
                <textarea
                  value={pasteStatement}
                  onChange={e => setPasteStatement(e.target.value)}
                  placeholder={`从 AtCoder / Vjudge / 任意 OJ 复制题面粘贴到此处\n\n支持 Markdown 格式：\n## 题目描述\n...\n## 输入格式\n...\n## 输出格式\n...`}
                  className="mt-1 w-full h-48 px-3 py-2 text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100 resize-y"
                />
              </label>
            </div>
          )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="anim-fade-up mt-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              <span className="anim-shake inline-block">❌ {error}</span>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={requestClose}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-transform active:scale-[0.97]"
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-transform active:scale-[0.97]"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? '导入中...' : '导入'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
