/**
 * Card - Composable card component with sub-components
 *
 * Provides structured layout with header, content, and footer sections.
 * hover:border-brand-accent/25 adds subtle border animation on hover.
 * pt-0 on content/floor removes duplicate top padding when following header.
 */
import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={cn("rounded-lg border border-warm-gray-20 bg-warm-white text-charcoal shadow-sm transition-all duration-200 hover:border-brand-accent/25", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }) {
    return (
        <div className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={cn("p-6 pt-0", className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }) {
    return (
        <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
            {children}
        </div>
    );
}
