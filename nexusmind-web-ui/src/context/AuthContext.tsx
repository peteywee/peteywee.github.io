#!/bin/bash

eval "$(dircolors -b ~/.dircolors)"
export LS_COLORS="$LS_COLORS:*.js=01;32:*.ts=01;34:*.node=01;35"

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
