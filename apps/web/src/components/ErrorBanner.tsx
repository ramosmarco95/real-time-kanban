import React from 'react';
import { X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <div className="flex items-center justify-between">
        <span className="block sm:inline">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-4 text-red-500 hover:text-red-700"
          aria-label="Dismiss error"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}