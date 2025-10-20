import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function FixOrder1555Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const executeOrderFix = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        details: {
          totalItemsRemaining: number;
          archivedCount: number;
        }
      }>('/api/fix-order-1555', {
        method: 'POST'
      });

      setResult(response);
      toast({
        title: "Reparatie voltooid",
        description: `${response.details?.archivedCount || 0} dubbele items gearchiveerd`,
        variant: "default",
      });
    } catch (err) {
      console.error('Error fixing order:', err);
      setError(err instanceof Error ? err.message : 'Onbekende fout');
      toast({
        title: "Fout bij repareren",
        description: err instanceof Error ? err.message : 'Onbekende fout',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order #1555 Reparatie</h1>
        <Link href="/">
          <Button variant="outline">Terug naar dashboard</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order SW-1555 Reparatie Tool</CardTitle>
          <CardDescription>
            Deze pagina bevat een tool om de dubbele items in order #1555 te archiveren.
            Het script zal voor elk item met dezelfde shopify_line_item_id slechts één item actief houden 
            en de rest als gearchiveerd markeren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Klik op de knop hieronder om de reparatie uit te voeren. Deze actie kan niet ongedaan worden gemaakt.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={executeOrderFix} 
              disabled={isLoading}
              variant="destructive"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met repareren...
                </>
              ) : (
                'Order #1555 repareren'
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Dit script vindt items met dezelfde shopify_line_item_id en markeert alle behalve 
            het item met de laagste ID als gearchiveerd.
          </p>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fout opgetreden</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Reparatie voltooid</AlertTitle>
          <AlertDescription>
            <div>
              <p>Order SW-1555 reparatie is succesvol uitgevoerd.</p>
              <ul className="list-disc pl-5 mt-2">
                <li>{result.details?.archivedCount || 0} dubbele items gearchiveerd</li>
                <li>Order heeft nu {result.details?.totalItemsRemaining || 0} actieve items</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}