// components/shared/ConfirmLeaveModal.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmLeaveModalProps {
  open: boolean;
  /** Dialog title — defaults to "Unsaved Changes" */
  title?: string;
  /** Body text explaining what will be lost */
  description?: string;
  /** Label for "stay on page" button */
  stayLabel?: string;
  /** Label for "leave without saving" button */
  leaveLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmLeaveModal({
  open,
  title = 'Unsaved Changes',
  description = 'You have unsaved changes. If you leave now, all changes will be lost.',
  stayLabel = 'Stay',
  leaveLabel = 'Leave without saving',
  onConfirm,
  onCancel,
}: ConfirmLeaveModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-alert-warning-bg border border-alert-warning-border flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-alert-warning-icon" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription className="text-content-secondary pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 sm:flex-none"
          >
            {stayLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 sm:flex-none"
          >
            {leaveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
