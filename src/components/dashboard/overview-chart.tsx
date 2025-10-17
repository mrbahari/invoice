
'use client';

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { DailySales } from '@/lib/definitions';
import { formatCurrency, formatNumber, toPersianDigits } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Users, FileText } from 'lucide-react';


const chartConfig = {
  revenue: {
    label: 'درآمد (ریال)',
    color: 'hsl(var(--chart-1))',
  },
  customers: {
    label: 'مشتریان جدید',
    color: 'hsl(var(--chart-2))',
    icon: Users,
  },
  invoices: {
    label: 'فاکتورها',
    color: 'hsl(var(--chart-3))',
    icon: FileText,
  }
} satisfies ChartConfig;


export function OverviewChart({ data }: { data: DailySales[] }) {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("revenue");

  const total = data.reduce((acc, curr) => acc + curr[activeChart], 0)

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '350px' }} className="flex items-center justify-center text-muted-foreground">
        داده‌ای برای نمایش در این بازه زمانی وجود ندارد.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>نمای کلی</CardTitle>
          <CardDescription>
            نمایش درآمد، مشتریان جدید و تعداد فاکتورها در طول زمان.
          </CardDescription>
        </div>
        <div className="flex">
          {Object.entries(chartConfig).map(([key, config]) => {
            const isActive = activeChart === key
            return (
              <button
                key={key}
                data-active={isActive}
                className="relative z-10 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:border-b-2 data-[active=true]:border-b-primary data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key as keyof typeof chartConfig)}
              >
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-2xl">
                  {key === 'revenue' ? formatCurrency(total) : total.toLocaleString('fa-IR')}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
                <linearGradient id={`fill-${activeChart}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                    offset="5%"
                    stopColor={`var(--color-${activeChart})`}
                    stopOpacity={0.8}
                    />
                    <stop
                    offset="95%"
                    stopColor={`var(--color-${activeChart})`}
                    stopOpacity={0.1}
                    />
                </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => toPersianDigits(value)}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => activeChart === 'revenue' ? toPersianDigits(formatCurrency(value).replace(/ریال/g, '')) : toPersianDigits(value) }
            />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey={activeChart}
              type="natural"
              fill={`url(#fill-${activeChart})`}
              stroke={`var(--color-${activeChart})`}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
