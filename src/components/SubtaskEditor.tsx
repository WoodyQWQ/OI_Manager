import { useLiveQuery } from 'dexie-react-hooks';
import { db, addSubtask, updateSubtask, deleteSubtask, updateTestCase } from '../db';

interface Props {
  problemId: string;
}

export default function SubtaskEditor({ problemId }: Props) {
  const subtasks = useLiveQuery(
    () => db.subtasks.where('problemId').equals(problemId).sortBy('index'),
    [problemId],
  );
  const testCases = useLiveQuery(
    () => db.testCases.where('problemId').equals(problemId).sortBy('number'),
    [problemId],
  );

  const totalScore = subtasks?.reduce((sum, s) => sum + s.score, 0) ?? 0;

  const autoDistributeScores = async () => {
    if (!subtasks || subtasks.length === 0) return;
    const count = subtasks.length;
    const per = Math.floor(100 / count);
    const remainder = 100 - per * count;
    const sorted = [...subtasks].sort((a, b) => a.index - b.index);
    for (let i = 0; i < sorted.length; i++) {
      const score = i === 0 ? per + remainder : per;
      await updateSubtask(sorted[i].id, { score });
    }
  };

  const autoAssignTestCases = async () => {
    if (!subtasks || !testCases || subtasks.length === 0 || testCases.length === 0) return;
    const sortedSubs = [...subtasks].sort((a, b) => a.index - b.index);
    for (const tc of testCases) {
      const subIndex = (tc.number - 1) % sortedSubs.length;
      const targetSubId = sortedSubs[subIndex].id;
      if (!tc.subtaskIds.includes(targetSubId)) {
        await updateTestCase(tc.id, { subtaskIds: [targetSubId] });
      }
    }
  };

  const toggleDepend = async (subtaskId: string, depIndex: number) => {
    const sub = await db.subtasks.get(subtaskId);
    if (!sub) return;
    const deps = sub.dependsOn.includes(depIndex)
      ? sub.dependsOn.filter(d => d !== depIndex)
      : [...sub.dependsOn, depIndex];
    await updateSubtask(subtaskId, { dependsOn: deps });
  };

  return (
    <div>
      {/* 总分显示 */}
      {subtasks && subtasks.length > 0 && (
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            总分: <span className={`font-bold ${totalScore === 100 ? 'text-green-600' : 'text-red-600'}`}>{totalScore}</span> / 100
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={autoAssignTestCases}
              disabled={!testCases || testCases.length === 0}
              className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded font-medium border border-indigo-200 dark:border-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="将测试点按顺序均匀分配到各 Subtask"
            >
              ⚡ 自动分配测试点
            </button>
            <button
              onClick={autoDistributeScores}
              className="text-xs px-3 py-1 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded font-medium border border-amber-200 dark:border-amber-700"
              title="将 100 分均匀分配给各 Subtask"
            >
              🔄 平均分配分值
            </button>
            <button
              onClick={() => addSubtask(problemId)}
              className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 font-medium"
            >
              + Subtask
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {subtasks?.map(sub => {
          const subCases = testCases?.filter(tc => tc.subtaskIds.includes(sub.id)) ?? [];
          return (
            <div key={sub.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 flex items-center justify-center bg-purple-100 dark:bg-black text-purple-700 dark:text-purple-100 border border-purple-200 dark:border-gray-700 rounded text-xs font-bold">
                  {sub.index}
                </span>
                <input
                  value={sub.name}
                  onChange={e => updateSubtask(sub.id, { name: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  type="number"
                  value={sub.score}
                  onChange={e => updateSubtask(sub.id, { score: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">分</span>
                <select
                  value={sub.scoringType}
                  onChange={e => updateSubtask(sub.id, { scoringType: e.target.value as 'min' | 'sum' })}
                  className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none"
                >
                  <option value="min">min (全对才给分)</option>
                  <option value="sum">sum (按比例)</option>
                </select>
                <button
                  onClick={() => deleteSubtask(sub.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              </div>

              {/* 依赖关系 */}
              {subtasks.length > 1 && (
                <div className="mb-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">依赖: </span>
                  {subtasks.filter(s => s.index !== sub.index).map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleDepend(sub.id, s.index)}
                      className={`inline-block ml-1 px-2 py-0.5 rounded text-xs transition ${
                        sub.dependsOn.includes(s.index)
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      ST{s.index}
                    </button>
                  ))}
                  {sub.dependsOn.length === 0 && (
                    <span className="text-xs text-gray-300 dark:text-gray-600 ml-1">无</span>
                  )}
                </div>
              )}

              {/* 测试点列表 */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {subCases.length > 0 ? (
                  <span>包含测试点: {subCases.map(c => c.number).join(', ')}</span>
                ) : (
                  <span className="text-gray-300 dark:text-gray-600">未分配测试点（请在左侧测试点中勾选 ST{sub.index}）</span>
                )}
              </div>
            </div>
          );
        })}

        {subtasks && subtasks.length === 0 && (
          <button
            onClick={() => addSubtask(problemId)}
            className="w-full py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition"
          >
            + 添加第一个 Subtask
          </button>
        )}
      </div>
    </div>
  );
}
