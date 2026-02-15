import { cn } from '../../lib/utils';

export function Input({
    label,
    error,
    className,
    id,
    type = "text",
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-cool-gray-60 mb-1">
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-cool-gray-30 bg-white px-3 py-2 text-sm placeholder:text-cool-gray-30 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                    error && "border-red-500 focus:ring-red-500",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
