// components/shared/LoadingState.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'กำลังโหลด...', fullScreen = false }: LoadingStateProps) {
  const containerClass = fullScreen 
    ? 'min-h-screen bg-surface-primary flex items-center justify-center'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-interactive-primary" />
        <p className="text-content-secondary">{message}</p>
      </div>
    </div>
  );
}