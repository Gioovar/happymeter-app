import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    iconLeft?: LucideIcon;
    iconRight?: LucideIcon;
    isLoading?: boolean;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    iconLeft: IconLeft,
    iconRight: IconRight,
    isLoading,
    fullWidth,
    className,
    disabled,
    ...props
}: ButtonProps) {
    
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl";
    
    const variants = {
        primary: "bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/20 focus:ring-violet-500",
        secondary: "bg-white/10 text-white hover:bg-white/20 focus:ring-white/50 border border-white/5",
        outline: "bg-transparent text-gray-300 border border-white/20 hover:border-violet-500 hover:text-white focus:ring-violet-500",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/10 focus:ring-white/50",
        danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 focus:ring-red-500",
    };
    
    const sizes = {
        sm: "text-xs px-3 py-1.5 gap-1.5",
        md: "text-sm px-4 py-2 gap-2",
        lg: "text-base px-6 py-3 gap-3",
        icon: "p-2",
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && "w-full",
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            
            {!isLoading && IconLeft && <IconLeft className={cn("shrink-0", size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />}
            
            {children}
            
            {!isLoading && IconRight && <IconRight className={cn("shrink-0", size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />}
        </button>
    );
}
