// components/TaskDetail/TaskDatesEditor.tsx
// Start/due date pickers (Popover + Calendar, single-date mode each).
'use client';

import React from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TaskDatesEditorProps {
  startDate: string | null;
  dueDate: string | null;
  onChange: (dates: { startDate: string | null; dueDate: string | null }) => void;
  disabled?: boolean;
}

function formatLabel(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set date';
}

export function TaskDatesEditor({ startDate, dueDate, onChange, disabled = false }: TaskDatesEditorProps) {
  const pick = (field: 'startDate' | 'dueDate') => (date: Date | undefined) => {
    onChange({
      startDate: field === 'startDate' ? (date ? date.toISOString() : null) : startDate,
      dueDate: field === 'dueDate' ? (date ? date.toISOString() : null) : dueDate,
    });
  };

  const clear = (field: 'startDate' | 'dueDate') => () => {
    onChange({
      startDate: field === 'startDate' ? null : startDate,
      dueDate: field === 'dueDate' ? null : dueDate,
    });
  };

  return (
    <div className="flex flex-wrap gap-4">
      <DatePickerButton
        label="Start date"
        value={startDate}
        onSelect={pick('startDate')}
        onClear={clear('startDate')}
        disabled={disabled}
      />
      <DatePickerButton
        label="Due date"
        value={dueDate}
        onSelect={pick('dueDate')}
        onClear={clear('dueDate')}
        disabled={disabled}
      />
    </div>
  );
}

interface DatePickerButtonProps {
  label: string;
  value: string | null;
  onSelect: (date: Date | undefined) => void;
  onClear: () => void;
  disabled?: boolean;
}

function DatePickerButton({ label, value, onSelect, onClear, disabled = false }: DatePickerButtonProps) {
  return (
    <div>
      <p className="text-xs text-content-tertiary mb-1">{label}</p>
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8" disabled={disabled}>
              <CalendarIcon size={12} className="mr-1.5" />
              {formatLabel(value)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={onSelect} />
          </PopoverContent>
        </Popover>
        {value && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="text-content-tertiary hover:text-content-primary p-1"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
