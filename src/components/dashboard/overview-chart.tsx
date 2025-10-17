
'use client';

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { DailySales } from '@/lib/definitions';
import { formatCurrency, toPersianDigits } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Users, FileText, DollarSign } from 'lucide-react';
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";


const chartConfig = {
  revenue: {
    label: 'درآمد (ریال)',
    color: 'hsl(var(--chart-1))',
    icon: DollarSign,
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
  const [activeCharts, setActiveCharts] = React.useState<string[]>(["revenue"]);

  const totals = React.useMemo(() => {
    if (!data) return { revenue: 0, customers: 0, invoices: 0 };
    return {
        revenue: data.reduce((acc, curr) => acc + curr.revenue, 0),
        customers: data.reduce((acc, curr) => acc + curr.customers, 0),
        invoices: data.reduce((acc, curr) => acc + curr.invoices, 0),
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="h-[438px] flex items-center justify-center">
         <CardContent>
            <p className="text-muted-foreground">داده‌ای برای نمایش در این بازه زمانی وجود ندارد.</p>
         </CardContent>
      </Card>
    );
  }

  const handleToggle = (chartKey: string) => {
    setActiveCharts(prev => 
      prev.includes(chartKey) 
        ? prev.filter(c => c !== chartKey)
        : [...prev, chartKey]
    );
  };
  

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
                <CardTitle>نمای کلی فروش</CardTitle>
                <CardDescription>مقایسه درآمد، مشتریان و فاکتورها در بازه زمانی انتخاب شده.</CardDescription>
             </div>
             <div className="flex w-full sm:w-auto items-center gap-2 rounded-lg bg-muted p-1">
                {Object.entries(chartConfig).map(([key, config]) => {
                    const isActive = activeCharts.includes(key);
                    return (
                        <Button
                            key={key}
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 h-auto py-1.5 px-3"
                            onClick={() => handleToggle(key)}
                        >
                            <div className="flex items-center gap-2 text-right w-full">
                                <config.icon className={cn("h-5 w-5", isActive ? `text-[${'config.color'}]` : 'text-muted-foreground')} style={{color: isActive ? config.color : ''}} />
                                <div className="grid gap-0">
                                    <span className="text-xs font-normal">{config.label}</span>
                                    <span className="font-bold text-sm">
                                        {key === 'revenue' ? formatCurrency(totals.revenue) : totals[key as keyof typeof totals].toLocaleString('fa-IR')}
                                    </span>
                                </div>
                            </div>
                        </Button>
                    )
                })}
             </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
                {Object.entries(chartConfig).map(([key, config]) => (
                     <linearGradient key={`fill-${key}`} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.1} />
                    </linearGradient>
                ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatCurrency(value, {notation: 'compact'})}
                width={activeCharts.includes('revenue') ? 60 : 0}
                tick={activeCharts.includes('revenue')}
            />
             <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => toPersianDigits(value)}
                width={activeCharts.some(c => c === 'customers' || c === 'invoices') ? 30 : 0}
                tick={activeCharts.some(c => c === 'customers' || c === 'invoices')}
            />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" labelClassName="font-bold" />}
            />

            {activeCharts.includes('revenue') && (
                <Area
                  yAxisId="left"
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fill-revenue)"
                  stroke={chartConfig.revenue.color}
                  stackId="a"
                />
            )}
            {activeCharts.includes('customers') && (
                <Area
                  yAxisId="right"
                  dataKey="customers"
                  type="natural"
                  fill="url(#fill-customers)"
                  stroke={chartConfig.customers.color}
                  stackId="b"
                />
            )}
             {activeCharts.includes('invoices') && (
                <Area
                  yAxisId="right"
                  dataKey="invoices"
                  type="natural"
                  fill="url(#fill-invoices)"
                  stroke={chartConfig.invoices.color}
                  stackId="c"
                />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
