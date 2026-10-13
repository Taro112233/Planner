// components/PlannerShell/SidebarSearchRow.tsx
// The rail's top row: search plus the control that collapses the rail.
//
// The toggle lives here rather than in the page topbar because it acts on the
// sidebar. When the rail is collapsed there is no room for a text field — it
// would spill past the 48px rail — so the row becomes a single magnifier that
// expands the rail and focuses the field, and the toggle drops onto the line
// below it.
//
// Search covers card titles and subtask titles across the workspace (GET
// /api/search). Results open below the field; ↑/↓ move, Enter opens the task.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PanelLeft, Search } from 'lucide-react';
import { SidebarInput, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { resolveGroupColor } from '@/lib/shared/group-colors';
import { cn } from '@/lib/client/utils';
import type { TaskSearchResultDto } from '@/types/planner';

const DEBOUNCE_MS = 250;

export function SidebarSearchRow() {
  const { state, toggleSidebar, setOpen: setSidebarOpen } = useSidebar();
  const collapsed = state === 'collapsed';
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const focusAfterExpand = useRef(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaskSearchResultDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  // Debounced fetch; a newer keystroke aborts the older request.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const json = await response.json();
        setResults(response.ok && json.success ? (json.data as TaskSearchResultDto[]) : []);
        setHighlight(0);
      } catch {
        // Aborted or offline — keep whatever was showing.
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  // The magnifier expands the rail first; focus once the field exists.
  useEffect(() => {
    if (!collapsed && focusAfterExpand.current) {
      focusAfterExpand.current = false;
      inputRef.current?.focus();
    }
  }, [collapsed]);

  const openResult = (result: TaskSearchResultDto) => {
    setOpen(false);
    setQuery('');
    router.push(`/board/tasks/${result.id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      openResult(results[highlight] ?? results[0]);
    }
  };

  const toggle = (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label={collapsed ? 'ขยายแถบข้าง' : 'ย่อแถบข้าง'}
      title={collapsed ? 'ขยายแถบข้าง' : 'ย่อแถบข้าง'}
      className="size-7 shrink-0 text-content-tertiary hover:text-content-primary"
    >
      <PanelLeft size={15} />
    </Button>
  );

  // Expand first: it is the only way back out of the collapsed rail, so it
  // sits at the very top where it is easiest to find.
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        {toggle}
        <Button
          variant="ghost"
          size="icon"
          aria-label="ค้นหางาน / งานย่อย"
          title="ค้นหางาน / งานย่อย"
          onClick={() => {
            focusAfterExpand.current = true;
            setSidebarOpen(true);
          }}
          className="size-7 shrink-0 text-content-tertiary hover:text-content-primary"
        >
          <Search size={15} />
        </Button>
      </div>
    );
  }

  const showPanel = open && query.trim().length > 0;

  return (
    <div className="flex items-center gap-1 py-1 pl-1">
      <Popover open={showPanel} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-content-tertiary" />
            <SidebarInput
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="ค้นหางาน / งานย่อย"
              aria-label="ค้นหางาน / งานย่อย"
              role="combobox"
              aria-expanded={showPanel}
              aria-controls="sidebar-search-results"
              className="h-7 pl-7 text-xs"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          id="sidebar-search-results"
          align="start"
          sideOffset={6}
          className="w-80 p-1"
          // Typing continues in the field; the panel must not steal focus.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (event.target instanceof Node && inputRef.current?.contains(event.target)) {
              event.preventDefault();
            }
          }}
        >
          {searching && results.length === 0 ? (
            <p className="flex items-center gap-2 px-2.5 py-2 text-xs text-content-tertiary">
              <Loader2 size={12} className="animate-spin" />
              กำลังค้นหา…
            </p>
          ) : results.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-content-tertiary">ไม่พบงานที่ตรงกับ “{query.trim()}”</p>
          ) : (
            <ul role="listbox" aria-label="ผลการค้นหา">
              {results.map((result, index) => (
                <li key={result.id} role="option" aria-selected={index === highlight}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => openResult(result)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-2.5 py-1.5 text-left',
                      index === highlight ? 'bg-surface-secondary' : ''
                    )}
                  >
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: resolveGroupColor(result.groupColor) }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-content-primary">{result.title}</span>
                      <span className="block truncate text-[11px] text-content-tertiary">
                        {result.matchedSubtask && result.matchedSubtask !== result.title
                          ? `งานย่อย: ${result.matchedSubtask} · `
                          : ''}
                        {result.planName} · {result.groupName}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
      {toggle}
    </div>
  );
}
