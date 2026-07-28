// components/ShowcaseComponent/SelectShowcase.tsx
"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function SelectShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select</h3>
      <p className="text-sm text-muted-foreground">
        Displays a list of options for the user to pick from.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        {/* Basic Select */}
        <div className="space-y-2">
          <Label>Basic</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* With Groups */}
        <div className="space-y-2">
          <Label>With Groups</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
                <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Europe & Africa</SelectLabel>
                <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                <SelectItem value="cet">Central European Time (CET)</SelectItem>
                <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Asia</SelectLabel>
                <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                <SelectItem value="cst_china">China Standard Time (CST)</SelectItem>
                <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* With Disabled Items */}
        <div className="space-y-2">
          <Label>With Disabled Items</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="enterprise" disabled>
                Enterprise (Contact Sales)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Disabled Select */}
        <div className="space-y-2">
          <Label>Disabled</Label>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* With Default Value */}
        <div className="space-y-2 md:col-span-2">
          <Label>With Default Value</Label>
          <Select defaultValue="medium">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="xlarge">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}