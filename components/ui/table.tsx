// components/ui/table.tsx
"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { ComponentPropsWithoutRef } from "react"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  // Hairline bottom border at 5% opacity — no harsh line
  <thead ref={ref} className={cn("[&_tr]:border-b [&_tr]:border-black/5 dark:[&_tr]:border-white/[0.07]", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-black/5 dark:border-white/[0.07] bg-surface-secondary/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

interface TableRowProps extends ComponentPropsWithoutRef<typeof motion.tr> {
  animated?: boolean
  delay?: number
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, animated = true, delay = 0, ...props }, ref) => {
    const rowClass = cn(
      // Hairline row dividers — 5% opacity, smooth hover transition
      "border-b border-black/5 dark:border-white/[0.06] transition-colors duration-150",
      "hover:bg-black/[0.025] dark:hover:bg-white/[0.03]",
      "data-[state=selected]:bg-interactive-primary/8",
      className
    )

    if (animated) {
      return (
        <motion.tr
          ref={ref}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay * 0.06, duration: 0.2, ease: "easeOut" }}
          className={rowClass}
          {...props}
        />
      )
    }

    return (
      <motion.tr
        ref={ref}
        className={rowClass}
        {...props}
      />
    )
  }
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // Generous height, tighter tracking for column labels, muted text
      "h-11 px-3 text-left align-middle text-xs font-medium tracking-[0.04em] uppercase text-content-tertiary [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      // More generous padding — Apple tables breathe
      "px-3 py-3.5 align-middle text-sm text-content-primary [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}