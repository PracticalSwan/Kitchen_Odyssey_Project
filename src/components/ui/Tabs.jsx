/**
 * Tabs - Compound component for tabbed content with controlled/uncontrolled modes
 *
 * Context-based state sharing between TabsList, TabsTrigger, and TabsContent.
 * Supports controlled mode (value + onValueChange props) or uncontrolled (defaultValue).
 * Only renders the active tab's content (early return in TabsContent).
 */
import { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, children, className }) {
    // Uncontrolled mode: use internal state; Controlled mode: use props
    const [localValue, setLocalValue] = useState(defaultValue);
    const currentValue = value ?? localValue;
    const onChange = onValueChange ?? setLocalValue;

    return (
        <TabsContext.Provider value={{ value: currentValue, onChange }}>
            <div className={cn("w-full", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, children }) {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-warm-gray-10 p-1 text-warm-gray-60", className)}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className }) {
    const context = useContext(TabsContext);
    const isActive = context.value === value;

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                isActive && "bg-warm-white text-brand-accent shadow-sm",
                className
            )}
            onClick={() => context.onChange(value)}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className }) {
    const context = useContext(TabsContext);
    // Early return for non-active tabs - avoids rendering hidden content
    if (context.value !== value) return null;

    return (
        <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2", className)}>
            {children}
        </div>
    );
}
