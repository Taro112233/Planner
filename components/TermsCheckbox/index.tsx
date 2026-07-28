// components/TermsCheckbox/index.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export function TermsCheckbox({ checked, onCheckedChange, error }: TermsCheckboxProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={error ? "border-red-500" : ""}
        />
        <Label
          htmlFor="terms"
          className="text-sm leading-relaxed cursor-pointer"
        >
          ฉันได้อ่านและยอมรับ{' '}
          <Link
            href="/terms-of-service"
            target="_blank"
            className="text-primary hover:underline font-medium"
          >
            ข้อกำหนดและเงื่อนไขการใช้บริการ
          </Link>
          {' '}และ{' '}
          <Link
            href="/privacy-policy"
            target="_blank"
            className="text-primary hover:underline font-medium"
          >
            นโยบายความเป็นส่วนตัว
          </Link>
        </Label>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}