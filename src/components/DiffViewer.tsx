import { useMemo } from 'react';

interface Props {
  left: string;
  right: string;
  leftTitle?: string;
  rightTitle?: string;
  mode?: 'inline' | 'split';
}

/** Diff 片段类型 */
interface DiffChunk {
  type: 'equal' | 'insert' | 'delete';
  value: string;
}

/** LCS 行级 Diff 算法 */
function lineDiff(a: string, b: string): { left: DiffChunk[]; right: DiffChunk[] } {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const m = linesA.length;
  const n = linesB.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const leftBack: DiffChunk[] = [];
  const rightBack: DiffChunk[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      leftBack.push({ type: 'equal', value: linesA[i - 1] });
      rightBack.push({ type: 'equal', value: linesA[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rightBack.push({ type: 'insert', value: linesB[j - 1] });
      j--;
    } else {
      leftBack.push({ type: 'delete', value: linesA[i - 1] });
      i--;
    }
  }

  return {
    left: leftBack.reverse(),
    right: rightBack.reverse(),
  };
}

function ChunkLine({ chunk }: { chunk: DiffChunk }) {
  const prefix = chunk.type === 'delete' ? '−' : chunk.type === 'insert' ? '+' : ' ';
  const bg =
    chunk.type === 'delete'
      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      : chunk.type === 'insert'
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
      : 'text-gray-700 dark:text-gray-300';
  return (
    <div className={`px-3 whitespace-pre ${bg}`}>
      <span className="inline-block w-6 text-right mr-2 select-none opacity-40 font-bold">{prefix}</span>
      {chunk.value || ' '}
    </div>
  );
}

export default function DiffViewer({
  left,
  right,
  leftTitle = '期望输出',
  rightTitle = '实际输出',
  mode = 'inline',
}: Props) {
  const { left: leftDiff, right: rightDiff } = useMemo(() => lineDiff(left, right), [left, right]);

  const identical = left === right;
  const delCount = leftDiff.filter(c => c.type === 'delete').length;
  const insCount = rightDiff.filter(c => c.type === 'insert').length;

  // 内联模式合并渲染
  const merged = useMemo(() => {
    const out: DiffChunk[] = [];
    let li = 0;
    let ri = 0;
    while (li < leftDiff.length && ri < rightDiff.length) {
      const lc = leftDiff[li];
      const rc = rightDiff[ri];
      if (lc.type === 'equal' && rc.type === 'equal') {
        out.push(lc);
        li++;
        ri++;
      } else if (lc.type === 'delete' && rc.type === 'equal') {
        out.push(lc);
        li++;
      } else if (lc.type === 'equal' && rc.type === 'insert') {
        out.push(rc);
        ri++;
      } else {
        out.push(lc);
        out.push(rc);
        li++;
        ri++;
      }
    }
    while (li < leftDiff.length) out.push(leftDiff[li++]);
    while (ri < rightDiff.length) out.push(rightDiff[ri++]);
    return out;
  }, [leftDiff, rightDiff]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs">
        <div className="flex items-center gap-4">
          {identical ? (
            <span className="flex items-center gap-1.5 text-green-600 font-medium">
              ✓ 两份内容完全相同
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <span className="text-red-500 font-medium">✗ 存在差异</span>
              <span className="text-gray-400 dark:text-gray-500">
                删除 <span className="text-red-600 dark:text-red-400 font-semibold">{delCount}</span> 行 /
                新增 <span className="text-green-600 dark:text-green-400 font-semibold">{insCount}</span> 行
              </span>
            </span>
          )}
        </div>
      </div>

      {mode === 'split' ? (
        <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
          <div>
            <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-800 text-xs font-medium">
              − {leftTitle}
            </div>
            <div className="max-h-[420px] overflow-auto font-mono text-[11px] leading-5">
              {leftDiff.map((c, i) => (
                <ChunkLine key={i} chunk={c} />
              ))}
            </div>
          </div>
          <div>
            <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-b border-green-200 dark:border-green-800 text-xs font-medium">
              + {rightTitle}
            </div>
            <div className="max-h-[420px] overflow-auto font-mono text-[11px] leading-5">
              {rightDiff.map((c, i) => (
                <ChunkLine key={i} chunk={c} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto font-mono text-[11px] leading-5">
          {merged.map((c, i) => (
            <ChunkLine key={i} chunk={c} />
          ))}
        </div>
      )}
    </div>
  );
}
