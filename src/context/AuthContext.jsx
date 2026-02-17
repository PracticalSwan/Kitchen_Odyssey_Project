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
import { storage } from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);           // Currently logged-in user (null = logged out)
    const [isGuest, setIsGuest] = useState(false);     // Guest mode flag (read-only browsing)
    const [loading, setLoading] = useState(true);      // Initial session loading state

    // Initialize: restore session or guest mode on app mount
    useEffect(() => {
        // Initialize storage handling (seeds data if empty)
        storage.initialize();

        // Check for active user session
        try {
            const currentUser = storage.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                // No user session - restore guest session from localStorage if available
                try {
                    const guestId = localStorage.getItem('cookhub_guest_id');
                    if (guestId) {
                        setIsGuest(true);
                    }
                } catch {
                    // localStorage unavailable (private browsing, etc.)
                }
            }
        } catch (error) {
            console.error("Failed to load user session", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Activity tracking: heartbeat and DAU recording for logged-in users
    // Only runs for non-guest users to avoid localStorage operations in guest mode
    useEffect(() => {
        if (!user?.id || isGuest) return;

        const handleExit = () => {
            storage.updateLastActive(user.id);
        };

        const handleDailyActive = () => storage.recordActiveUser(user.id);
        handleDailyActive(); // Record immediately on mount

        // Initial heartbeat
        storage.updateLastActive(user.id);

        // Record DAU every hour
        const dailyInterval = setInterval(handleDailyActive, 60 * 60 * 1000);
        // Heartbeat every minute for "last active" tracking
        const heartbeatInterval = setInterval(() => {
            storage.updateLastActive(user.id);
        }, 60 * 1000);

        // Update last active on page unload/close
        window.addEventListener('beforeunload', handleExit);
        window.addEventListener('pagehide', handleExit);

        return () => {
            clearInterval(dailyInterval);
            clearInterval(heartbeatInterval);
            window.removeEventListener('beforeunload', handleExit);
            window.removeEventListener('pagehide', handleExit);
        };
    }, [user, isGuest]);

    // Sync user state when favorites change across components
    // Window event ensures UI updates without prop drilling
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
            // Clear guest state on successful login
            setIsGuest(false);
            try { localStorage.removeItem('cookhub_guest_id'); } catch { /* ignore */ }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        if (isGuest) {
            // Exit guest mode - just clear the flag
            setIsGuest(false);
            try { localStorage.removeItem('cookhub_guest_id'); } catch { /* ignore */ }
        } else {
            // Normal logout - update user status
            storage.logout(user?.id);
        }
        setUser(null);
    };

    const signup = (userData) => {
        // New users start with 'pending' status (require admin approval)
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

        // Auto-login after signup
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

    // Computed auth states for easier consumption
    const isAdmin = user?.role === 'admin';
    const isPending = user?.status === 'pending';
    const isSuspended = user?.status === 'suspended';
    // Active regular users can interact (like, review, create)
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
