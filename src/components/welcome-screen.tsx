'use client';

import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Landmark, Loader } from 'lucide-react';

interface WelcomeScreenProps {
    onDataLoaded: (file: File) => void;
    isLoading: boolean;
}

export function WelcomeScreen({ onDataLoaded, isLoading }: WelcomeScreenProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onDataLoaded(file);
        }
    };

    return (
        <div className="flex items-center justify-center h-full p-4">
            <Card className="w-full max-w-lg text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                        <Landmark className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Welcome to GeoPrice Insights</CardTitle>
                    <CardDescription>
                        Start by uploading your property sales data to generate an interactive market analysis dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Your CSV file must include the columns: <code className="bg-muted px-1.5 py-1 rounded-sm">address</code>, <code className="bg-muted px-1.5 py-1 rounded-sm">latitude</code>, <code className="bg-muted px-1.5 py-1 rounded-sm">longitude</code>, <code className="bg-muted px-1.5 py-1 rounded-sm">sale_price</code>, <code className="bg-muted px-1.5 py-1 rounded-sm">sale_date</code>, and <code className="bg-muted px-1.5 py-1 rounded-sm">square_footage</code>.
                    </p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".csv"
                        disabled={isLoading}
                    />
                    <Button onClick={handleButtonClick} disabled={isLoading} size="lg" className="w-full">
                        {isLoading ? (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Processing...' : 'Upload CSV File'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        All data is processed client-side. Nothing is uploaded to any server.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
