import { create } from 'zustand';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider, firebaseEnabled } from '../lib/firebase';

type AuthState = {
  user: User | null;
  // `ready` flips true once Firebase has reported the initial auth state, so the
  // gate can avoid flashing the sign-in screen for already-logged-in users.
  ready: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

export const useAuth = create<AuthState>((_set, get) => ({
  user: null,
  ready: !firebaseEnabled, // no Firebase → nothing to wait for
  signIn: async () => {
    if (!auth) throw new Error('Sign-in is not configured');
    await signInWithPopup(auth, googleProvider);
  },
  signOutUser: async () => {
    if (!auth) return;
    await signOut(auth);
  },
  getToken: async () => {
    const u = get().user;
    if (!u) return null;
    return await u.getIdToken();
  },
}));

// Registered once at module load. Keeps the store in sync with Firebase and
// refreshes the cached ID token in the background (getIdToken handles expiry).
if (auth) {
  onAuthStateChanged(auth, (user) => {
    useAuth.setState({ user, ready: true });
  });
}
