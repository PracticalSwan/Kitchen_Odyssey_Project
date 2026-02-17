/**
 * AdminLayout - Protected route layout for admin users
 *
 * Guards admin routes with role-based access control.
 * Only accessible by users with role: 'admin'. Non-admins are redirected.
 * Uses fixed sidebar (ml-64) instead of mobile navbar for admin dashboard.
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Loader2 } from 'lucide-react';

export function AdminLayout() {
    const { user, loading, isAdmin } = useAuth();

    // Show loading spinner while checking auth state
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cool-gray-90" /></div>;
    }

    // Redirect non-admins (logged-in regular users → home, logged-out → login)
    if (!user || !isAdmin) {
        return <Navigate to={user ? "/" : "/login"} replace />;
    }

    return (
        <div className="min-h-screen bg-cream flex">
            {/* Accessibility skip link for keyboard navigation */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cool-gray-90 focus:text-white focus:rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-cool-gray-90"
            >
                Skip to content
            </a>
            <Sidebar />
            {/* ml-64 matches sidebar width for proper content offset */}
            <main id="main-content" className="flex-1 ml-64 p-6 md:p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
