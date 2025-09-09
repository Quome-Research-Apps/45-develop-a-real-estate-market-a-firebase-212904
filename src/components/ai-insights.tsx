'use client';

import { useState, useMemo } from 'react';
import { generateMarketInsights } from '@/ai/flows/generate-market-insights';
import type { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface AiInsightsProps {
  data: Property[] | null;
}

export function AiInsights({ data }: AiInsightsProps) {
  const [prompt, setPrompt] = useState('');
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const datasetSummary = useMemo(() => {
    if (!data || data.length === 0) return '';
    
    const prices = data.map(p => p.sale_price);
    const sqfts = data.map(p => p.square_footage);
    const dates = data.map(p => p.sale_date);

    const stats = {
      count: data.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minSqft: Math.min(...sqfts),
      maxSqft: Math.max(...sqfts),
      avgSqft: sqfts.reduce((a, b) => a + b, 0) / sqfts.length,
      minDate: new Date(Math.min(...dates.map(d => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map(d => d.getTime()))),
      avgPricePerSqft: data.reduce((a, b) => a + b.price_per_sqft, 0) / data.length
    };
    
    return `
      - Number of properties: ${stats.count}
      - Sale date range: ${stats.minDate.toLocaleDateString()} to ${stats.maxDate.toLocaleDateString()}
      - Price range: ${stats.minPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} to ${stats.maxPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      - Average price: ${stats.avgPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      - Square footage range: ${stats.minSqft} to ${stats.maxSqft} sqft
      - Average square footage: ${stats.avgSqft.toFixed(2)} sqft
      - Average price per square foot: ${stats.avgPricePerSqft.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
    `;
  }, [data]);

  const handleGenerate = async () => {
    if (!datasetSummary) {
      toast({ title: 'No data available', description: 'Please load data to generate insights.' });
      return;
    }
    setIsLoading(true);
    setInsights('');
    try {
      const result = await generateMarketInsights({
        datasetSummary: datasetSummary,
        userPrompt: prompt,
      });
      setInsights(result.insights);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error generating insights',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground text-sm py-4">Load data to use AI Insights.</div>;
  }
  
  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Optional: Ask the AI to focus on specific aspects (e.g., 'focus on trends in the luxury market')."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
        {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Generating...' : 'Generate Insights'}
      </Button>
      {insights && (
        <Card className="bg-muted/50">
            <CardContent className="pt-6">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{insights}</div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
