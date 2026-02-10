import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import MacchinaHankinsiana from './machina-hankinsiana';
import Login from './pages/Login';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();
const apiUrl = (path) => {
  if (!API_BASE_URL) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('mh_token');
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  useEffect(() => {
    const intervalMs = Number(
      import.meta.env.VITE_KEEPALIVE_INTERVAL_MS || 60_000,
    );
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;

    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') return;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(apiUrl('/health'), {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch {
        // ignore errors; keepalive is best-effort
      }
    };

    ping();
    const id = setInterval(ping, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <MacchinaHankinsiana />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
