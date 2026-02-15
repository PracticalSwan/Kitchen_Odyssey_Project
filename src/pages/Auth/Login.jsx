import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
            // Small artificial delay to show loader
            await new Promise(resolve => setTimeout(resolve, 500));

            const result = login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-cool-gray-90">Welcome Back</h2>
                <p className="text-cool-gray-60">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="admin@cookhub.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <div className="space-y-1">
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end">
                        <Link to="#" className="text-sm font-medium text-cool-gray-60 hover:text-cool-gray-90">Forgot password?</Link>
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full" isLoading={isLoading} size="lg" variant="primary">
                    Login
                </Button>
            </form>

            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-cool-gray-20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-cool-gray-40">or</span>
                </div>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => { enterGuestMode(); navigate('/'); }}
            >
                Continue as Guest
            </Button>

            <div className="text-center text-sm text-cool-gray-60">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-cool-gray-90 hover:underline">
                    Sign up
                </Link>
            </div>

            <div className="text-center text-xs text-cool-gray-30 mt-4">
                <p>Demo Credentials:</p>
                <p>User: user@cookhub.com / user</p>
                <p>Admin: admin@cookhub.com / admin</p>
            </div>
        </div>
    );
}
