// components/shared/EmptyState.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export function EmptyState({ 
  title, 
  description, 
  icon,
  action,
  actionLabel,
  actionHref,
  actionOnClick,
}: EmptyStateProps) {
  const resolvedAction = actionLabel ? {
    label: actionLabel,
    href: actionHref,
    onClick: actionOnClick,
  } : action;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        {icon || <FileQuestion className="w-16 h-16 text-content-secondary" />}
      </div>
      <h3 className="text-lg font-semibold text-content-primary mb-2">{title}</h3>
      {description && (
        <p className="text-content-secondary max-w-md mb-6">{description}</p>
      )}
      {resolvedAction && (
        resolvedAction.href ? (
          <Link href={resolvedAction.href}>
            <Button className="gradient-brand-semantic hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              {resolvedAction.label}
            </Button>
          </Link>
        ) : resolvedAction.onClick ? (
          <Button 
            onClick={resolvedAction.onClick}
            className="gradient-brand-semantic hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            {resolvedAction.label}
          </Button>
        ) : null
      )}
    </div>
  );
}