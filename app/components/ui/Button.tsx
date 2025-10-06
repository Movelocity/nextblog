import React, { forwardRef } from 'react';
import classNames from 'classnames';

/**
 * Button size variants
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button visual variants
 */
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info' 
  | 'ghost' 
  | 'outline';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button size */
  size?: ButtonSize;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Button text content */
  text?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Whether the button should be circular/rounded */
  circular?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * Size class mappings
 */
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
};

/**
 * Circular size class mappings
 */
const circularSizeClasses: Record<ButtonSize, string> = {
  xs: 'p-1 w-6 h-6',
  sm: 'p-1.5 w-8 h-8',
  md: 'p-2 w-10 h-10',
  lg: 'p-3 w-12 h-12',
  xl: 'p-4 w-16 h-16'
};

/**
 * Variant class mappings
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm',
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white shadow-sm',
  success: 'bg-green-500 hover:bg-green-600 text-white shadow-sm',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm',
  info: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
};

/**
 * Icon size mappings based on button size
 */
const iconSizeClasses: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

/**
 * Reusable Button component with multiple variants and sizes
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  size = 'md',
  variant = 'primary',
  icon,
  text,
  disabled = false,
  fullWidth = false,
  circular = false,
  loading = false,
  className,
  children,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClass = circular ? circularSizeClasses[size] : sizeClasses[size];
  const variantClass = variantClasses[variant];
  
  const buttonClasses = classNames(
    baseClasses,
    sizeClass,
    variantClass,
    {
      'w-full': fullWidth,
      'rounded-full': circular,
      'hover:scale-105': !disabled && !loading,
      'cursor-not-allowed': disabled || loading,
    },
    className
  );

  const iconElement = icon && (
    <span className={classNames(
      iconSizeClasses[size],
      text && !circular ? 'mr-2' : ''
    )}>
      {loading ? (
        <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
    </span>
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {iconElement}
      {text && !circular && (
        <span>{text}</span>
      )}
      {children && !text && !circular && children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
