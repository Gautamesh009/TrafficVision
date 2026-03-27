import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const DUMMY = { email: 'officer@trafficwatch.in', password: 'TW@2026' };

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  }, []);

  const signIn = useCallback((email, password) => {
    if (email === DUMMY.email && password === DUMMY.password) {
      const user = { name: 'Officer Sharma', email };
      setCurrentUser(user);
      showToast(`Welcome, Officer! You're now signed in. ✓`);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials. Use the demo account above.' };
  }, [showToast]);

  const signUp = useCallback((name, email) => {
    const user = { name, email };
    setCurrentUser(user);
    showToast(`Welcome, ${name.split(' ')[0]}! Account created. ✓`);
    return { success: true };
  }, [showToast]);

  const signOut = useCallback(() => {
    setCurrentUser(null);
    showToast('Signed out successfully.');
  }, [showToast]);

  return (
    <AuthContext.Provider value={{ currentUser, signIn, signUp, signOut, showToast, toastMsg, toastVisible }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
