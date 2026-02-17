import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { LayoutDashboard, Users, FileText, LogOut } from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Recipes', href: '/admin/recipes', icon: FileText },
];

export function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-cool-gray-20 bg-white shadow-sm flex flex-col">
            <div className="flex h-16 items-center border-b border-cool-gray-20 px-6">
                <Link to="/admin" className="text-xl font-bold text-cool-gray-90">
                    <span className="text-brand">Kitchen Odyssey</span> <span className="text-xs font-normal text-cool-gray-60 bg-cool-gray-10 px-2 py-1 rounded-md ml-2">Admin</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-brand text-[#FFFFFF]"
                                    : "text-cool-gray-60 hover:bg-cool-gray-10 hover:text-brand-accent"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", isActive ? "text-[#FFFFFF]" : "text-inherit")} />
                            <span className={isActive ? "text-[#FFFFFF]" : "text-inherit"}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="border-t border-cool-gray-20 p-4 space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-cool-gray-10 px-3 py-2.5">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user?.username || 'Admin'}
                            className="h-9 w-9 rounded-full object-cover border border-cool-gray-20"
                        />
                    ) : (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                            {(user?.username || 'A').slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-cool-gray-90">{user?.username || 'Admin'}</p>
                        <p className="text-[11px] text-cool-gray-60">{user?.role === 'admin' ? 'Super Admin' : 'Admin'}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
