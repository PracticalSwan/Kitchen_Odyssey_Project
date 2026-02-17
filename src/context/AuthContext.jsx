/**
 * AuthContext - Global authentication and user session state management
 *
 * Provides authentication state (user, guest mode, loading) and auth operations
 * (login, logout, signup) to all components via useAuth() hook.
 *
 * Activity tracking: Updates lastActive timestamp every 60 seconds and records
 * daily active users for analytics. Heartbeat ensures accurate "online" status.
 *
 * Guest mode: Allows read-only browsing without localStorage persistence.
 * Uses window events (favoriteToggled) for cross-component state synchronization.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageApi as storage } from '../lib/storageApiAdapter';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);           // Currently logged-in user (null = logged out)
    const [isGuest, setIsGuest] = useState(false);     // Guest mode flag (read-only browsing)
    const [loading, setLoading] = useState(true);      // Initial session loading state

    // Initialize: restore session from backend on app mount
    useEffect(() => {
        async function restoreSession() {
            try {
                const currentUser = await storage.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    // No active session — check for guest mode
                    try {
                        const guestId = localStorage.getItem('kitchen_odyssey_guest_id');
                        if (guestId) {
                            setIsGuest(true);
                        }
                    } catch {
                        // localStorage unavailable
                    }
                }
            } catch (error) {
                console.error("Failed to load user session", error);
                // Check for guest mode even on API failure
                try {
                    const guestId = localStorage.getItem('kitchen_odyssey_guest_id');
                    if (guestId) {
                        setIsGuest(true);
                    }
                } catch { /* ignore */ }
            } finally {
                setLoading(false);
            }
        }
        restoreSession();
    }, []);

    // Activity tracking: the backend records lastActive on each authenticated request
    // No explicit heartbeat needed — server handles it via auth middleware

    // Sync user state when favorites change across components
    useEffect(() => {
        if (!user?.id) return;

        const syncCurrentUser = async () => {
            try {
                const current = await storage.getCurrentUser();
                if (current && (current._id === user.id || current.id === user.id)) {
                    setUser(current);
                }
            } catch { /* ignore sync failures */ }
        };

        window.addEventListener('favoriteToggled', syncCurrentUser);

        return () => {
            window.removeEventListener('favoriteToggled', syncCurrentUser);
        };
    }, [user?.id]);

    const login = async (email, password) => {
        try {
            const loggedUser = await storage.login(email, password);
            setUser(loggedUser);
            setIsGuest(false);
            try { localStorage.removeItem('kitchen_odyssey_guest_id'); } catch { /* ignore */ }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        if (isGuest) {
            setIsGuest(false);
            try { localStorage.removeItem('kitchen_odyssey_guest_id'); } catch { /* ignore */ }
        } else {
            try { await storage.logout(); } catch { /* ignore */ }
        }
        setUser(null);
    };

    const signup = async (userData) => {
        const newUser = await storage.signup({
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            birthday: userData.birthday,
        });

        setIsGuest(false);
        try { localStorage.removeItem('kitchen_odyssey_guest_id'); } catch { /* ignore */ }
        setUser(newUser);
    };

    const enterGuestMode = useCallback(() => {
        try {
            storage.getOrCreateGuestId();
            setIsGuest(true);
            setUser(null);
        } catch {
            console.error('Failed to enter guest mode - localStorage may be unavailable');
        }
    }, []);

    const exitGuestMode = useCallback(() => {
        setIsGuest(false);
        try { localStorage.removeItem('kitchen_odyssey_guest_id'); } catch { /* ignore */ }
    }, []);

    const updateProfile = async (updates) => {
        if (!user) return;
        const userId = user._id || user.id;
        const updatedUser = await storage.saveUser({ ...updates, _id: userId, id: userId });
        setUser(updatedUser);
    };

    // Computed auth states for easier consumption
    const userId = user?._id || user?.id;
    const isAdmin = user?.role === 'admin';
    const isPending = user?.status === 'pending';
    const isSuspended = user?.status === 'suspended';
    // Active regular users can interact (like, review, create)
    const canInteract = Boolean(user && user.status === 'active' && !isAdmin && !isGuest);

    const value = {
        user,
        userId,
        loading,
        isAdmin,
        isGuest,
        isPending,
        isSuspended,
        canInteract,
        login,
        logout,
        signup,
        updateProfile,
        enterGuestMode,
        exitGuestMode
    };

    // Delay rendering children until initial session check completes
    // Prevents flash of wrong auth state (login screen when user is logged in)
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
