// components/TaskPage/TaskPageHeader.tsx
// Breadcrumb back to the board, plus an inline-editable task title (click to
// edit, save on blur/Enter, Escape to cancel).
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PlannerTopbar } from '@/components/PlannerShell';

interface TaskPageHeaderProps {
  title: string;
  onSave: (title: string) => Promise<boolean>;
  disabled?: boolean;
}

export function TaskPageHeader({ title, onSave, disabled = false }: TaskPageHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === title) {
      setDraft(title);
      return;
    }
    const ok = await onSave(trimmed);
    if (!ok) setDraft(title);
  };

  return (
    <div className="border-b border-border-subtle">
      <div className="px-4 sm:px-6 lg:px-8 pt-3">
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-xs text-content-tertiary hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={12} />
          กลับไปที่บอร์ด
        </Link>
      </div>

      <PlannerTopbar title="Task" />

      <div className="px-4 sm:px-6 lg:px-8 pb-4">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                setDraft(title);
                setEditing(false);
              }
            }}
            disabled={disabled}
            className="w-full text-2xl font-bold text-content-primary bg-transparent border-b border-interactive-primary outline-none"
          />
        ) : (
          <h1
            role="button"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
            className="text-2xl font-bold text-content-primary cursor-text rounded px-1 -mx-1 hover:bg-surface-secondary"
          >
            {title}
          </h1>
        )}
      </div>
    </div>
  );
}
