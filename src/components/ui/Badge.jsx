// Badge - Small status indicator with color variants
import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", children, ...props }) {
    const variants = {
        default: "bg-warm-gray-20 text-charcoal",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
        outline: "border border-warm-gray-30 text-warm-gray-60",
        secondary: "bg-brand-accent/10 text-brand-accent"
    };

    return (
        <div className={cn("inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2", variants[variant], className)} {...props}>
            {children}
        </div>
    );
}
