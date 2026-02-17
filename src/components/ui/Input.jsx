/**
 * Input - Reusable input field with label, error, and icon support
 *
 * Auto-handles password type with show/hide toggle button.
 * Icon prop renders left-aligned icon with proper padding adjustment.
 * Error state changes border color to red with error message below.
 */
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export function Input({
    label,
    error,
    className,
    id,
    type = "text",
    icon: Icon,
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-warm-gray-60 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {/* Left icon (if provided) with pl-10 padding adjustment */}
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray-40 pointer-events-none" />
                )}
                <input
                    id={id}
                    type={inputType}
                    className={cn(
                        "flex h-10 w-full rounded-lg border border-warm-gray-30 bg-warm-white px-3 py-2 text-sm placeholder:text-warm-gray-30 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                        Icon && "pl-10",         // Space for left icon
                        isPassword && "pr-10",   // Space for password toggle
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
                {/* Password show/hide toggle - tabIndex=-1 keeps it out of tab order */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-40 hover:text-warm-gray-60 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {/* Error message below input */}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
