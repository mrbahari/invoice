'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const initialData = [
  { name: 'فروردین', total: 0 },
  { name: 'اردیبهشت', total: 0 },
  { name: 'خرداد', total: 0 },
  { name: 'تیر', total: 0 },
  { name: 'مرداد', total: 0 },
  { name: 'شهریور', total: 0 },
  { name: 'مهر', total: 0 },
  { name: 'آبان', total: 0 },
  { name: 'آذر', total: 0 },
  { name: 'دی', total: 0 },
  { name: 'بهمن', total: 0 },
  { name: 'اسفند', total: 0 },
];

export function OverviewChart() {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData.map(item => ({
      ...item,
      total: Math.floor(Math.random() * 5000) + 1000,
    })));
  }, []);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical">
        <XAxis
          type="number"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
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
