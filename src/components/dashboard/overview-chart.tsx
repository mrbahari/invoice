
'use client';

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { DailySales } from '@/lib/definitions';
import { formatCurrency, toPersianDigits } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Users, FileText, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns-jalali";


const chartConfig = {
  revenue: {
    label: 'درآمد',
    color: 'hsl(var(--chart-1))',
  },
  customers: {
    label: 'مشتریان',
    color: 'hsl(var(--chart-2))',
  },
  invoices: {
    label: 'فاکتورها',
    color: 'hsl(var(--chart-3))',
  }
} satisfies ChartConfig;


export function OverviewChart({ data }: { data: DailySales[] }) {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("revenue");

  const chartData = React.useMemo(() => {
    return data.map(d => ({
        ...d,
        date: format(new Date(d.date), 'dd MMM'),
    }));
  }, [data]);

  const yAxisFormatter = (value: number) => {
    if (activeChart === 'revenue') {
        return formatCurrency(value, { notation: 'compact' });
    }
    return toPersianDigits(value);
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-[438px] flex items-center justify-center">
         <CardContent>
            <p className="text-muted-foreground">داده‌ای برای نمایش در این بازه زمانی وجود ندارد.</p>
         </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
                <CardTitle>نمای کلی فروش</CardTitle>
                <CardDescription>نمایش روند فروش در بازه زمانی انتخاب شده.</CardDescription>
             </div>
             <div className="flex w-full sm:w-auto items-center gap-2 rounded-lg bg-muted p-1">
                {Object.entries(chartConfig).map(([key, config]) => {
                    const isActive = activeChart === key;
                    return (
                        <Button
                            key={key}
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 h-auto py-1.5 px-3"
                            onClick={() => setActiveChart(key as keyof typeof chartConfig)}
                        >
                            {config.label}
                        </Button>
                    )
                })}
             </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
             <defs>
                <linearGradient id={`fill-${activeChart}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig[activeChart].color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={chartConfig[activeChart].color} stopOpacity={0.1} />
                </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
             <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={yAxisFormatter}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                                    <span className="font-bold text-foreground">
                                        {yAxisFormatter(payload[0].value as number)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        )
                    }
                    return null
                }}
            />
            <Bar dataKey={activeChart} fill={`url(#fill-${activeChart})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

