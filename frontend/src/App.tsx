import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavSidebar } from './components/NavSidebar';
import { LiveFeed } from './pages/LiveFeed';
import { AttackBreakdown } from './pages/AttackBreakdown';
import { AlertConsole } from './pages/AlertConsole';
import { Explainability } from './pages/Explainability';
import { Trends } from './pages/Trends';
import { AccelerationProof } from './pages/AccelerationProof';
import { Validation } from './pages/Validation';
import { Login } from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('auth_token');
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background overflow-hidden text-textMain font-sans">
        <NavSidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<LiveFeed />} />
            <Route path="/breakdown" element={<AttackBreakdown />} />
            <Route path="/alerts" element={<AlertConsole />} />
            <Route path="/explainability" element={<Explainability />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/acceleration" element={<AccelerationProof />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
