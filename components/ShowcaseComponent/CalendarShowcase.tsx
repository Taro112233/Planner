// components/ShowcaseComponent/CalendarShowcase.tsx
"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { enUS } from "date-fns/locale"

export function CalendarShowcase() {
  const [mounted, setMounted] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)
  const [multipleDates, setMultipleDates] = React.useState<Date[] | undefined>(undefined)

  // Initialize dates on client side only to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
    const today = new Date()
    setDate(today)
    setDateRange({
      from: today,
      to: addDays(today, 7),
    })
    setMultipleDates([
      today,
      addDays(today, 2),
      addDays(today, 5),
    ])
  }, [])

  // Format date consistently to prevent hydration mismatch
  const formatDate = (d: Date | undefined) => {
    if (!d) return "-"
    return format(d, "MMM dd, yyyy", { locale: enUS })
  }

  if (!mounted) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Calendar</h3>
        <p className="text-sm text-muted-foreground">
          A date field component that allows users to enter and edit date.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Single Date Selection</h4>
            <div className="rounded-md border h-[300px] animate-pulse bg-muted" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Date Range Selection</h4>
            <div className="rounded-md border h-[300px] animate-pulse bg-muted" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Multiple Date Selection</h4>
            <div className="rounded-md border h-[300px] animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Calendar</h3>
      <p className="text-sm text-muted-foreground">
        A date field component that allows users to enter and edit date.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Single Date */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Single Date Selection</h4>
          <div className="rounded-md border">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              locale={enUS}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Selected: {formatDate(date)}
          </p>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Date Range Selection</h4>
          <div className="rounded-md border">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              className="rounded-md"
              locale={enUS}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Range: {formatDate(dateRange?.from)} - {formatDate(dateRange?.to)}
          </p>
        </div>

        {/* Multiple Dates */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Multiple Date Selection</h4>
          <div className="rounded-md border">
            <Calendar
              mode="multiple"
              selected={multipleDates}
              onSelect={setMultipleDates}
              className="rounded-md"
              locale={enUS}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Selected: {multipleDates?.length || 0} dates
          </p>
        </div>
      </div>
    </div>
  )
}