import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-lg shadow-blue-600/20',
  secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700',
  ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300 border-transparent',
  danger: 'bg-red-600/90 hover:bg-red-500 text-white border-transparent shadow-lg shadow-red-600/20',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-600/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
