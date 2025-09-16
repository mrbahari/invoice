
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { parseISO, format } from 'date-fns-jalali';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

type OverviewChartProps = {
  invoices: Invoice[];
  period?: 'all' | '30d' | '7d' | 'today';
};

export function OverviewChart({ invoices, period = 'all' }: OverviewChartProps) {
  const data = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return [];
    }

    if (period === 'today' || period === '7d') {
      // Group by day
      const dailyData = invoices.reduce<Record<string, number>>((acc, invoice) => {
        const day = format(parseISO(invoice.date), 'yyyy-MM-dd');
        if (!acc[day]) {
          acc[day] = 0;
        }
        acc[day] += invoice.total;
        return acc;
      }, {});

      return Object.entries(dailyData)
        .map(([date, total]) => ({
          name: format(parseISO(date), 'MM/dd'),
          total,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else {
        // Group by month
        const monthlyData = invoices.reduce<Record<string, number>>((acc, invoice) => {
            const month = format(parseISO(invoice.date), 'yyyy-MM');
            if (!acc[month]) {
            acc[month] = 0;
            }
            acc[month] += invoice.total;
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData).sort();
        const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
        
        return sortedMonths.map(monthKey => {
            const date = parseISO(`${monthKey}-01`);
            const monthIndex = date.getMonth();
            const year = date.getFullYear(); // Gregorian year
            return {
                name: `${monthNames[monthIndex]}`,
                total: monthlyData[monthKey],
            };
        });
    }
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
