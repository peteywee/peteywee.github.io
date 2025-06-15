import React from 'react';
import { useAuth } from '../context/AuthContext'; // To display user info

interface HomePageProps {
  navigateTo: (page: string) => void; // Assuming App.tsx passes this for navigation
}

const HomePage: React.FC<HomePageProps> = ({ navigateTo }) => {
  const { user, logout, loading: authLoading } = useAuth(); // Access user and logout from AuthContext

  const handleLogout = async () => {
    try {
      await logout();
      navigateTo('login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout error:', error);
      // Error message will be handled by AuthContext, could add local notification too
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8 rounded-lg shadow-lg text-center">
      <h1 className="text-5xl font-extrabold text-indigo-800 mb-6">Welcome to NexusMind!</h1>
      <p className="text-xl text-gray-700 mb-8 max-w-2xl">
        Your intelligent orchestration platform for data ingestion, analysis, and strategic insights.
      </p>

      {user ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-lg text-gray-800 font-semibold mb-4">
            You are logged in as <span className="text-indigo-600">{user.username}</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigateTo('ingest')}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Ingest
            </button>
            <button
              onClick={() => navigateTo('query')}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Go to Query
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              disabled={authLoading}
            >
              {authLoading ? 'Logging Out...' : 'Log Out'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-lg text-gray-800 mb-4">
            Please log in to access the full features of NexusMind.
          </p>
          <button
            onClick={() => navigateTo('login')}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={authLoading}
          >
            Log In
          </button>
        </div>
      )}

      <p className="text-md text-gray-500 mt-auto">
        Powering intelligent operations with FastAPI, React, PostgreSQL, and AI Agents.
      </p>
    </div>
  );
};

export default HomePage;
