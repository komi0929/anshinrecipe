import React, { forwardRef } from 'react';

export const Input = forwardRef(({ className = '', error, icon: Icon, ...props }, ref) => {
    return (
        <div className="relative w-full">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub">
                    <Icon size={20} />
                </div>
            )}
            <input
                ref={ref}
                className={`
                    w-full bg-white border-2 border-transparent rounded-full px-5 py-3 text-text-main placeholder-text-sub
                    transition-all outline-none
                    focus:border-primary-border focus:shadow-[0_0_0_4px_var(--color-primary-light)]
                    disabled:opacity-50 disabled:bg-slate-50
                    ${Icon ? 'pl-12' : ''}
                    ${error ? 'border-alert focus:border-alert focus:shadow-[0_0_0_4px_var(--color-alert-bg)]' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="mt-1 ml-4 text-xs text-alert font-bold">{error}</p>
            )}
        </div>
    );
});

Input.displayName = "Input";
