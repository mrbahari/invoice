
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
    
    // Always generate the last 7 days as a base
    const today = new Date();
    const last7DaysDate = subDays(today, 6);
    const sevenDayRange = eachDayOfInterval({ start: last7DaysDate, end: today });
    
    // Create a complete dataset for the last 7 days, filling missing days with 0
    const sevenDayData = sevenDayRange.map(date => {
        const dayString = format(date, 'yyyy-MM-dd');
        return {
            name: format(date, 'MM/dd'),
            total: salesByDay[dayString] || 0,
        };
    });

    // If period is 'all' and there are sales older than 7 days, show all sales days.
    // Otherwise, for '7d', '30d', 'today', or 'all' (with no old data), stick to the 7-day view.
    const allSalesDaysSorted = Object.keys(salesByDay).sort();
    if (period === 'all' && allSalesDaysSorted.length > 0 && parseISO(allSalesDaysSorted[0]) < last7DaysDate) {
      return allSalesDaysSorted.map(dayString => ({
        name: format(parseISO(dayString), 'MM/dd'),
        total: salesByDay[dayString],
      }));
    }
    
    // For other periods, we can filter the invoices, but for simplicity and to always show a trend,
    // we will stick to the 7-day view, which will correctly reflect the totals for '7d' and 'today' within it.
    // The main `invoices` prop is already filtered in the reports page, so `salesByDay` is correct.
    // So if the filtered invoices fall within the 7 day range, they will be shown.
    // If not, the chart will show 0 for the last 7 days, which is correct.
    
    // When the period is not 'all', it means the invoices are already filtered.
    // So we just need to format them. If there's no data, we should still show the last 7 days.
    if(invoices.length === 0) {
        return sevenDayData;
    }

    const allFilteredSalesDays = Object.keys(salesByDay)
      .sort()
      .map(dayString => ({
          name: format(parseISO(dayString), 'MM/dd'),
          total: salesByDay[dayString],
      }));

    if (period !== 'all' && allFilteredSalesDays.length > 0) {
        return allFilteredSalesDays;
    }


    return sevenDayData;

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
