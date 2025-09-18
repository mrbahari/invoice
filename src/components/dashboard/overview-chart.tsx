
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { DailySales } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

type OverviewChartProps = {
  data: DailySales[];
};

const chartConfig = {
  paid: {
    label: 'پرداخت شده',
    color: 'hsl(var(--chart-1))',
  },
  unpaid: {
    label: 'پرداخت نشده',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;


export function OverviewChart({ data }: OverviewChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '350px' }} className="flex items-center justify-center text-muted-foreground">
        داده‌ای برای نمایش در این بازه زمانی وجود ندارد.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(-5)}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value as number)}
          width={80}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="paid" fill="var(--color-paid)" radius={4} />
        <Bar dataKey="unpaid" fill="var(--color-unpaid)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
