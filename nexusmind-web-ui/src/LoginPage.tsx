import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // If you're using react-router-dom for navigation
// Assuming you're not using react-router-dom yet, you'll need to manually manage navigation
// For this example, let's assume `navigateTo` is passed from App.tsx or you handle it directly.

interface LoginPageProps {
  navigateTo?: (page: string) => void; // Optional prop for simple navigation
}

const LoginPage: React.FC<LoginPageProps> = ({ navigateTo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, loading, error } = useAuth(); // Access auth state and functions

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('Already logged in, redirecting to home.');
      if (navigateTo) {
        navigateTo('home'); // Redirect to home if user exists
      } else {
        // Fallback or alert if navigateTo is not provided (e.g., in a standalone test)
        // alert('Already logged in!');
      }
    }
  }, [user, navigateTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      // If login is successful, the useEffect will handle redirection
    } catch (err) {
      // Error is already handled and set in AuthContext, can log or show additional UI
      console.error('Login submit error:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Log In'
            )}
          </button>
        </form>
        {/* Optional: Registration Link */}
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don't have an account? <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Register here</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
