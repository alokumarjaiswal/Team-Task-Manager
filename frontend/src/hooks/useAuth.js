// Custom hook for authentication state management
// Usage: const { user, login, logout, isAdmin } = useAuth();

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function useAuth() {
  return useContext(AuthContext);
}
