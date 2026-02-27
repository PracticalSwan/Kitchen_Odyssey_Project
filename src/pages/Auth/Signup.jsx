// Signup - User registration page with validation
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatError } from '../../components/ui/Toast';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

function buildUsername(firstName, lastName, email) {
    const fromName = `${firstName || ''}_${lastName || ''}`
        .toLowerCase()
        .replace(/[^a-z0-9_\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30);

    if (fromName.length >= 2) return fromName;

    const fromEmail = (email || '')
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 30);

    if (fromEmail.length >= 2) return fromEmail;
    return `user_${Date.now().toString(36)}`;
}

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
            const username = buildUsername(formData.firstName, formData.lastName, formData.email);
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
