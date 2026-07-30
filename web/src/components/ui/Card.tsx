import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-surface border border-border',
      elevated: 'bg-surface border border-border shadow-lg',
      bordered: 'bg-black border-2 border-accent',
      gradient: 'bg-gradient-to-br from-surface to-black border border-border',
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-6 ${variantStyles[variant]} ${className || ''}`}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
