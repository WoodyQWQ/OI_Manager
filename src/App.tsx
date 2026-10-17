import { useState } from 'react';
import ProblemList from './components/ProblemList';
import ProblemDetail from './components/ProblemDetail';

export default function App() {
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);

  if (currentProblemId) {
    return <ProblemDetail problemId={currentProblemId} onBack={() => setCurrentProblemId(null)} />;
  }
  return <ProblemList onOpen={setCurrentProblemId} />;
}
