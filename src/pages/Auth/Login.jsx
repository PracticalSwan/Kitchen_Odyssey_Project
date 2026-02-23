// Login - User authentication page with email, password, and guest mode
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatError } from '../../components/ui/Toast';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, enterGuestMode } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error || 'Invalid email or password');
            }
        } catch (err) {
            setError(formatError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-charcoal">Welcome Back</h2>
                <p className="text-warm-gray-60">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="email"
                    label="Email"
                    type="email"
                    icon={Mail}
                    placeholder="admin@kitchenodyssey.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <div className="space-y-1">
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        icon={Lock}
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end">
                        <Link to="#" className="text-sm font-medium text-warm-gray-60 hover:text-brand-accent transition-colors">Forgot password?</Link>
                    </div>
                </div>

                {/* Error alert */}
                {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" className="w-full" isLoading={isLoading} size="lg" variant="primary">
                    Login
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
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-brand-accent hover:underline">
                    Sign up
                </Link>
            </div>

            {/* Demo credentials for testing */}
            <div className="text-center text-xs text-warm-gray-30 mt-4 space-y-0.5">
                <p className="font-medium text-warm-gray-40">Demo Credentials</p>
                <p>User: user@kitchenodyssey.com / user</p>
                <p>Admin: admin@kitchenodyssey.com / admin</p>
            </div>
        </div>
    );
}
