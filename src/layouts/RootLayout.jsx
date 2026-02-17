/**
 * RootLayout - Protected route layout for regular users
 *
 * Guards routes that require authentication (user or guest mode).
 * Redirects admins to /admin and unauthenticated users to /login.
 * pb-20 accounts for mobile navbar height (bottom navigation).
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Loader2 } from 'lucide-react';

export function RootLayout() {
    const { user, loading, isAdmin, isGuest } = useAuth();

    // Show loading spinner while checking auth state
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cool-gray-90" /></div>;
    }

    // Redirect to login if not authenticated (not user and not guest)
    if (!user && !isGuest) {
        return <Navigate to="/login" replace />;
    }

    // Redirect admins to admin dashboard
    if (isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="min-h-screen bg-cream pb-20">
            {/* Accessibility skip link for keyboard navigation */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cool-gray-90 focus:text-white focus:rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-cool-gray-90"
            >
                Skip to content
            </a>
            <Navbar />
            <main id="main-content" className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}
