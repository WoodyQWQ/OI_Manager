import { useState } from 'react';
import ProblemList from './components/ProblemList';
import ProblemDetail from './components/ProblemDetail';

export default function App() {
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);

  return (
    // key 变化触发重挂载，让列表 ↔ 详情的切换有统一的入场过渡
    <div key={currentProblemId ?? 'list'} className="anim-page-in">
      {currentProblemId ? (
        <ProblemDetail problemId={currentProblemId} onBack={() => setCurrentProblemId(null)} />
      ) : (
        <ProblemList onOpen={setCurrentProblemId} />
      )}
    </div>
  );
}
