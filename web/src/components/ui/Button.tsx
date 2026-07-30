import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

    const variantStyles = {
      primary: 'bg-accent hover:bg-accent/90 text-black shadow-lg hover:shadow-xl',
      secondary: 'bg-surface border border-border text-textPrimary hover:bg-surface/80',
      danger: 'bg-danger hover:bg-danger/90 text-white shadow-lg hover:shadow-xl',
      ghost: 'text-textPrimary hover:bg-surface/50',
      outline: 'border-2 border-accent text-accent hover:bg-accent/10',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="animate-spin">⏳</span>
        )}
        {props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';
