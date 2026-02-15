import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Loader2 } from 'lucide-react';

export function RootLayout() {
    const { user, loading, isAdmin, isGuest } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cool-gray-90" /></div>;
    }

    if (!user && !isGuest) {
        return <Navigate to="/login" replace />;
    }

    if (isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="min-h-screen bg-[#f5f7fa] pb-20">
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
