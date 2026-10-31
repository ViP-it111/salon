import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { currentUser, ensureDefaultAdmin } from './auth';
import Login from './pages/Login';
import Schedule from './pages/Schedule';
import Clients from './pages/Clients';
import Procedures from './pages/Procedures';
import Masters from './pages/Masters';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function RequireAuth({ children }: { children: JSX.Element }) {
  const loc = useLocation();
  if (!currentUser()) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureDefaultAdmin().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="h-full flex items-center justify-center text-slate-400">Загрузка...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Schedule />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/procedures" element={<Procedures />} />
        <Route path="/masters" element={<Masters />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}