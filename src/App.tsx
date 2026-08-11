import { useState } from 'react';
import ProblemList from './components/ProblemList';
import ProblemDetail from './components/ProblemDetail';
import { useTheme } from './useTheme';

export default function App() {
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const { theme } = useTheme();

  // key={theme} 强制 React 在主题切换时重建子树 → 确保所有 dark: 类即时生效
  if (currentProblemId) {
    return <ProblemDetail key={theme + '-d'} problemId={currentProblemId} onBack={() => setCurrentProblemId(null)} />;
  }
  return <ProblemList key={theme + '-l'} onOpen={setCurrentProblemId} />;
}
