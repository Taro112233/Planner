// components/TaskDetail/TaskTitleEditor.tsx
// Inline-editable task title. Two size variants so the full page and the
// slide-over share one implementation.
'use client';

import React from 'react';
import { InlineTextEditor } from '@/components/shared';

interface TaskTitleEditorProps {
  title: string;
  onSave: (title: string) => Promise<boolean>;
  pending?: boolean;
  variant?: 'page' | 'panel';
}

export function TaskTitleEditor({
  title,
  onSave,
  pending = false,
  variant = 'page',
}: TaskTitleEditorProps) {
  const isPage = variant === 'page';

  return (
    <InlineTextEditor
      value={title}
      onSave={onSave}
      pending={pending}
      as={isPage ? 'h1' : 'h2'}
      ariaLabel="Task title"
      displayClassName={
        isPage
          ? 'block text-2xl font-bold text-content-primary'
          : 'block text-lg font-semibold text-content-primary'
      }
      inputClassName={
        isPage
          ? 'text-2xl font-bold text-content-primary'
          : 'text-lg font-semibold text-content-primary'
      }
    />
  );
}
