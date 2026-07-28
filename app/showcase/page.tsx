// app/showcase/page.tsx
"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

// Import all showcase components
import { AccordionShowcase } from "@/components/ShowcaseComponent/AccordionShowcase"
import { AlertDialogShowcase } from "@/components/ShowcaseComponent/AlertDialogShowcase"
import { AlertShowcase } from "@/components/ShowcaseComponent/AlertShowcase"
import { AspectRatioShowcase } from "@/components/ShowcaseComponent/AspectRatioShowcase"
import { AvatarShowcase } from "@/components/ShowcaseComponent/AvatarShowcase"
import { BadgeShowcase } from "@/components/ShowcaseComponent/BadgeShowcase"
import { BreadcrumbShowcase } from "@/components/ShowcaseComponent/BreadcrumbShowcase"
import { ButtonShowcase } from "@/components/ShowcaseComponent/ButtonShowcase"
import { ButtonGroupShowcase } from "@/components/ShowcaseComponent/ButtonGroupShowcase"
import { CalendarShowcase } from "@/components/ShowcaseComponent/CalendarShowcase"
import { CardShowcase } from "@/components/ShowcaseComponent/CardShowcase"
import { CarouselShowcase } from "@/components/ShowcaseComponent/CarouselShowcase"
import { ChartShowcase } from "@/components/ShowcaseComponent/ChartShowcase"
import { CheckboxShowcase } from "@/components/ShowcaseComponent/CheckboxShowcase"
import { CollapsibleShowcase } from "@/components/ShowcaseComponent/CollapsibleShowcase"
import { CommandShowcase } from "@/components/ShowcaseComponent/CommandShowcase"
import { ContextMenuShowcase } from "@/components/ShowcaseComponent/ContextMenuShowcase"
import { DialogShowcase } from "@/components/ShowcaseComponent/DialogShowcase"
import { DrawerShowcase } from "@/components/ShowcaseComponent/DrawerShowcase"
import { DropdownMenuShowcase } from "@/components/ShowcaseComponent/DropdownMenuShowcase"
import { EmptyShowcase } from "@/components/ShowcaseComponent/EmptyShowcase"
import { FieldShowcase } from "@/components/ShowcaseComponent/FieldShowcase"
import { FormShowcase } from "@/components/ShowcaseComponent/FormShowcase"
import { HoverCardShowcase } from "@/components/ShowcaseComponent/HoverCardShowcase"
import { InputShowcase } from "@/components/ShowcaseComponent/InputShowcase"
import { InputGroupShowcase } from "@/components/ShowcaseComponent/InputGroupShowcase"
import { ItemShowcase } from "@/components/ShowcaseComponent/ItemShowcase"
import { KbdShowcase } from "@/components/ShowcaseComponent/KbdShowcase"
import { LabelShowcase } from "@/components/ShowcaseComponent/LabelShowcase"
import { MenubarShowcase } from "@/components/ShowcaseComponent/MenubarShowcase"
import { NavigationMenuShowcase } from "@/components/ShowcaseComponent/NavigationMenuShowcase"
import { PaginationShowcase } from "@/components/ShowcaseComponent/PaginationShowcase"
import { PopoverShowcase } from "@/components/ShowcaseComponent/PopoverShowcase"
import { ProgressShowcase } from "@/components/ShowcaseComponent/ProgressShowcase"
import { RadioGroupShowcase } from "@/components/ShowcaseComponent/RadioGroupShowcase"
import { ResizableShowcase } from "@/components/ShowcaseComponent/ResizableShowcase"
import { ScrollAreaShowcase } from "@/components/ShowcaseComponent/ScrollAreaShowcase"
import { SelectShowcase } from "@/components/ShowcaseComponent/SelectShowcase"
import { SeparatorShowcase } from "@/components/ShowcaseComponent/SeparatorShowcase"
import { SheetShowcase } from "@/components/ShowcaseComponent/SheetShowcase"
import { SkeletonShowcase } from "@/components/ShowcaseComponent/SkeletonShowcase"
import { SliderShowcase } from "@/components/ShowcaseComponent/SliderShowcase"
import { SpinnerShowcase } from "@/components/ShowcaseComponent/SpinnerShowcase"
import { SwitchShowcase } from "@/components/ShowcaseComponent/SwitchShowcase"
import { TableShowcase } from "@/components/ShowcaseComponent/TableShowcase"
import { TabsShowcase } from "@/components/ShowcaseComponent/TabsShowcase"
import { TextareaShowcase } from "@/components/ShowcaseComponent/TextareaShowcase"
import { ToastShowcase } from "@/components/ShowcaseComponent/ToastShowcase"
import { ToggleShowcase } from "@/components/ShowcaseComponent/ToggleShowcase"
import { ToggleGroupShowcase } from "@/components/ShowcaseComponent/ToggleGroupShowcase"
import { TooltipShowcase } from "@/components/ShowcaseComponent/TooltipShowcase"

