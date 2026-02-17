/**
 * Modal - Accessible modal dialog with backdrop and ESC close
 *
 * Uses createPortal to render outside React tree (z-index isolation).
 * Locks body scroll when open to prevent background scrolling.
 * persistent prop disables click-outside and ESC key close behavior.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, children, className, persistent = false }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (!persistent && e.key === 'Escape') onClose();
        };

        if (isOpen) {
            // Prevent background scrolling when modal is open
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            // Restore scroll on unmount
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, persistent]);

    if (!isOpen) return null;

    // createPortal renders modal at document.body level for proper z-index stacking
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-md transition-opacity"
            onClick={persistent ? undefined : onClose}  // Close on backdrop click (unless persistent)
        >
            <div
                className={cn("relative w-full max-w-lg transform overflow-hidden rounded-lg bg-warm-white p-6 shadow-2xl transition-all", className)}
                onClick={(e) => e.stopPropagation()}  // Prevent closing when clicking modal content
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold leading-6 text-charcoal">
                        {title}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full" aria-label="Close modal">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
