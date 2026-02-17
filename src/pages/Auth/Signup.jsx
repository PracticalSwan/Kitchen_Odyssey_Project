/**
 * Signup - User registration page
 *
 * Creates new account with 'pending' status (requires admin approval).
 * Avatar auto-generated via DiceBear API based on first name.
 * Client-side validation for password matching and minimum length.
 * Social auth buttons are UI placeholders (not functional in demo).
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatError } from '../../components/ui/Toast';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export function Signup() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        birthday: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup, enterGuestMode } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        if (!formData.birthday) {
            setError('Birthday is required');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/[A-Z]/.test(formData.password)) {
            setError('Password must include at least one uppercase letter');
            return;
        }

        if (!/[0-9]/.test(formData.password)) {
            setError('Password must include at least one number');
            return;
        }

        setIsLoading(true);

        try {
            const username = `${formData.firstName} ${formData.lastName}`;
            await signup({
                username,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                birthday: formData.birthday,
                password: formData.password,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}`
            });

            navigate('/');
        } catch (err) {
            setError(formatError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-charcoal">Get Started</h2>
                <p className="text-warm-gray-60">Create a new account to join the community</p>
            </div>

            {/* Social Auth Buttons - UI placeholders only */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-warm-gray-20 bg-white px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-warm-gray-10"
                    onClick={() => setError('Social signup is not available in demo mode')}
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                </button>
                <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-warm-gray-20 bg-white px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-warm-gray-10"
                    onClick={() => setError('Social signup is not available in demo mode')}
                >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                </button>
            </div>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-warm-gray-20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-warm-gray-40">or continue with email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name fields side by side */}
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        id="firstName"
                        label="First Name"
                        icon={User}
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="lastName"
                        label="Last Name"
                        icon={User}
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <Input
                    id="birthday"
                    label="Birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={handleChange}
                    required
                />
                <Input
                    id="email"
                    label="Email"
                    type="email"
                    icon={Mail}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <Input
                    id="password"
                    label="Password"
                    type="password"
                    icon={Lock}
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    icon={Lock}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />

                {/* Error alert */}
                {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" className="w-full" isLoading={isLoading} size="lg" variant="primary">
                    Create Account
                </Button>
            </form>

            {/* Guest mode button */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => { enterGuestMode(); navigate('/'); }}
            >
                Continue as Guest
            </Button>

            <div className="text-center text-sm text-warm-gray-60">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-accent hover:underline">
                    Log in
                </Link>
            </div>
        </div>
    );
}
