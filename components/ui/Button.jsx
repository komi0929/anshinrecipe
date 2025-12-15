import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled,
    ...props
}) => {

    const baseStyles = "inline-flex items-center justify-center font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-primary text-white shadow-lg shadow-orange-200 hover:bg-orange-600",
        secondary: "bg-primary-light text-primary hover:bg-orange-200",
        outline: "bg-transparent border-2 border-border text-text-sub hover:border-primary hover:text-primary",
        ghost: "bg-transparent text-text-sub hover:bg-slate-100",
        danger: "bg-alert-bg text-alert border border-alert hover:bg-rose-100"
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5 h-8",
        md: "text-sm px-6 py-3 h-12",
        lg: "text-lg px-8 py-4 h-14",
        icon: "h-10 w-10 p-0"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
