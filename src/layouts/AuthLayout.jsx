import React from 'react';
import { Outlet } from 'react-router-dom';
import Logo from '../assets/Logo.png';

export function AuthLayout() {
    return (
        <div className="min-h-screen grid lg:grid-cols-5 bg-[#f5f7fa]">
            {/* Left: Form */}
            <div className="flex flex-col items-center justify-center p-8 bg-[#f5f7fa] lg:col-span-3">
                <div className="w-full max-w-md space-y-6 rounded-xl border border-cool-gray-20 bg-white p-8 shadow-sm">
                    <div className="flex justify-center mb-6">
                        <img src={Logo} alt="Kitchen Odyssey Logo" className="h-14 w-auto" />
                    </div>
                    <Outlet />
                </div>
                <p className="mt-6 text-xs text-cool-gray-40">&copy; {new Date().getFullYear()} Kitchen Odyssey. All rights reserved.</p>
            </div>

            {/* Right: Branding/Image */}
            <div className="hidden lg:flex lg:col-span-2 flex-col bg-gradient-to-br from-brand to-brand-accent text-white p-12 relative overflow-hidden">
                <div className="z-10 flex-1 flex flex-col items-center justify-center gap-6 text-center">
                    <img src={Logo} alt="Kitchen Odyssey Logo" className="h-28 w-auto mx-auto drop-shadow-lg" />
                    <h1 className="text-4xl font-bold text-center leading-tight">Kitchen<br />Odyssey</h1>
                    <p className="text-white/70 text-sm max-w-xs">Share your culinary masterpieces with a community of passionate home cooks and professional chefs.</p>
                </div>
                {/* Abstract Background Decoration */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
