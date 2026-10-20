'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111614]/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className={`relative z-10 w-full ${maxWidths[maxWidth]} bg-[#faf8f5] dark:bg-[#18201c] border border-[#e6e0d4] dark:border-[#283830] rounded-2xl shadow-elevated overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        <div className="flex items-start justify-between p-6 border-b border-[#ece7dc] dark:border-[#223028]">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-[#1c2420] dark:text-[#f3f5f4] tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-[#606d66] dark:text-[#94a19b] mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#606d66] hover:text-[#1c2420] hover:bg-[#ece7dd] dark:text-[#94a19b] dark:hover:text-[#f3f5f4] dark:hover:bg-[#222f28] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(85vh-8rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
