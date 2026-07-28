// components/ShowcaseComponent/ResizableShowcase.tsx
"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function ResizableShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Resizable</h3>
      <p className="text-sm text-muted-foreground">
        Accessible resizable panel groups and layouts with keyboard support.
      </p>
      
      <div className="space-y-6">
        {/* Horizontal */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Horizontal</h4>
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[200px] max-w-2xl rounded-lg border"
          >
            <ResizablePanel defaultSize={50}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Panel One</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Panel Two</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Vertical */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vertical</h4>
          <ResizablePanelGroup
            direction="vertical"
            className="min-h-[300px] max-w-md rounded-lg border"
          >
            <ResizablePanel defaultSize={25}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Header</span>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={75}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Content</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Complex Layout */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Complex Layout</h4>
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[300px] max-w-3xl rounded-lg border"
          >
            <ResizablePanel defaultSize={20} minSize={15}>
              <div className="flex h-full items-center justify-center p-6 bg-muted/30">
                <span className="font-semibold">Sidebar</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">Main Content</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={30}>
                  <div className="flex h-full items-center justify-center p-6 bg-muted/30">
                    <span className="font-semibold">Terminal</span>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  )
}