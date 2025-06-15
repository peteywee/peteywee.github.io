#!/bin/bash
set -euo pipefail

echo "==> Cleaning nested 'src/src' if it exists..."
[[ -d src/src ]] && rm -rf src/src && echo "✅ Removed src/src"

echo "==> Ensuring 'src/context' and 'src/pages' exist..."
mkdir -p src/context src/pages

create_file_if_not_exists() {
  local file=$1
  local content=$2
  if [[ -f $file ]]; then
    echo "⏩ Skipping $file (already exists)"
  else
    echo "✅ Creating $file"
    echo "$content" > "$file"
  fi
}

# AuthContext.tsx
create_file_if_not_exists src/context/AuthContext.tsx "$(cat << 'EOF'
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
EOF
)"

# Pages
declare -A pages=(
  [LoginPage.tsx]='
import React from "react";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  return (
    <div className="p-8 bg-white rounded shadow-md">
      <h1 className="text-2xl mb-4">Login</h1>
      <button onClick={login} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
        Sign In
      </button>
    </div>
  );
};

export default LoginPage;
'
  [HomePage.tsx]='
import React from "react";
import { useAuth } from "../context/AuthContext";

interface Props {
  navigateTo?: (page: string) => void;
}

const HomePage: React.FC<Props> = ({ navigateTo }) => {
  const { logout } = useAuth();
  return (
    <div className="text-center">
      <h1 className="text-3xl mb-4">Welcome to NexusMind</h1>
      <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Log Out
      </button>
      {navigateTo && (
        <div className="mt-4">
          <button onClick={() => navigateTo("ingest")} className="btn-link mr-2">Go to Ingest</button>
          <button onClick={() => navigateTo("query")} className="btn-link">Go to Query</button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
'
  [IngestPage.tsx]='
import React from "react";

const IngestPage: React.FC = () => (
  <div className="text-center">
    <h1 className="text-xl">Ingest Page</h1>
    <p>Upload and manage data inputs here.</p>
  </div>
);

export default IngestPage;
'
  [QueryPage.tsx]='
import React from "react";

const QueryPage: React.FC = () => (
  <div className="text-center">
    <h1 className="text-xl">Query Page</h1>
    <p>Query processed results or AI models here.</p>
  </div>
);

export default QueryPage;
'
)

echo "==> Creating page files..."
for file in "${!pages[@]}"; do
  create_file_if_not_exists "src/pages/$file" "${pages[$file]}"
done

# App.tsx - always overwrite if user confirms
app_file="src/App.tsx"
if [[ -f $app_file ]]; then
  read -rp "❗ $app_file already exists. Overwrite it? [y/N]: " confirm
  if [[ $confirm =~ ^[Yy]$ ]]; then
    overwrite_app=true
  else
    overwrite_app=false
  fi
else
  overwrite_app=true
fi

if [[ $overwrite_app == true ]]; then
  echo "✅ Writing App.tsx"
  cat > "$app_file" << 'EOF'
import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import IngestPage from "./pages/IngestPage";
import QueryPage from "./pages/QueryPage";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>("home");

  const navigateTo = (page: string) => setCurrentPage(page);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-gray-100 font-inter">
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-700">NexusMind</div>
          <div>
            <button onClick={() => navigateTo("home")} className="btn-nav">Home</button>
            <button onClick={() => navigateTo("ingest")} className="btn-nav">Ingest</button>
            <button onClick={() => navigateTo("query")} className="btn-nav">Query</button>
            <button onClick={() => navigateTo("login")} className="btn-nav">Login</button>
          </div>
        </nav>
        <main className="flex-grow flex items-center justify-center p-4">
          {{
            const pages = {
              home: <HomePage navigateTo={navigateTo} />,
              login: <LoginPage />,
              ingest: <IngestPage />,
              query: <QueryPage />
            };
            return pages[currentPage] || pages.home;
          }}
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
EOF
else
  echo "⏩ Skipped App.tsx"
fi

echo "✅ Done. Your components are scaffolded cleanly."
