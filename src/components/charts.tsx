'use client';

import { useState, useMemo } from 'react';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Property } from '@/lib/types';
import { format } from 'date-fns';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
        return <ChartTooltipContent {...props} />;
    }
    return null;
};

export function PriceDistributionHistogram({ data }: { data: Property[] | null }) {
  const [binCount, setBinCount] = useState(20);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const prices = data.map(p => p.sale_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const binWidth = (maxPrice - minPrice) / binCount;

    const bins = Array.from({ length: binCount }, () => 0);
    prices.forEach(price => {
      let binIndex = Math.floor((price - minPrice) / binWidth);
      if (binIndex === binCount) binIndex--; // Include max price in last bin
      bins[binIndex]++;
    });

    return bins.map((count, i) => ({
      name: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(minPrice + i * binWidth)}`,
      count,
    }));
  }, [data, binCount]);

  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground p-4">No data to display.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4">
        <Label htmlFor="bin-slider" className="text-sm">Number of Bins: {binCount}</Label>
        <Slider
          id="bin-slider"
          min={5}
          max={50}
          step={1}
          value={[binCount]}
          onValueChange={(value) => setBinCount(value[0])}
        />
      </div>
    </div>
  );
}

export function PricePerSqftChart({ data }: { data: Property[] | null }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const monthlyData = data.reduce((acc, p) => {
      const month = format(p.sale_date, 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = { total_price_per_sqft: 0, count: 0 };
      }
      acc[month].total_price_per_sqft += p.price_per_sqft;
      acc[month].count++;
      return acc;
    }, {} as Record<string, { total_price_per_sqft: number, count: number }>);
    
    return Object.entries(monthlyData)
      .map(([month, { total_price_per_sqft, count }]) => ({
        month: format(new Date(month), 'MMM yy'),
        avg_price_per_sqft: total_price_per_sqft / count,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [data]);
  
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground p-4">No data to display.</div>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toFixed(0)}`} />
          <Tooltip content={renderTooltip} cursor={{ stroke: 'hsl(var(--accent))', strokeDasharray: '3 3' }} />
          <Line type="monotone" dataKey="avg_price_per_sqft" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SalesVolumeChart({ data }: { data: Property[] | null }) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
    
        const monthlyData = data.reduce((acc, p) => {
            const month = format(p.sale_date, 'yyyy-MM');
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month]++;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(monthlyData)
            .map(([month, count]) => ({
                month: format(new Date(month), 'MMM yy'),
                sales: count,
            }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="text-center text-muted-foreground p-4">No data to display.</div>;
    }

    return (
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--muted))' }}/>
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
