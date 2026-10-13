// components/SettingsPage/SettingsPage.tsx
// "ตั้งค่า" — the one place the site theme is chosen: light/dark mode and the
// accent colour, both from the existing theme system (hooks/useTheme). Saved
// per browser by theme-manager, as before.
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PlannerTopbar } from '@/components/PlannerShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/useTheme';
import { SettingsAccentGrid } from './SettingsAccentGrid';
import { SettingsModeSwitch } from './SettingsModeSwitch';

export function SettingsPage() {
  const { accents, activeAccent, currentAccent, isDark, isInitialized, changeAccent, toggleMode } =
    useTheme();

  return (
    <div className="min-h-screen bg-surface-canvas">
      <PlannerTopbar title="ตั้งค่า" subtitle="ธีมและการแสดงผลของเว็บ" />

      <div className="max-w-3xl space-y-3.5 px-5 pb-6 pt-1">
        <section aria-label="ธีม" className="wcard px-4 py-4">
          <h2 className="text-[12.5px] font-semibold text-content-secondary">โหมดการแสดงผล</h2>
          <p className="mt-0.5 text-[11.5px] text-content-tertiary">
            พื้นหลังโหมดมืดเป็นสีเทาเป็นกลาง สีหลักจะใช้เฉพาะปุ่มและส่วนที่กดได้
          </p>
          <div className="mt-3">
            {isInitialized ? (
              <SettingsModeSwitch isDark={isDark} onToggle={toggleMode} />
            ) : (
              <Skeleton className="h-[86px] w-full rounded-xl" />
            )}
          </div>
        </section>

        <section aria-label="สีหลัก" className="wcard px-4 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[12.5px] font-semibold text-content-secondary">สีหลัก</h2>
            <span className="flex-1" />
            {isInitialized && (
              <span className="flex items-center gap-1.5 text-[11.5px] text-content-tertiary">
                <span className="size-2.5 rounded-full" style={{ background: currentAccent.swatch }} />
                {currentAccent.name}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] text-content-tertiary">
            ใช้กับปุ่ม ลิงก์ วงติ๊ก แถบความคืบหน้า และกราฟ
          </p>
          <div className="mt-3">
            {isInitialized ? (
              <SettingsAccentGrid accents={accents} activeAccent={activeAccent} onPick={changeAccent} />
            ) : (
              <Skeleton className="h-28 w-full rounded-xl" />
            )}
          </div>

          {/* A live sample of what the accent touches. */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[11px] bg-surface-secondary px-3 py-2.5">
            <span className="rounded-lg bg-interactive-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground">
              ＋ งานใหม่
            </span>
            <span className="rounded-full bg-interactive-primary px-3 py-1 text-[11.5px] text-primary-foreground">
              ตัวกรองที่เลือก
            </span>
            <span className="flex flex-1 items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
                <span className="block h-full w-3/5 rounded-full bg-interactive-primary" />
              </span>
              <span className="text-[11px] tabular-nums text-content-tertiary">3/5</span>
            </span>
          </div>
        </section>

        <section aria-label="บัญชี" className="wcard overflow-hidden">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-[13.5px] text-content-primary transition-colors hover:bg-surface-secondary"
          >
            <span className="flex-1">
              โปรไฟล์และบัญชี
              <span className="block text-[11.5px] text-content-tertiary">ชื่อ รูปโปรไฟล์ เบอร์โทร</span>
            </span>
            <ChevronRight size={15} className="text-content-tertiary" />
          </Link>
        </section>
      </div>
    </div>
  );
}
