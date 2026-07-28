// components/ShowcaseComponent/ItemShowcase.tsx
"use client"

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Star, Folder, File, Trash2 } from "lucide-react"

export function ItemShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Item</h3>
      <p className="text-sm text-muted-foreground">
        A flexible list item component for displaying content with media and actions.
      </p>
      
      <div className="space-y-6 max-w-lg">
        {/* Basic Item Group */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic Items</h4>
          <ItemGroup className="border rounded-lg">
            <Item>
              <ItemMedia variant="icon">
                <File />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Document.pdf</ItemTitle>
                <ItemDescription>Last modified 2 hours ago</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </ItemActions>
            </Item>
            <ItemSeparator />
            <Item>
              <ItemMedia variant="icon">
                <Folder />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Projects</ItemTitle>
                <ItemDescription>12 items</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </div>

        {/* With Avatar */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Avatar</h4>
          <ItemGroup className="border rounded-lg">
            <Item>
              <ItemMedia>
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>John Doe</ItemTitle>
                <ItemDescription>john@example.com</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="success">Active</Badge>
              </ItemActions>
            </Item>
            <ItemSeparator />
            <Item>
              <ItemMedia>
                <Avatar>
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Alice Smith</ItemTitle>
                <ItemDescription>alice@example.com</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary">Pending</Badge>
              </ItemActions>
            </Item>
          </ItemGroup>
        </div>

        {/* Outline Variant */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Outline Variant</h4>
          <ItemGroup>
            <Item variant="outline">
              <ItemMedia variant="icon">
                <Star className="text-yellow-500" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Starred Item</ItemTitle>
                <ItemDescription>This item has a border</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </div>

        {/* Muted Variant */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Muted Variant</h4>
          <ItemGroup>
            <Item variant="muted" size="sm">
              <ItemContent>
                <ItemTitle>Compact Item</ItemTitle>
                <ItemDescription>Smaller padding with muted background</ItemDescription>
              </ItemContent>
            </Item>
          </ItemGroup>
        </div>
      </div>
    </div>
  )
}