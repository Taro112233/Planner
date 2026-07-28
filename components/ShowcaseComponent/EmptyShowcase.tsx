// components/ShowcaseComponent/EmptyShowcase.tsx
"use client"

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Inbox, FileSearch, FolderOpen, Plus } from "lucide-react"

export function EmptyShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Empty State</h3>
      <p className="text-sm text-muted-foreground">
        Displays a placeholder when there is no content to show.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* No Results */}
        <Empty className="border">
          <EmptyMedia variant="icon">
            <FileSearch />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filter to find what you&apos;re looking for.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline">Clear filters</Button>
          </EmptyContent>
        </Empty>

        {/* Empty Inbox */}
        <Empty className="border">
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Inbox is empty</EmptyTitle>
            <EmptyDescription>
              You&apos;re all caught up! Check back later for new messages.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>

        {/* No Files */}
        <Empty className="border">
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No files yet</EmptyTitle>
            <EmptyDescription>
              Upload your first file to get started. We support PDF, DOC, and more.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </EmptyContent>
        </Empty>

        {/* Simple Empty */}
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nothing here</EmptyTitle>
            <EmptyDescription>
              This section is empty. Add some content to see it here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline">Add Content</Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  )
}