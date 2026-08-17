// components/TaskPage/TaskPageDescription.tsx
// Textarea + explicit Save button (no autosave-per-keystroke).
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface TaskPageDescriptionProps {
  description: string | null;
  onSave: (description: string | null) => Promise<boolean>;
  /** A description save is in flight. */
  saving?: boolean;
}

export function TaskPageDescription({ description, onSave, saving = false }: TaskPageDescriptionProps) {
  const [draft, setDraft] = useState(description ?? '');
  const dirtyRef = useRef(false);

  const dirty = draft !== (description ?? '');
  dirtyRef.current = dirty;

  useEffect(() => {
    // Adopt the server's value only when the user has nothing unsaved — the
    // same rule TaskPageHeader applies to the title. Without the guard a save
    // that trims whitespace, or a change made in another tab, would silently
    // overwrite what's being typed.
    if (!dirtyRef.current) setDraft(description ?? '');
  }, [description]);

  const handleSave = async () => {
    const next = draft.trim() || null;
    const ok = await onSave(next);
    // Converge on whatever the server now holds, so the draft stops counting
    // as dirty (the saved value is trimmed; the draft may not have been).
    setDraft(ok ? next ?? '' : description ?? '');
  };

  return (
    <section aria-label="Description">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
        Description
      </h2>
      {/* Deliberately never disabled: disabling a focused textarea mid-save
          blurs it and drops the caret. Only the Save button locks. */}
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a description…"
        className="min-h-24"
      />
      {dirty && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </section>
  );
}
