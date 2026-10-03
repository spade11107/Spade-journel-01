import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-slideUp`}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-zinc-800 flex-shrink-0">
            <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
        {footer && (
          <div className="p-5 border-t border-zinc-800 flex-shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-zinc-300">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-lg shadow-red-600/20"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
