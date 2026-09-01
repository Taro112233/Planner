// components/PlannerShell/SidebarSearchRow.tsx
// The rail's top row: search plus the control that collapses the rail.
//
// The toggle lives here rather than in the page topbar because it acts on the
// sidebar. When the rail is collapsed there is no room for a text field — it
// would spill past the 48px rail — so the row becomes a single magnifier
// button, and the toggle drops onto the line below it.
'use client';

import React from 'react';
import { PanelLeft, Search } from 'lucide-react';
import { SidebarInput, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function SidebarSearchRow() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

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
          disabled
          className="size-7 shrink-0 text-content-tertiary"
        >
          <Search size={15} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 py-1 pl-1">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-content-tertiary" />
        <SidebarInput placeholder="ค้นหางาน / งานย่อย" className="h-7 pl-7 text-xs" disabled />
      </div>
      {toggle}
    </div>
  );
}
