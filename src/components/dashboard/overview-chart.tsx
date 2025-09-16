
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { parseISO, format, subDays, eachDayOfInterval } from 'date-fns-jalali';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

type OverviewChartProps = {
  invoices: Invoice[];
  period?: 'all' | '30d' | '7d' | 'today';
};

export function OverviewChart({ invoices, period = 'all' }: OverviewChartProps) {
  const data = useMemo(() => {
    // Group existing invoice data by day
    const salesByDay = invoices.reduce<Record<string, number>>((acc, invoice) => {
      const day = format(parseISO(invoice.date), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = 0;
      }
      acc[day] += invoice.total;
      return acc;
    }, {});

    // Generate all days for the last 7 days
    const today = new Date();
    const last7Days = subDays(today, 6);
    const dateRange = eachDayOfInterval({ start: last7Days, end: today });

    // Create a complete dataset for the last 7 days, filling missing days with 0
    const completeData = dateRange.map(date => {
        const dayString = format(date, 'yyyy-MM-dd');
        return {
            name: format(date, 'MM/dd'),
            total: salesByDay[dayString] || 0,
        };
    });
    
    // If period is 'all', we might need to show more than 7 days
    if (period === 'all') {
        const allSalesDays = Object.keys(salesByDay)
            .sort()
            .map(dayString => ({
                name: format(parseISO(dayString), 'MM/dd'),
                total: salesByDay[dayString],
            }));

        // If there are sales older than 7 days, show all of them.
        // Otherwise, stick to the 7-day view.
        if (allSalesDays.length > 0 && parseISO(Object.keys(salesByDay).sort()[0]) < last7Days) {
            return allSalesDays;
        }
    }


    return completeData;

  }, [invoices, period]);


  if (data.length === 0) {
    return (
      <div style={{ height: '350px' }} className="flex items-center justify-center text-muted-foreground">
        داده‌ای برای نمایش در این بازه زمانی وجود ندارد.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value as number)}
          width={80}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            fontFamily: 'Vazirmatn, sans-serif'
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          itemStyle={{ color: 'hsl(var(--primary))' }}
          formatter={(value) => [formatCurrency(value as number), 'درآمد']}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
