'use client';

import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!isOpen) return;
    cancelRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600',
            )}
          >
            {variant === 'danger' ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Info className="h-6 w-6" />
            )}
          </div>

          <div className="flex-1">
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary-600 hover:bg-primary-700',
            )}
          >
            {isLoading ? 'Please wait…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
