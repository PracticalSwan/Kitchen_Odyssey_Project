import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize storage handling (seeding if empty)
        storage.initialize();

        // Check for active session
        try {
            const currentUser = storage.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                // Restore guest session from localStorage
                try {
                    const guestId = localStorage.getItem('cookhub_guest_id');
                    if (guestId) {
                        setIsGuest(true);
                    }
                } catch {
                    // localStorage unavailable
                }
            }
        } catch (error) {
            console.error("Failed to load user session", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user?.id || isGuest) return;

        const handleExit = () => {
            storage.updateLastActive(user.id);
        };

        const handleDailyActive = () => storage.recordActiveUser(user.id);
        handleDailyActive();

        // Initial heartbeat
        storage.updateLastActive(user.id);

        const dailyInterval = setInterval(handleDailyActive, 60 * 60 * 1000);
        // Heartbeat every minute
        const heartbeatInterval = setInterval(() => {
            storage.updateLastActive(user.id);
        }, 60 * 1000);

        window.addEventListener('beforeunload', handleExit);
        window.addEventListener('pagehide', handleExit);

        return () => {
            clearInterval(dailyInterval);
            clearInterval(heartbeatInterval);
            window.removeEventListener('beforeunload', handleExit);
            window.removeEventListener('pagehide', handleExit);
        };
    }, [user, isGuest]);

    useEffect(() => {
        if (!user?.id) return;

        const syncCurrentUser = () => {
            const current = storage.getCurrentUser();
            if (current?.id === user.id) {
                setUser(current);
            }
        };

        window.addEventListener('favoriteToggled', syncCurrentUser);

        return () => {
            window.removeEventListener('favoriteToggled', syncCurrentUser);
        };
    }, [user?.id]);

    const login = (email, password) => {
        try {
            const loggedUser = storage.login(email, password);
            setUser(loggedUser);
            // Clear guest state on login
            setIsGuest(false);
            try { localStorage.removeItem('cookhub_guest_id'); } catch { /* ignore */ }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        if (isGuest) {
            // Exit guest mode
            setIsGuest(false);
            try { localStorage.removeItem('cookhub_guest_id'); } catch { /* ignore */ }
        } else {
            storage.logout(user?.id);
        }
        setUser(null);
    };

    const signup = (userData) => {
        const newUser = {
            id: `user-${Date.now()}`,
            role: 'user',
            status: 'pending',
            joinedDate: new Date().toISOString(),
            favorites: [],
            viewedRecipes: [],
            ...userData
        };
        storage.saveUser(newUser);
        storage.addActivity({
            type: 'user',
            text: `${newUser.username} joined the platform`
        });
        storage.recordNewUser(newUser.id, newUser.role);
        // Clear guest state on signup
        setIsGuest(false);
        try { localStorage.removeItem('cookhub_guest_id'); } catch { /* ignore */ }
        const loggedInUser = storage.login(userData.email, userData.password);
        setUser(loggedInUser);
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
        try { localStorage.removeItem('cookhub_guest_id'); } catch { /* ignore */ }
    }, []);

    const updateProfile = (updates) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        storage.saveUser(updatedUser);
        storage.setCurrentUser(updatedUser);
        setUser(updatedUser);
    };

    const isAdmin = user?.role === 'admin';
    const isPending = user?.status === 'pending';
    const isSuspended = user?.status === 'suspended';
    const canInteract = Boolean(user && user.status === 'active' && !isAdmin && !isGuest);

    const value = {
        user,
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
