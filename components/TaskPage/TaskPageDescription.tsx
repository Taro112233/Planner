// components/TaskPage/TaskPageDescription.tsx
// Textarea + explicit Save button (no autosave-per-keystroke).
'use client';

import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface TaskPageDescriptionProps {
  description: string | null;
  onSave: (description: string | null) => Promise<boolean>;
  disabled?: boolean;
}

export function TaskPageDescription({ description, onSave, disabled = false }: TaskPageDescriptionProps) {
  const [draft, setDraft] = useState(description ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(description ?? '');
  }, [description]);

  const dirty = draft !== (description ?? '');

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await onSave(draft.trim() || null);
      if (!ok) setDraft(description ?? '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Description">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary mb-2">
        Description
      </h2>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a description…"
        disabled={disabled || saving}
        className="min-h-24"
      />
      {dirty && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={disabled || saving}>
            Save
          </Button>
        </div>
      )}
    </section>
  );
}
