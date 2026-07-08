import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Gate from './pages/Gate';
import { useAccessStore } from './store/useAccess';
import './index.css';

function MainRoute() {
  const { hasSeenGate } = useAccessStore();
  return hasSeenGate ? <Home /> : <Gate />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<MainRoute />} />
        <Route path="/gate" element={<Gate />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quiz/:testId" element={<Quiz />} />
        <Route path="/results/:testId" element={<Results />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
