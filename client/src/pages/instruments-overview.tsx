import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Filter, RefreshCw, Search, Clipboard, MusicNote, ArrowRight, ChevronRight } from "lucide-react";

// Optioneel: Utility functie om data te exporteren als CSV
const exportToCSV = (data: any[], filename: string) => {
  // Genereer kolommen vanuit eerste rij
  const headers = Object.keys(data[0] || {}).join(',');
  
  // Map data naar CSV rijen
  const csvRows = data.map(row => 
    Object.values(row)
      .map(value => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  );
  
  // Voeg headers toe
  const csvString = [headers, ...csvRows].join('\n');
  
  // Creëer download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Instrument type definitie
interface Instrument {
  id: number;
  serialNumber: string;
  orderId: number;
  itemType: string;
  status: string;
  specifications: any;
  isArchived: boolean;
  orderNumber?: string;
  orderInfo?: string;
  tuning?: string;
  frequency?: string;
  customer?: string;
}

export default function InstrumentsOverview() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tuningFilter, setTuningFilter] = useState<string | null>(null);
  const [frequencyFilter, setFrequencyFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('cards');
  
  const commonFilters = [
    { label: 'A3', value: 'A3', tuning: true },
    { label: 'C3', value: 'C3', tuning: true },
    { label: 'D3', value: 'D3', tuning: true },
    { label: 'Am3', value: 'Am3', tuning: true },
    { label: 'Cm3', value: 'Cm3', tuning: true },
    { label: '432Hz', value: '432', frequency: true },
    { label: '440Hz', value: '440', frequency: true },
    { label: 'Innato', value: 'Innato', type: true },
    { label: 'Natey', value: 'Natey', type: true },
    { label: 'ZEN', value: 'ZEN', type: true },
  ];
  
  // Haal alle instrumenten op
  const { data: instrumentsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/order-items-full'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/order-items-full');
        
        if (!response.ok) {
          throw new Error('Kon instrumenten niet ophalen');
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Fout bij ophalen instrumenten:', error);
        toast({
          title: 'Fout bij ophalen instrumenten',
          description: 'Probeer het later opnieuw.',
          variant: 'destructive'
        });
        return [];
      }
    }
  });
  
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  
  // Update de gefilterde instrumenten wanneer data of filters veranderen
  useEffect(() => {
    if (!instrumentsData) return;
    
    // Begin met alle instrumenten
    let filtered = [...instrumentsData];
    
    // Zoekopdracht toepassen
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(instrument => 
        instrument.serialNumber?.toLowerCase().includes(term) ||
        instrument.itemType?.toLowerCase().includes(term) ||
        instrument.customer?.toLowerCase().includes(term) ||
        instrument.orderNumber?.toLowerCase().includes(term) ||
        JSON.stringify(instrument.specifications)?.toLowerCase().includes(term)
      );
    }
    
    // Tuning filter toepassen
    if (tuningFilter) {
      filtered = filtered.filter(instrument => {
        // Controleer specificaties voor tuning
        const tuning = instrument.specifications?.tuning || instrument.tuning || '';
        return tuning.toLowerCase().includes(tuningFilter.toLowerCase());
      });
    }
    
    // Frequency filter toepassen
    if (frequencyFilter) {
      filtered = filtered.filter(instrument => {
        // Controleer specificaties voor frequency
        const frequency = instrument.specifications?.frequency || instrument.frequency || '';
        return String(frequency).includes(frequencyFilter);
      });
    }
    
    // Type filter toepassen
    if (typeFilter) {
      filtered = filtered.filter(instrument => {
        return instrument.itemType?.toLowerCase().includes(typeFilter.toLowerCase());
      });
    }
    
    setInstruments(filtered);
  }, [instrumentsData, searchTerm, tuningFilter, frequencyFilter, typeFilter]);
  
  // Toon de instrumenten die voor 1542-42 en 1542-43 staan
  const problematicSerialNumbers = ['SW-1542-42', 'SW-1542-43'];
  const problematicInstruments = instruments.filter(
    instrument => problematicSerialNumbers.includes(instrument.serialNumber)
  );
  
  const clearFilters = () => {
    setSearchTerm('');
    setTuningFilter(null);
    setFrequencyFilter(null);
    setTypeFilter(null);
  };
  
  const applyFilter = (filter: any) => {
    if (filter.tuning) {
      setTuningFilter(filter.value);
      setFrequencyFilter(null);
      setTypeFilter(null);
    } else if (filter.frequency) {
      setFrequencyFilter(filter.value);
      setTuningFilter(null);
      setTypeFilter(null);
    } else if (filter.type) {
      setTypeFilter(filter.value);
      setTuningFilter(null);
      setFrequencyFilter(null);
    }
  };
  
  // Groepeer instrumenten per order voor kaartweergave
  const instrumentsByOrder = instruments.reduce((acc, instrument) => {
    const orderId = instrument.orderId;
    if (!acc[orderId]) {
      acc[orderId] = [];
    }
    acc[orderId].push(instrument);
    return acc;
  }, {} as Record<number, Instrument[]>);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Instrumenten Overzicht</h1>
          <p className="text-muted-foreground">Bekijk en filter alle instrumenten in het systeem</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            Vernieuwen
          </Button>
          <Button 
            onClick={() => exportToCSV(instruments, 'instrumenten-export.csv')}
            variant="outline" 
            className="flex items-center gap-1"
          >
            <Clipboard className="h-4 w-4" />
            Exporteren
          </Button>
        </div>
      </div>

      {problematicInstruments.length > 0 && (
        <Card className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 flex items-center gap-2">
              <MusicNote className="h-5 w-5" />
              Instrumenten 1542-42 en 1542-43 (A3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {problematicInstruments.map(instrument => (
                <div key={instrument.id} className="p-4 rounded-md bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-lg">{instrument.serialNumber}</span>
                      <Badge className="ml-2" variant={instrument.isArchived ? "destructive" : "default"}>
                        {instrument.isArchived ? 'Gearchiveerd' : instrument.status}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      A3
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div><span className="font-medium">Type:</span> {instrument.itemType}</div>
                    <div><span className="font-medium">Order:</span> {instrument.orderNumber}</div>
                    <div><span className="font-medium">Freq:</span> {instrument.specifications?.frequency || '?'}</div>
                    <div><span className="font-medium">Klant:</span> {instrument.customer || 'Onbekend'}</div>
                  </div>
                  <div className="mt-auto pt-2">
                    <Link href={`/orders/${instrument.orderId}`}>
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1">
                        <span>Bekijk Order</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Zoeken & Filteren</CardTitle>
          <CardDescription>
            Zoek op serienummer, type, klant of specificaties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Zoek op serienummer, type, of klantnaam..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-1 items-center">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="mr-1 h-4 w-4" />
                  Wis filters
                </Button>
                <div className="ml-2">
                  <Badge variant={displayMode === 'cards' ? 'default' : 'outline'} 
                         className="mr-1 cursor-pointer hover:opacity-80"
                         onClick={() => setDisplayMode('cards')}>
                    Kaarten
                  </Badge>
                  <Badge variant={displayMode === 'table' ? 'default' : 'outline'} 
                         className="cursor-pointer hover:opacity-80"
                         onClick={() => setDisplayMode('table')}>
                    Tabel
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {commonFilters.map((filter) => (
                <Badge 
                  key={filter.value} 
                  variant={(filter.tuning && tuningFilter === filter.value) || 
                          (filter.frequency && frequencyFilter === filter.value) ||
                          (filter.type && typeFilter === filter.value) ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => applyFilter(filter)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardContent className="pt-6">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Resultaten
              <Badge variant="outline" className="ml-2">{instruments.length}</Badge>
            </h3>
            {isLoading && <p className="text-sm text-muted-foreground">Laden...</p>}
          </div>
          
          {displayMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Instrumenten per order weergeven */}
              {Object.entries(instrumentsByOrder).map(([orderId, orderInstruments]) => {
                const firstInstrument = orderInstruments[0];
                return (
                  <Card key={orderId} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">
                          {firstInstrument.orderNumber}
                        </CardTitle>
                        <Badge variant="outline">
                          {orderInstruments.length} items
                        </Badge>
                      </div>
                      <CardDescription>
                        {firstInstrument.customer || 'Onbekende klant'}
                      </CardDescription>
                    </CardHeader>
                    <ScrollArea className="h-[180px]">
                      <CardContent>
                        <div className="space-y-2">
                          {orderInstruments.map(instrument => (
                            <div key={instrument.id} className="p-2 rounded border bg-background flex justify-between items-center">
                              <div>
                                <div className="font-medium">{instrument.serialNumber}</div>
                                <div className="text-sm text-muted-foreground truncate max-w-[180px]">{instrument.itemType}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={instrument.isArchived ? "destructive" : "default"}>
                                  {instrument.isArchived ? 'Gearchiveerd' : instrument.status}
                                </Badge>
                                {instrument.specifications?.tuning && (
                                  <Badge variant="outline" className="text-xs">
                                    {instrument.specifications.tuning}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </ScrollArea>
                    <CardFooter className="pt-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/orders/${orderId}`}>
                          <span className="flex items-center justify-center">
                            Bekijk Order
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-2 px-4 text-left font-medium">Serienummer</th>
                      <th className="py-2 px-4 text-left font-medium">Type</th>
                      <th className="py-2 px-4 text-left font-medium">Order</th>
                      <th className="py-2 px-4 text-left font-medium">Status</th>
                      <th className="py-2 px-4 text-left font-medium">Tuning</th>
                      <th className="py-2 px-4 text-left font-medium">Freq</th>
                      <th className="py-2 px-4 text-left font-medium">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instruments.map((instrument) => (
                      <tr key={instrument.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">
                          <span className={instrument.isArchived ? "line-through opacity-70" : ""}>
                            {instrument.serialNumber}
                          </span>
                        </td>
                        <td className="py-2 px-4 max-w-[200px] truncate">{instrument.itemType}</td>
                        <td className="py-2 px-4">{instrument.orderNumber}</td>
                        <td className="py-2 px-4">
                          <Badge variant={instrument.isArchived ? "destructive" : "default"}>
                            {instrument.isArchived ? 'Gearchiveerd' : instrument.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-4">{instrument.specifications?.tuning || '-'}</td>
                        <td className="py-2 px-4">{instrument.specifications?.frequency || '-'}</td>
                        <td className="py-2 px-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/orders/${instrument.orderId}`}>
                              <span>Bekijk</span>
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {instruments.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">Geen instrumenten gevonden die voldoen aan de filters.</div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Wis filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}