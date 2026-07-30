import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-surface text-textPrimary',
      success: 'bg-accent/20 text-accent',
      danger: 'bg-danger/20 text-danger',
      warning: 'bg-yellow-500/20 text-yellow-400',
      info: 'bg-blue-500/20 text-blue-400',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className || ''}`}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
