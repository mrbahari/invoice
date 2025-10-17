
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
    label: 'درآمد',
    icon: DollarSign,
    color: 'hsl(var(--chart-1))',
  },
  customers: {
    label: 'مشتریان',
    icon: Users,
    color: 'hsl(var(--chart-2))',
  },
  invoices: {
    label: 'فاکتورها',
    icon: FileText,
    color: 'hsl(var(--chart-3))',
  }
} satisfies ChartConfig;


export function OverviewChart({ data }: { data: DailySales[] }) {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("revenue");

  const chartData = React.useMemo(() => {
    return data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
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
                    const Icon = config.icon;
                    return (
                        <Button
                            key={key}
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 h-auto py-1.5 px-3"
                            onClick={() => setActiveChart(key as keyof typeof chartConfig)}
                        >
                            <Icon className={cn("ml-2 h-4 w-4", isActive ? `text-${config.color}`: 'text-muted-foreground')} />
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
          <AreaChart data={chartData}>
             <defs>
                {Object.entries(chartConfig).map(([key, config]) => (
                     <linearGradient key={`fill-${key}`} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.1} />
                    </linearGradient>
                ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
             <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={yAxisFormatter}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => {
                    const config = chartConfig[name as keyof typeof chartConfig];
                    return (
                        <div className="flex min-w-[120px] items-center text-xs">
                            <div className="flex items-center gap-2">
                                <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--color-bg)]"
                                style={
                                    {
                                    "--color-bg": config.color,
                                    } as React.CSSProperties
                                }
                                />
                                {config.label}
                            </div>
                            <div className="mr-auto flex items-end gap-1">
                                <span className="font-bold">
                                {yAxisFormatter(value as number)}
                                </span>
                            </div>
                        </div>
                    );
                  }}
                />
              }
            />
            <Area
              dataKey={activeChart}
              type="monotone"
              fill={`url(#fill-${activeChart})`}
              stroke={chartConfig[activeChart].color}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
