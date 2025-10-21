import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import LoginPage from './pages/LoginPage';
import InboxPage from './pages/InboxPage';
import './styles/App.css';

export default function App() {
  const { isAuthenticated, initializeClient } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session
    initializeClient().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading InboxForge...</p>
      </div>
    );
  }

  return isAuthenticated ? <InboxPage /> : <LoginPage />;
}

