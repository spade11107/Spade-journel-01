import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-zinc-900 border rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 ${error ? 'border-red-500/60' : 'border-zinc-800'} ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`bg-zinc-900 border rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 cursor-pointer ${error ? 'border-red-500/60' : 'border-zinc-800'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`bg-zinc-900 border rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none ${error ? 'border-red-500/60' : 'border-zinc-800'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
