/**
 * Navbar - Mobile-first navigation for regular users
 *
 * Sticky positioning with backdrop blur for overlay effect on scroll.
 * Shows different content based on auth state (guest vs logged-in).
 * Create Recipe button hidden for guests, admins, and pending users via canInteract.
 * active route highlighting for Discover and Search links.
 */
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, User, PlusCircle, Eye, ChefHat } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export function Navbar() {
    const { user, logout, canInteract, isGuest } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-40 w-full border-b border-warm-gray-20 bg-warm-white/95 backdrop-blur-lg">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2">
                        <ChefHat className="h-6 w-6 text-brand" />
                        <span className="text-xl font-bold text-brand">Kitchen Odyssey</span>
                    </Link>
                    {/* Desktop navigation links - hidden on mobile */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive('/') ? "bg-brand/10 text-brand" : "text-warm-gray-60 hover:text-brand-accent hover:bg-warm-gray-10"
                            )}
                        >
                            Discover
                        </Link>
                        <Link
                            to="/search"
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive('/search') ? "bg-brand/10 text-brand" : "text-warm-gray-60 hover:text-brand-accent hover:bg-warm-gray-10"
                            )}
                        >
                            Search
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Guest mode: show badge and login/signup buttons */}
                    {isGuest ? (
                        <>
                            <Badge variant="secondary" className="gap-1.5">
                                <Eye className="h-3 w-3" />
                                Guest
                            </Badge>
                            <Link to="/login">
                                <Button size="sm" variant="outline">Login</Button>
                            </Link>
                            <Link to="/signup">
                                <Button size="sm" variant="secondary">Sign Up</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            {/* Only active regular users can create recipes */}
                            {canInteract && (
                                <Link to="/recipes/create">
                                    <Button size="sm" variant="primary" className="gap-2">
                                        <PlusCircle className="h-4 w-4" />
                                        <span className="hidden sm:inline">Create Recipe</span>
                                    </Button>
                                </Link>
                            )}

                            {/* User avatar button - links to profile */}
                            <Link to="/profile">
                                <Button variant="ghost" size="icon" className="rounded-full" aria-label="View Profile">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border-2 border-warm-gray-20 hover:border-brand-accent transition-colors" />
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                </Button>
                            </Link>

                            {/* Logout button */}
                            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" aria-label="Logout">
                                <LogOut className="h-5 w-5 text-warm-gray-60" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
