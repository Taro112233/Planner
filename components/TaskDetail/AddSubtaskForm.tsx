// components/TaskDetail/AddSubtaskForm.tsx
// "+ Add subtask" trigger that swaps into an inline input + submit form.
// Shared by TaskDetailModal (root-level only) and TaskPage (root or nested,
// depending on where the caller mounts it).
'use client';

import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddSubtaskFormProps {
  onSubmit: (title: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export function AddSubtaskForm({
  onSubmit,
  disabled = false,
  label = 'Add subtask',
  placeholder = 'Subtask title',
}: AddSubtaskFormProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onSubmit(title);
    setDraft('');
    // Stay open and refocused for the next entry (Notion/Linear-style rapid
    // add) instead of collapsing back to the trigger button on every submit.
    inputRef.current?.focus();
  };

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="inline-flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content-primary transition-colors"
      >
        <Plus size={14} />
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => !draft.trim() && setAdding(false)}
        onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" className="h-8" disabled={disabled || !draft.trim()}>
        Add
      </Button>
    </form>
  );
}
