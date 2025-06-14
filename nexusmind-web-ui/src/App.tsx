// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { IngestPage } from './pages/IngestPage';
import { QueryPage } from './pages/QueryPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './components/AuthProvider';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <p className="text-center mt-20 text-gray-600">Loading authentication...</p>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

const AppContent: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <ul className="flex space-x-8">
          <li><Link to="/ingest" className="text-blue-600 hover:text-blue-800 text-lg font-medium">Ingest</Link></li>
          <li><Link to="/query" className="text-blue-600 hover:text-blue-800 text-lg font-medium">Query</Link></li>
        </ul>
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Welcome, {user.username}!</span>
            <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="text-blue-600 hover:text-blue-800 text-lg font-medium">Login</Link>
        )}
      </nav>
      <main className="py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ingest" element={<PrivateRoute><IngestPage /></PrivateRoute>} />
          <Route path="/query" element={<PrivateRoute><QueryPage /></PrivateRoute>} />
          <Route path="/" element={isAuthenticated ? <Navigate to="/ingest" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
