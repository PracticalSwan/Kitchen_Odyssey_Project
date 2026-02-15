import { cn } from '../../lib/utils';

export function Table({ className, children, ...props }) {
    return (
        <div className="w-full overflow-auto">
            <table className={cn("w-full caption-bottom text-sm text-left", className)} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ className, children, ...props }) {
    return (
        <thead className={cn("[&_tr]:border-b border-cool-gray-20", className)} {...props}>
            {children}
        </thead>
    );
}

export function TableBody({ className, children, ...props }) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }) {
    return (
        <tr className={cn("border-b border-cool-gray-20 transition-colors hover:bg-cool-gray-10 data-[state=selected]:bg-cool-gray-20", className)} {...props}>
            {children}
        </tr>
    );
}

export function TableHead({ className, children, ...props }) {
    return (
        <th className={cn("sticky top-0 z-10 h-12 px-4 text-left align-middle font-medium text-cool-gray-60 bg-white", className)} {...props}>
            {children}
        </th>
    );
}

export function TableCell({ className, children, ...props }) {
    return (
        <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0 text-cool-gray-90", className)} {...props}>
            {children}
        </td>
    );
}
