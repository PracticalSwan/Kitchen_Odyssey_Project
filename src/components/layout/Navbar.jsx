import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, User, PlusCircle, Search, Eye } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function Navbar() {
    const { user, logout, canInteract, isGuest } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-40 w-full border-b border-cool-gray-20 bg-white/90 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold text-brand">Kitchen Odyssey</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/" className="text-sm font-medium text-cool-gray-60 hover:text-[#137fec]">Discover</Link>
                        {canInteract && (
                            <Link to="/recipes/my-recipes" className="text-sm font-medium text-cool-gray-60 hover:text-[#137fec]">My Recipes</Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
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
                            {canInteract && (
                                <Link to="/recipes/create">
                                    <Button size="sm" variant="primary" className="gap-2">
                                        <PlusCircle className="h-4 w-4" />
                                        <span>Create</span>
                                    </Button>
                                </Link>
                            )}

                            <Link to="/profile">
                                <Button variant="ghost" size="icon" className="rounded-full" aria-label="View Profile">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-cool-gray-20" />
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                </Button>
                            </Link>

                            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" aria-label="Logout">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
