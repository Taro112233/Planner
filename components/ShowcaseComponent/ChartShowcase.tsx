// components/ShowcaseComponent/ChartShowcase.tsx
"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

const chartData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--color-chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig

export function ChartShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chart</h3>
      <p className="text-sm text-muted-foreground">
        Beautiful charts built using Recharts with Tailwind CSS.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Bar Chart</h4>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Line Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Line Chart</h4>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="desktop"
                stroke="var(--color-desktop)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="mobile"
                stroke="var(--color-mobile)"
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Area Chart */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="text-sm font-medium">Area Chart</h4>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="desktop"
                fill="var(--color-desktop)"
                fillOpacity={0.3}
                stroke="var(--color-desktop)"
              />
              <Area
                type="monotone"
                dataKey="mobile"
                fill="var(--color-mobile)"
                fillOpacity={0.3}
                stroke="var(--color-mobile)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}