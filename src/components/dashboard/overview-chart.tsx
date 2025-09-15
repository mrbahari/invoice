'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { name: 'فروردین', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'اردیبهشت', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'خرداد', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'تیر', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'مرداد', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'شهریور', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'مهر', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'آبان', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'آذر', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'دی', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'بهمن', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'اسفند', total: Math.floor(Math.random() * 5000) + 1000 },
];

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical">
        <XAxis
          type="number"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursorClassName='fill-accent/20'
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            fontFamily: 'Vazirmatn, sans-serif'
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          itemStyle={{ color: 'hsl(var(--primary))' }}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
