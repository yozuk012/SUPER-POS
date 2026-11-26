'use client';

import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  return session;
}
