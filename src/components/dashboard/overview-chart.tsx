
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
    color: "hsl(var(--chart-1))",
  },
  customers: {
    label: 'مشتریان',
    icon: Users,
    color: "hsl(var(--chart-2))",
  },
  invoices: {
    label: 'فاکتورها',
    icon: FileText,
    color: "hsl(var(--chart-3))",
  }
} satisfies ChartConfig;

type ChartKeys = keyof typeof chartConfig;

export function OverviewChart({ data }: { data: DailySales[] }) {
  const [activeCharts, setActiveCharts] = React.useState<ChartKeys[]>(["revenue"]);

  const chartData = React.useMemo(() => {
    return data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
    }));
  }, [data]);
  
  const handleChartToggle = (chartKey: ChartKeys) => {
    setActiveCharts(prev => {
        const newActiveCharts = prev.includes(chartKey)
            ? prev.filter(key => key !== chartKey)
            : [...prev, chartKey];

        // Ensure at least one chart is always active
        if (newActiveCharts.length === 0) {
            return prev;
        }
        return newActiveCharts;
    });
  };

  const yAxisFormatter = (value: number) => {
    // This formatter is now more generic as multiple data types can be shown
    if (value >= 1000000) {
        return `${(value / 1000000).toLocaleString('fa-IR')} M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toLocaleString('fa-IR')} K`;
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
                <CardDescription>برای مقایسه، چند معیار را همزمان انتخاب کنید.</CardDescription>
             </div>
             <div className="flex w-full sm:w-auto items-center gap-2 rounded-lg bg-muted p-1">
                {Object.entries(chartConfig).map(([key, config]) => {
                    const chartKey = key as ChartKeys;
                    const isActive = activeCharts.includes(chartKey);
                    const Icon = config.icon;
                    return (
                        <Button
                            key={key}
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            className={cn("flex-1 h-auto py-1.5 px-3 transition-colors duration-300", isActive && "shadow-sm")}
                            style={isActive ? { backgroundColor: config.color, color: 'white' } : {}}
                            onClick={() => handleChartToggle(chartKey)}
                        >
                            <Icon className={cn("ml-2 h-4 w-4", !isActive && 'text-muted-foreground')} />
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
              cursor={true}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => {
                    const config = chartConfig[name as keyof typeof chartConfig];
                    const formattedValue = name === 'revenue' 
                        ? formatCurrency(value as number, { notation: 'compact' })
                        : toPersianDigits(value);

                    return (
                        <div className="flex min-w-[140px] items-center text-xs">
                            <div className="flex items-center gap-2">
                                <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{ backgroundColor: config.color }}
                                />
                                {config.label}
                            </div>
                            <div className="mr-auto flex items-end gap-1">
                                <span className="font-bold">
                                {formattedValue}
                                </span>
                            </div>
                        </div>
                    );
                  }}
                />
              }
            />
            {activeCharts.map(key => (
                <Area
                    key={key}
                    dataKey={key}
                    type="monotone"
                    fill={`url(#fill-${key})`}
                    stroke={chartConfig[key].color}
                    stackId="1" // Use the same stackId to overlay areas
                    strokeWidth={2}
                    animationDuration={300}
                    animationEasing="ease-in-out"
                />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
