import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import IngestPage from './pages/IngestPage';
import QueryPage from './pages/QueryPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');

  const navigateTo = (page: string) => setCurrentPage(page);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-700">NexusMind</div>
          <div>
            <button onClick={() => navigateTo('home')} className="btn-nav">Home</button>
            <button onClick={() => navigateTo('ingest')} className="btn-nav">Ingest</button>
            <button onClick={() => navigateTo('query')} className="btn-nav">Query</button>
            <button onClick={() => navigateTo('login')} className="btn-nav">Login</button>
          </div>
        </nav>

        <main className="flex-grow flex items-center justify-center p-4">
          {(() => {
            switch (currentPage) {
              case 'home':
                return <HomePage navigateTo={navigateTo} />;
              case 'login':
                return <LoginPage />;
              case 'ingest':
                return <IngestPage />;
              case 'query':
                return <QueryPage />;
              default:
                return <HomePage navigateTo={navigateTo} />;
            }
          })()}
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;

