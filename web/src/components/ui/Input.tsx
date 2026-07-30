import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-textPrimary mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
            error ? 'border-danger ring-2 ring-danger/50' : ''
          } ${className || ''}`}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {helperText && <p className="text-xs text-textSecondary mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
