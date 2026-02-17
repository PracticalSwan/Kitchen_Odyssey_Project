/**
 * AuthLayout - Unauthenticated route layout for login/signup
 *
 * Split-screen layout: form on left (3 columns), branding on right (2 columns).
 * Mobile devices see only the form; branding panel hidden on screens < lg breakpoint.
 * Right panel uses gradient background with decorative blur circles for visual depth.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Logo from '../assets/Logo.png';

export function AuthLayout() {
    return (
        <div className="min-h-screen grid lg:grid-cols-5 bg-warm-white">
            {/* Left: Form Container (3 columns on lg+) */}
            <div className="flex flex-col items-center justify-center p-8 bg-warm-white lg:col-span-3">
                <div className="w-full max-w-md space-y-6 rounded-xl border border-warm-gray-20 bg-warm-white p-8 shadow-sm">
                    <div className="flex justify-center mb-6">
                        <img src={Logo} alt="Kitchen Odyssey Logo" className="h-14 w-auto" />
                    </div>
                    {/* Outlet renders Login or Signup component */}
                    <Outlet />
                </div>
                <p className="mt-6 text-xs text-warm-gray-40">&copy; {new Date().getFullYear()} Kitchen Odyssey. All rights reserved.</p>
            </div>

            {/* Right: Branding Panel (2 columns on lg+, hidden on smaller screens) */}
            <div className="hidden lg:flex lg:col-span-2 flex-col bg-gradient-to-br from-brand to-brand-accent text-white p-12 relative overflow-hidden">
                <div className="z-10 flex-1 flex flex-col items-center justify-center gap-6 text-center">
                    <img src={Logo} alt="Kitchen Odyssey Logo" className="h-28 w-auto mx-auto drop-shadow-lg" />
                    <h1 className="text-4xl font-bold text-center leading-tight">Kitchen<br />Odyssey</h1>
                    <p className="text-white/70 text-sm max-w-xs">Share your culinary masterpieces with a community of passionate home cooks and professional chefs.</p>
                </div>
                {/* Abstract background decoration circles for visual depth */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-warm-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-warm-white/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
