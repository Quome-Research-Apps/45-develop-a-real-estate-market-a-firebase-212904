'use client';

import { useState, useMemo, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';
import { WelcomeScreen } from '@/components/welcome-screen';
import { MapView } from '@/components/map-view';
import { AiInsights } from '@/components/ai-insights';
import { PriceDistributionHistogram, PricePerSqftChart, SalesVolumeChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Map, BarChart3, AreaChart, BarChartBig, Sparkles } from 'lucide-react';
import Papa from 'papaparse';

const MAP_ID = 'geoprice-insights-map';

export function DashboardPage() {
  const [allData, setAllData] = useState<Property[] | null>(null);
  const [filteredData, setFilteredData] = useState<Property[] | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [isFilteringByView, setIsFilteringByView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDataLoaded = (file: File) => {
    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const requiredColumns = ['address', 'latitude', 'longitude', 'sale_price', 'sale_date', 'square_footage'];
          const headers = results.meta.fields;
          if (!headers || !requiredColumns.every(col => headers.includes(col))) {
            throw new Error(`Invalid CSV format. Required columns are: ${requiredColumns.join(', ')}`);
          }

          const properties: Property[] = results.data.map((row: any, index: number) => {
            const sale_price = parseFloat(row.sale_price);
            const square_footage = parseFloat(row.square_footage);
            const latitude = parseFloat(row.latitude);
            const longitude = parseFloat(row.longitude);

            if (isNaN(sale_price) || isNaN(square_footage) || isNaN(latitude) || isNaN(longitude) || square_footage <= 0) {
              return null;
            }

            return {
              id: `${index}-${row.address}`,
              address: row.address,
              latitude: latitude,
              longitude: longitude,
              sale_price: sale_price,
              sale_date: new Date(row.sale_date),
              square_footage: square_footage,
              price_per_sqft: sale_price / square_footage,
            };
          }).filter((p): p is Property => p !== null && !isNaN(p.sale_date.getTime()));
          
          if (properties.length === 0) {
            throw new Error('No valid properties found in the CSV file.');
          }

          setAllData(properties);
          setFilteredData(properties);
          setIsLoading(false);
          toast({
            title: "Success",
            description: `Loaded ${properties.length} properties.`,
          });
        } catch (error: any) {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Error loading data",
            description: error.message,
          });
        }
      },
      error: (error: any) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error parsing CSV",
          description: error.message,
        });
      }
    });
  };

  const handleReset = () => {
    setAllData(null);
    setFilteredData(null);
  }

  useMemo(() => {
    if (!isFilteringByView || !mapBounds) {
      if(allData) setFilteredData(allData);
      return;
    }
    if (allData && mapBounds) {
      const filtered = allData.filter(p => mapBounds.contains({ lat: p.latitude, lng: p.longitude }));
      setFilteredData(filtered);
    }
  }, [allData, mapBounds, isFilteringByView]);
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Google Maps API key is missing. Please add <code className="bg-muted px-1 py-0.5 rounded-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex-shrink-0 border-b z-10 bg-card">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <h1 className="text-xl font-semibold">GeoPrice Insights</h1>
                    {allData && <button onClick={handleReset} className="text-sm text-primary hover:underline">Upload new file</button>}
                </div>
            </div>
        </header>

        <main className="flex-grow min-h-0">
          {!allData ? (
            <WelcomeScreen onDataLoaded={handleDataLoaded} isLoading={isLoading} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              <div className="lg:col-span-2 h-[50vh] lg:h-full relative">
                <MapView properties={allData} onBoundsChange={setMapBounds} mapId={MAP_ID} />
                <div className="absolute top-2 right-2 bg-card p-2 rounded-lg shadow-md">
                    <div className="flex items-center space-x-2">
                        <Switch id="filter-switch" checked={isFilteringByView} onCheckedChange={setIsFilteringByView} />
                        <Label htmlFor="filter-switch">Filter by map view</Label>
                    </div>
                </div>
              </div>
              <div className="lg:col-span-1 h-[50vh] lg:h-full">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">AI Market Insights</CardTitle>
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <AiInsights data={filteredData} />
                      </CardContent>
                    </Card>
                    <Separator />
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Price Distribution</CardTitle>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <PriceDistributionHistogram data={filteredData} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Price per SqFt Over Time</CardTitle>
                          <AreaChart className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <PricePerSqftChart data={filteredData} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Monthly Sales Volume</CardTitle>
                          <BarChartBig className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <SalesVolumeChart data={filteredData} />
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </main>
      </div>
    </APIProvider>
  );
}