// Define component categories
const categories = {
  "Layout": ["Accordion", "AspectRatio", "Card", "Collapsible", "Resizable", "ScrollArea", "Separator"],
  "Forms": ["Button", "ButtonGroup", "Calendar", "Checkbox", "Field", "Form", "Input", "InputGroup", "Label", "RadioGroup", "Select", "Slider", "Switch", "Textarea", "Toggle", "ToggleGroup"],
  "Navigation": ["Breadcrumb", "Command", "ContextMenu", "DropdownMenu", "Menubar", "NavigationMenu", "Pagination", "Tabs"],
  "Feedback": ["Alert", "AlertDialog", "Dialog", "Drawer", "HoverCard", "Popover", "Progress", "Sheet", "Skeleton", "Spinner", "Toast", "Tooltip"],
  "Data Display": ["Avatar", "Badge", "Carousel", "Chart", "Empty", "Item", "Kbd", "Table"],
}

// Map component names to their showcase components
const showcaseComponents: Record<string, React.ComponentType> = {
  "Accordion": AccordionShowcase,
  "AlertDialog": AlertDialogShowcase,
  "Alert": AlertShowcase,
  "AspectRatio": AspectRatioShowcase,
  "Avatar": AvatarShowcase,
  "Badge": BadgeShowcase,
  "Breadcrumb": BreadcrumbShowcase,
  "Button": ButtonShowcase,
  "ButtonGroup": ButtonGroupShowcase,
  "Calendar": CalendarShowcase,
  "Card": CardShowcase,
  "Carousel": CarouselShowcase,
  "Chart": ChartShowcase,
  "Checkbox": CheckboxShowcase,
  "Collapsible": CollapsibleShowcase,
  "Command": CommandShowcase,
  "ContextMenu": ContextMenuShowcase,
  "Dialog": DialogShowcase,
  "Drawer": DrawerShowcase,
  "DropdownMenu": DropdownMenuShowcase,
  "Empty": EmptyShowcase,
  "Field": FieldShowcase,
  "Form": FormShowcase,
  "HoverCard": HoverCardShowcase,
  "Input": InputShowcase,
  "InputGroup": InputGroupShowcase,
  "Item": ItemShowcase,
  "Kbd": KbdShowcase,
  "Label": LabelShowcase,
  "Menubar": MenubarShowcase,
  "NavigationMenu": NavigationMenuShowcase,
  "Pagination": PaginationShowcase,
  "Popover": PopoverShowcase,
  "Progress": ProgressShowcase,
  "RadioGroup": RadioGroupShowcase,
  "Resizable": ResizableShowcase,
  "ScrollArea": ScrollAreaShowcase,
  "Select": SelectShowcase,
  "Separator": SeparatorShowcase,
  "Sheet": SheetShowcase,
  "Skeleton": SkeletonShowcase,
  "Slider": SliderShowcase,
  "Spinner": SpinnerShowcase,
  "Switch": SwitchShowcase,
  "Table": TableShowcase,
  "Tabs": TabsShowcase,
  "Textarea": TextareaShowcase,
  "Toast": ToastShowcase,
  "Toggle": ToggleShowcase,
  "ToggleGroup": ToggleGroupShowcase,
  "Tooltip": TooltipShowcase,
}

// Get all component names
const allComponents = Object.values(categories).flat()

export default function ShowcasePage() {
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("all")

  // Filter components based on search and category
  const filteredComponents = React.useMemo(() => {
    let components = activeCategory === "all" 
      ? allComponents 
      : categories[activeCategory as keyof typeof categories] || []
    
    if (search) {
      components = components.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return components
  }, [search, activeCategory])

  // Handle smooth scroll navigation
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="min-h-screen bg-surface-primary relative">
      {/* Background Gradient - เหมือนหน้าอื่นๆ */}
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
      
      <div className="relative container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-content-primary">
              UI Component Showcase
            </h1>
            <p className="text-lg text-content-secondary">
              A comprehensive collection of {allComponents.length} UI components built with Radix UI, Tailwind CSS, and Framer Motion.
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-secondary" />
            <Input
              placeholder="Search components..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border-primary text-content-primary"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="flex-wrap h-auto bg-surface-secondary border-border-primary">
            <TabsTrigger value="all" className="text-content-primary data-[state=active]:bg-surface-interactive">
              All ({allComponents.length})
            </TabsTrigger>
            {Object.entries(categories).map(([category, components]) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="text-content-primary data-[state=active]:bg-surface-interactive"
              >
                {category} ({components.length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Component Grid */}
        {filteredComponents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-content-secondary">
              No components found matching your search.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredComponents.map((componentName) => {
              const ShowcaseComponent = showcaseComponents[componentName]
              if (!ShowcaseComponent) return null
              
              return (
                <section 
                  key={componentName} 
                  id={componentName.toLowerCase()}
                  className="border border-border-primary rounded-lg p-6 bg-card scroll-mt-8"
                >
                  <ShowcaseComponent />
                </section>
              )
            })}
          </div>
        )}

        {/* Quick Navigation */}
        <div className="fixed bottom-4 right-4 hidden lg:block">
          <div className="bg-surface-secondary border border-border-primary rounded-lg shadow-lg p-4 max-h-100 overflow-hidden">
            <p className="text-sm font-medium mb-2 text-content-primary">
              Quick Navigation
            </p>
            <ScrollArea className="h-75">
              <div className="space-y-1">
                {filteredComponents.map((name) => (
                  <a
                    key={name}
                    href={`#${name.toLowerCase()}`}
                    onClick={(e) => handleNavClick(e, name.toLowerCase())}
                    className="block text-sm text-content-secondary hover:text-content-primary transition-colors py-1"
                  >
                    {name}
                  </a>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}