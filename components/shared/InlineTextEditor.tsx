// components/shared/InlineTextEditor.tsx
// Click (or double-click) a piece of text to edit it in place: Enter or blur
// commits, Escape cancels, a rejected save reverts the draft. Used by the task
// title on both the full page and the slide-over, and by the board column
// header rename.
'use client';

import React, { useEffect, useRef, useState } from 'react';

interface InlineTextEditorProps {
  value: string;
  /** Resolve false to reject the edit — the draft reverts to `value`. */
  onSave: (next: string) => Promise<boolean>;
  /** A save is in flight; the display element dims (see `commit` below). */
  pending?: boolean;
  /** Element rendered when not editing. */
  as?: 'h1' | 'h2' | 'span';
  displayClassName?: string;
  inputClassName?: string;
  ariaLabel: string;
  activateOn?: 'click' | 'doubleClick';
  placeholder?: string;
  /** Enter edit mode from the outside (e.g. a "Rename" menu item). */
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}

export function InlineTextEditor({
  value,
  onSave,
  pending = false,
  as = 'span',
  displayClassName = '',
  inputClassName = '',
  ariaLabel,
  activateOn = 'click',
  placeholder,
  editing: editingProp,
  onEditingChange,
}: InlineTextEditorProps) {
  const [editingState, setEditingState] = useState(false);
  const editing = editingProp ?? editingState;
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const setEditing = (next: boolean) => {
    setEditingState(next);
    onEditingChange?.(next);
  };

  // Adopt a newer server value only while the user is not mid-edit, so a
  // background refetch can't overwrite what they are typing.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    // Leave edit mode before awaiting: the field is gone by the time `pending`
    // flips, which is why the display element dims instead of the input being
    // disabled.
    setEditing(false);
    if (!trimmed || trimmed === value) {
      setDraft(value);
      return;
    }
    const ok = await onSave(trimmed);
    if (!ok) setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          } else if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={[
          'w-full bg-transparent border-b border-interactive-primary outline-none',
          inputClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      />
    );
  }

  const Display = as;
  const activate = () => setEditing(true);

  return (
    <Display
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={activateOn === 'click' ? activate : undefined}
      onDoubleClick={activateOn === 'doubleClick' ? activate : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter') activate();
      }}
      className={[
        'cursor-text rounded px-1 -mx-1 hover:bg-surface-secondary',
        pending && 'opacity-60',
        displayClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {value}
    </Display>
  );
}
