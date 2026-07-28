// components/ShowcaseComponent/ScrollAreaShowcase.tsx
"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
)

const artworks = [
  { title: "Ornamental Cherry", artist: "John Smith" },
  { title: "Sunset Valley", artist: "Emma Wilson" },
  { title: "Mountain Peak", artist: "Michael Brown" },
  { title: "Ocean Waves", artist: "Sarah Davis" },
  { title: "Forest Path", artist: "David Miller" },
  { title: "City Lights", artist: "Lisa Anderson" },
  { title: "Desert Bloom", artist: "James Taylor" },
  { title: "Winter Snow", artist: "Anna White" },
]

export function ScrollAreaShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Scroll Area</h3>
      <p className="text-sm text-muted-foreground">
        Augments native scroll functionality for custom, cross-browser styling.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vertical Scroll */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vertical Scroll</h4>
          <ScrollArea className="h-72 w-48 rounded-md border">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
              {tags.map((tag) => (
                <div key={tag}>
                  <div className="text-sm">{tag}</div>
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Horizontal Scroll */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Horizontal Scroll</h4>
          <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {artworks.map((artwork) => (
                <figure key={artwork.title} className="shrink-0">
                  <div className="overflow-hidden rounded-md">
                    <div className="h-[150px] w-[150px] bg-muted flex items-center justify-center">
                      <span className="text-3xl">🎨</span>
                    </div>
                  </div>
                  <figcaption className="pt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {artwork.title}
                    </span>
                    <br />
                    {artwork.artist}
                  </figcaption>
                </figure>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Both Directions */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="text-sm font-medium">Both Directions</h4>
          <ScrollArea className="h-[200px] w-full max-w-lg rounded-md border">
            <div className="p-4">
              <table className="w-[800px]">
                <thead>
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">User {i + 1}</td>
                      <td className="p-2">user{i + 1}@example.com</td>
                      <td className="p-2">{i % 2 === 0 ? "Admin" : "User"}</td>
                      <td className="p-2">{i % 3 === 0 ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}