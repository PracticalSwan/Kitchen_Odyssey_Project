import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    disabled,
    children,
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-brand text-white hover:bg-[#a90f27] focus:ring-brand",
        secondary: "bg-brand-accent text-white hover:bg-brand-accent/85 focus:ring-brand-accent",
        outline: "border border-cool-gray-30 bg-white hover:bg-cool-gray-10 text-cool-gray-90",
        ghost: "bg-transparent hover:bg-cool-gray-10 text-cool-gray-90",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
    };

    const sizes = {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10 p-2"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
