import React, { createContext, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { setUser, setRole, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user role from database
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userData.fullName,
            phoneNumber: user.phoneNumber || userData.phone,
            ...userData
          });
          setRole(userData.role || 'customer');
        } else {
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            phoneNumber: user.phoneNumber,
          });
          setRole('customer');
        }
      } else {
        logout();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setRole, logout, setLoading]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};
