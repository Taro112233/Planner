// components/ShowcaseComponent/KbdShowcase.tsx
"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

export function KbdShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Kbd (Keyboard)</h3>
      <p className="text-sm text-muted-foreground">
        Displays keyboard key or shortcut in a styled format.
      </p>
      
      <div className="space-y-6">
        {/* Single Keys */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Single Keys</h4>
          <div className="flex flex-wrap items-center gap-2">
            <Kbd>⌘</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>⌥</Kbd>
            <Kbd>⌃</Kbd>
            <Kbd>↵</Kbd>
            <Kbd>⌫</Kbd>
            <Kbd>⎋</Kbd>
            <Kbd>Tab</Kbd>
            <Kbd>Space</Kbd>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Common Shortcuts</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between max-w-xs">
              <span className="text-sm">Copy</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>C</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <span className="text-sm">Paste</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>V</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <span className="text-sm">Undo</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>Z</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <span className="text-sm">Save</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>S</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <span className="text-sm">Search</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
          </div>
        </div>

        {/* Complex Shortcuts */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Complex Shortcuts</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between max-w-sm">
              <span className="text-sm">Force Quit</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>⌥</Kbd>
                <Kbd>⎋</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between max-w-sm">
              <span className="text-sm">Screenshot</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>4</Kbd>
              </KbdGroup>
            </div>
          </div>
        </div>

        {/* In Context */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">In Context</h4>
          <p className="text-sm text-muted-foreground">
            Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette, 
            or <Kbd>⎋</Kbd> to close any modal.
          </p>
        </div>
      </div>
    </div>
  )
}