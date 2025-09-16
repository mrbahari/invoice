
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { parseISO, format, subMonths, startOfMonth, isAfter } from 'date-fns-jalali';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

type OverviewChartProps = {
  invoices: Invoice[];
  period?: 'all' | '30d' | '7d' | 'today';
};

export function OverviewChart({ invoices, period = 'all' }: OverviewChartProps) {
  const data = useMemo(() => {
    const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    
    if (period === 'today' || period === '7d') {
      // Group by day logic remains the same
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
    }

    // --- Monthly Data Logic ---
    
    // 1. Group actual sales by month
    const monthlySales = invoices.reduce<Record<string, number>>((acc, invoice) => {
        const monthKey = format(parseISO(invoice.date), 'yyyy-MM');
        if (!acc[monthKey]) {
            acc[monthKey] = 0;
        }
        acc[monthKey] += invoice.total;
        return acc;
    }, {});

    // 2. Determine date range
    const now = new Date();
    const threeMonthsAgo = startOfMonth(subMonths(now, 2)); // Start of 3 months ago
    
    let earliestDate = threeMonthsAgo;
    if (invoices.length > 0) {
        const earliestInvoiceDate = invoices.reduce((earliest, inv) => {
            const invDate = parseISO(inv.date);
            return invDate < earliest ? invDate : earliest;
        }, now);
        
        if (isAfter(threeMonthsAgo, earliestInvoiceDate)) {
            earliestDate = startOfMonth(earliestInvoiceDate);
        }
    }

    // 3. Generate all months in the range
    const allMonths: { name: string; total: number }[] = [];
    let currentMonth = earliestDate;

    while (isAfter(now, currentMonth) || currentMonth.getMonth() === now.getMonth()) {
        const monthKey = format(currentMonth, 'yyyy-MM');
        const monthIndex = currentMonth.getMonth();

        allMonths.push({
            name: `${monthNames[monthIndex]}`,
            total: monthlySales[monthKey] || 0,
        });

        // Move to the next month
        const nextMonthDate = new Date(currentMonth);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        
        // Break loop if next month is in the future and not the same year
        if (nextMonthDate > now && nextMonthDate.getFullYear() > now.getFullYear()) {
             break;
        }
        currentMonth = nextMonthDate;

        // Safety break
        if(allMonths.length > 36) break;
    }

    return allMonths;

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
