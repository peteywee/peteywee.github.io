// src/pages/HomePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, Database, FileText, Zap, Shield, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../components/AuthProvider'; // Corrected import path for useAuth

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Access user from AuthContext

  const features = [
    {
      icon: <Upload className="w-8 h-8 text-blue-600" />,
      title: "Smart Document Ingestion",
      description: "Upload documents in various formats with automatic content extraction and indexing."
    },
    {
      icon: <Search className="w-8 h-8 text-green-600" />,
      title: "Intelligent Search",
      description: "Find exactly what you need with AI-powered semantic search across all your documents."
    },
    {
      icon: <Database className="w-8 h-8 text-purple-600" />,
      title: "Vector Database",
      description: "Lightning-fast retrieval powered by advanced vector similarity matching."
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: "Enterprise Security",
      description: "Bank-level security with encryption at rest and in transit."
    },
    {
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      title: "Team Collaboration",
      description: "Share knowledge bases and collaborate on document collections."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Analytics & Insights",
      description: "Track usage patterns and discover insights from your document corpus."
    }
  ];

  const stats = [
    { label: "Documents Processed", value: "10M+" },
    { label: "Active Users", value: "50K+" },
    { label: "Search Queries", value: "1B+" },
    { label: "Uptime", value: "99.9%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Database className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Nexus RAG</h1>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {user.username}</span>
                  <button
                    onClick={() => navigate('/query')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')} {/* Assuming a /register route exists */}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-100 p-4 rounded-full">
              <Zap className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Documents,
            <span className="text-blue-600"> Intelligently Connected</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Transform your document management with AI-powered search and retrieval.
            Upload, index, and find information instantly across your entire knowledge base.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(user ? '/ingest' : '/register')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Start Uploading</span>
            </button>

            <button
              onClick={() => navigate(user ? '/query' : '/demo')}
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>{user ? 'Search Documents' : 'Try Demo'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Document Intelligence
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make your documents work harder for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Upload Documents</h3>
              <p className="text-gray-600">
                Drag and drop your files or upload them directly. We support PDF, DOC, TXT, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. AI Processing</h3>
              <p className="text-gray-600">
                Our AI extracts, analyzes, and indexes your content for lightning-fast retrieval.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Search & Discover</h3>
              <p className="text-gray-600">
                Find exactly what you need with natural language queries and intelligent suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Document Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using Nexus RAG to unlock their document intelligence.
          </p>
          <button
            onClick={() => navigate(user ? '/ingest' : '/register')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Get Started Free'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold">Nexus RAG</span>
              </div>
              <p className="text-gray-400 mb-4">
                Intelligent document management and retrieval for the modern workplace.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Nexus RAG. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
