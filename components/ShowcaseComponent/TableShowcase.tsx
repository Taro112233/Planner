// components/ShowcaseComponent/TableShowcase.tsx
"use client"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const invoices = [
  {
    invoice: "INV001",
    status: "Paid",
    method: "Credit Card",
    amount: "$250.00",
  },
  {
    invoice: "INV002",
    status: "Pending",
    method: "PayPal",
    amount: "$150.00",
  },
  {
    invoice: "INV003",
    status: "Unpaid",
    method: "Bank Transfer",
    amount: "$350.00",
  },
  {
    invoice: "INV004",
    status: "Paid",
    method: "Credit Card",
    amount: "$450.00",
  },
  {
    invoice: "INV005",
    status: "Paid",
    method: "PayPal",
    amount: "$550.00",
  },
]

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Paid":
      return "success"
    case "Pending":
      return "warning"
    case "Unpaid":
      return "error"
    default:
      return "secondary"
  }
}

export function TableShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Table</h3>
      <p className="text-sm text-muted-foreground">
        A responsive table component with sorting and filtering capabilities.
      </p>
      
      <div className="space-y-6">
        {/* Basic Table */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic Table</h4>
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice, index) => (
                <TableRow key={invoice.invoice} delay={index}>
                  <TableCell className="font-medium">{invoice.invoice}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status) as "success" | "warning" | "error" | "secondary"}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.method}</TableCell>
                  <TableCell className="text-right">{invoice.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow animated={false}>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">$1,750.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Simple Table */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Simple Table (No Animation)</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow animated={false}>
                <TableCell>John Doe</TableCell>
                <TableCell>john@example.com</TableCell>
                <TableCell>Admin</TableCell>
              </TableRow>
              <TableRow animated={false}>
                <TableCell>Jane Smith</TableCell>
                <TableCell>jane@example.com</TableCell>
                <TableCell>User</TableCell>
              </TableRow>
              <TableRow animated={false}>
                <TableCell>Bob Wilson</TableCell>
                <TableCell>bob@example.com</TableCell>
                <TableCell>Editor</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}