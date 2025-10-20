import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, Edit, FileEdit, Loader2, Plus, RefreshCw, Trash2, 
  MusicIcon, PackageIcon, Calendar, Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

// Define initial material form state
const initialMaterialForm = {
  materialName: "",
  materialType: "bag",
  bagType: "",
  size: "",
  quantity: 0,
  reorderPoint: 5,
  ordered: 0,
  notes: ""
};

// Define initial instrument form state
const initialInstrumentForm = {
  serialNumber: "",
  instrumentType: "INNATO",
  tuningType: "",
  color: "",
  dateProduced: "",
  status: "available",
  location: "",
  craftsperson: "",
  notes: "",
  price: 0
};

// Material Inventory Page
export default function StockPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState("bags");
  
  // Materials state
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isEditMaterialOpen, setIsEditMaterialOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);
  
  // Instruments state
  const [isAddInstrumentOpen, setIsAddInstrumentOpen] = useState(false);
  const [isEditInstrumentOpen, setIsEditInstrumentOpen] = useState(false);
  const [currentInstrument, setCurrentInstrument] = useState<any>(null);
  const [instrumentForm, setInstrumentForm] = useState(initialInstrumentForm);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all materials
  const materialsQuery = useQuery({
    queryKey: ['/api/materials'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    onError: (error: any) => {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error loading materials",
        description: "Could not load inventory materials. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Fetch all molds for bag and box types/sizes
  const moldsQuery = useQuery({
    queryKey: ['/api/molds'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    onError: (error: any) => {
      console.error("Error fetching molds:", error);
      toast({
        title: "Error loading mold data",
        description: "Could not load mold data for bag/box options. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add material");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Material added",
        description: "New material has been added to inventory.",
      });
      setIsAddMaterialOpen(false);
      setMaterialForm(initialMaterialForm);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add material. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update material");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Material updated",
        description: "Material has been updated successfully.",
      });
      setIsEditMaterialOpen(false);
      setCurrentMaterial(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update material. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete material");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Material deleted",
        description: "Material has been removed from inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Filter materials by type
  const getBagItems = () => {
    if (!Array.isArray(materialsQuery.data)) return [];
    return materialsQuery.data.filter(item => item.materialType === 'bag');
  };
  
  const getBoxItems = () => {
    if (!Array.isArray(materialsQuery.data)) return [];
    return materialsQuery.data.filter(item => item.materialType === 'box');
  };
  
  // Handle form input changes for materials
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    if (['quantity', 'reorderPoint', 'ordered'].includes(name)) {
      setMaterialForm({
        ...materialForm,
        [name]: parseInt(value) || 0
      });
    } else {
      setMaterialForm({
        ...materialForm,
        [name]: value
      });
    }
  };
  
  // Handle select changes for materials
  const handleSelectChange = (name: string, value: string) => {
    setMaterialForm({
      ...materialForm,
      [name]: value
    });
  };
  
  // Handle form input changes for instruments
  const handleInstrumentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    if (['price'].includes(name)) {
      setInstrumentForm({
        ...instrumentForm,
        [name]: parseFloat(value) || 0
      });
    } else {
      setInstrumentForm({
        ...instrumentForm,
        [name]: value
      });
    }
  };
  
  // Handle select changes for instruments
  const handleInstrumentSelectChange = (name: string, value: string) => {
    setInstrumentForm({
      ...instrumentForm,
      [name]: value
    });
  };
  
  // Add material
  const handleAddMaterial = () => {
    setMaterialForm(initialMaterialForm);
    setIsAddMaterialOpen(true);
  };
  
  // Edit material
  const handleEditMaterial = (material: any) => {
    setCurrentMaterial(material);
    setMaterialForm({
      materialName: material.materialName || "",
      materialType: material.materialType || "bag",
      bagType: material.bagType || "",
      size: material.size || "",
      quantity: material.quantity || 0,
      reorderPoint: material.reorderPoint || 5,
      ordered: material.ordered || 0,
      notes: material.notes || ""
    });
    setIsEditMaterialOpen(true);
  };
  
  // Delete material
  const handleDeleteMaterial = (id: number) => {
    if (window.confirm("Are you sure you want to delete this material? This cannot be undone.")) {
      deleteMaterialMutation.mutate(id);
    }
  };
  
  // Submit add material form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate material name based on selected options
    const formData = { ...materialForm };
    
    if (formData.materialType === 'bag') {
      // Generate name like "Innato Bag S" or "Double Bag L"
      formData.materialName = `${formData.bagType || ''} Bag ${formData.size || ''}`.trim();
    } else if (formData.materialType === 'box') {
      // Generate name like "Box 30x30x30"
      formData.materialName = `Box ${formData.size || ''}`.trim();
    }
    
    createMaterialMutation.mutate(formData);
  };
  
  // Submit edit material form
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMaterial && currentMaterial.id) {
      // Auto-generate material name based on selected options
      const formData = { ...materialForm };
      
      if (formData.materialType === 'bag') {
        // Generate name like "Innato Bag S" or "Double Bag L"
        formData.materialName = `${formData.bagType || ''} Bag ${formData.size || ''}`.trim();
      } else if (formData.materialType === 'box') {
        // Generate name like "Box 30x30x30"
        formData.materialName = `Box ${formData.size || ''}`.trim();
      }
      
      updateMaterialMutation.mutate({
        id: currentMaterial.id,
        data: formData
      });
    }
  };
  
  // Calculate if an item is low on stock
  const isLowStock = (item: any) => {
    return item.quantity <= (item.reorderPoint || 0);
  };
  
  // Instruments query
  const instrumentsQuery = useQuery({
    queryKey: ['/api/instruments'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    onError: (error: any) => {
      console.error("Error fetching instruments:", error);
      toast({
        title: "Error loading instruments",
        description: "Could not load instrument inventory. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Create instrument mutation
  const createInstrumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/instruments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add instrument");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instruments'] });
      toast({
        title: "Instrument added",
        description: "New instrument has been added to inventory.",
      });
      setIsAddInstrumentOpen(false);
      setInstrumentForm(initialInstrumentForm);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add instrument. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Update instrument mutation
  const updateInstrumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/instruments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update instrument");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instruments'] });
      toast({
        title: "Instrument updated",
        description: "Instrument has been updated successfully.",
      });
      setIsEditInstrumentOpen(false);
      setCurrentInstrument(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update instrument. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Delete instrument mutation
  const deleteInstrumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/instruments/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete instrument");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instruments'] });
      toast({
        title: "Instrument deleted",
        description: "Instrument has been removed from inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete instrument. Please try again.",
        variant: "destructive",
      });
    }
  });
  

  
  // Add instrument
  const handleAddInstrument = () => {
    setInstrumentForm(initialInstrumentForm);
    setIsAddInstrumentOpen(true);
  };
  
  // Edit instrument
  const handleEditInstrument = (instrument: any) => {
    setCurrentInstrument(instrument);
    setInstrumentForm({
      serialNumber: instrument.serialNumber || "",
      instrumentType: instrument.instrumentType || "INNATO",
      tuningType: instrument.tuningType || "",
      color: instrument.color || "",
      dateProduced: instrument.dateProduced ? format(new Date(instrument.dateProduced), 'yyyy-MM-dd') : "",
      status: instrument.status || "available",
      location: instrument.location || "",
      craftsperson: instrument.craftsperson || "",
      notes: instrument.notes || "",
      price: instrument.price || 0
    });
    setIsEditInstrumentOpen(true);
  };
  
  // Delete instrument
  const handleDeleteInstrument = (id: number) => {
    if (window.confirm("Are you sure you want to delete this instrument? This cannot be undone.")) {
      deleteInstrumentMutation.mutate(id);
    }
  };
  
  // Submit add instrument form
  const handleAddInstrumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Format date if present
    const formData = {...instrumentForm};
    if (formData.dateProduced) {
      try {
        formData.dateProduced = new Date(formData.dateProduced).toISOString();
      } catch (e) {
        console.error("Invalid date format:", e);
        formData.dateProduced = null;
      }
    }
    createInstrumentMutation.mutate(formData);
  };
  
  // Submit edit instrument form
  const handleEditInstrumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInstrument && currentInstrument.id) {
      // Format date if present
      const formData = {...instrumentForm};
      if (formData.dateProduced) {
        try {
          formData.dateProduced = new Date(formData.dateProduced).toISOString();
        } catch (e) {
          console.error("Invalid date format:", e);
          formData.dateProduced = null;
        }
      }
      updateInstrumentMutation.mutate({
        id: currentInstrument.id,
        data: formData
      });
    }
  };
  
  // Refresh data
  const handleRefresh = () => {
    materialsQuery.refetch();
    instrumentsQuery.refetch();
  };
  
  // Check if there are any low stock items
  const hasLowStockItems = () => {
    if (!Array.isArray(materialsQuery.data)) return false;
    return materialsQuery.data.some(isLowStock);
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1F5B61]">Inventory Management</h1>
          <Button variant="outline" onClick={handleRefresh} disabled={materialsQuery.isFetching}>
            {materialsQuery.isFetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
        
        {/* Error message */}
        {materialsQuery.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load inventory data. Please refresh or try again later.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Low stock warning */}
        {!materialsQuery.isLoading && !materialsQuery.isError && hasLowStockItems() && (
          <Alert>
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Low Stock Warning</AlertTitle>
            <AlertDescription>
              Some materials are running low. Please check the inventory and reorder as needed.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Inventory Tabs */}
        <Tabs defaultValue="bags" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="bags">Bags</TabsTrigger>
              <TabsTrigger value="boxes">Boxes</TabsTrigger>
              <TabsTrigger value="instruments">Instruments</TabsTrigger>
            </TabsList>
            <div className="space-x-2">
              {(activeTab === 'bags' || activeTab === 'boxes') && (
                <Button size="sm" onClick={handleAddMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              )}
              {activeTab === 'instruments' && (
                <Button size="sm" onClick={handleAddInstrument}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instrument
                </Button>
              )}
            </div>
          </div>
          
          {/* Bags Tab */}
          <TabsContent value="bags">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Bag Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {materialsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-[#1F5B61]">
                        <TableRow>
                          <TableHead className="text-white">Name</TableHead>
                          <TableHead className="text-white">Type</TableHead>
                          <TableHead className="text-white">Size</TableHead>
                          <TableHead className="text-white">Quantity</TableHead>
                          <TableHead className="text-white">Reorder Point</TableHead>
                          <TableHead className="text-white">On Order</TableHead>
                          <TableHead className="text-white">Notes</TableHead>
                          <TableHead className="text-white text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getBagItems().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No bags in inventory. Click "Add Material" to add one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          getBagItems().map((item) => (
                            <TableRow key={item.id} className={isLowStock(item) ? 'bg-red-50' : ''}>
                              <TableCell className="font-medium">{item.materialName}</TableCell>
                              <TableCell>{item.bagType || '-'}</TableCell>
                              <TableCell>{item.size}</TableCell>
                              <TableCell 
                                className={isLowStock(item) ? 'text-red-600 font-semibold' : ''}
                              >
                                {item.quantity}
                              </TableCell>
                              <TableCell>{item.reorderPoint || '-'}</TableCell>
                              <TableCell>{item.ordered || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {item.notes || '-'}
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditMaterial(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteMaterial(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Boxes Tab */}
          <TabsContent value="boxes">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Box Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {materialsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-[#C26E50]">
                        <TableRow>
                          <TableHead className="text-white">Name</TableHead>
                          <TableHead className="text-white">Size</TableHead>
                          <TableHead className="text-white">Quantity</TableHead>
                          <TableHead className="text-white">Reorder Point</TableHead>
                          <TableHead className="text-white">On Order</TableHead>
                          <TableHead className="text-white">Notes</TableHead>
                          <TableHead className="text-white text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getBoxItems().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No boxes in inventory. Click "Add Material" to add one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          getBoxItems().map((item) => (
                            <TableRow key={item.id} className={isLowStock(item) ? 'bg-red-50' : ''}>
                              <TableCell className="font-medium">{item.materialName}</TableCell>
                              <TableCell>{item.size}</TableCell>
                              <TableCell 
                                className={isLowStock(item) ? 'text-red-600 font-semibold' : ''}
                              >
                                {item.quantity}
                              </TableCell>
                              <TableCell>{item.reorderPoint || '-'}</TableCell>
                              <TableCell>{item.ordered || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {item.notes || '-'}
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditMaterial(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteMaterial(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Instruments Tab */}
          <TabsContent value="instruments">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Instrument Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {instrumentsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : instrumentsQuery.isError ? (
                  <div className="text-center py-4 text-destructive">
                    Error loading instruments: {instrumentsQuery.error?.message || "Unknown error"}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-[#1F5B61]">
                        <TableRow>
                          <TableHead className="text-white">Serial #</TableHead>
                          <TableHead className="text-white">Type</TableHead>
                          <TableHead className="text-white">Tuning</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Craftsperson</TableHead>
                          <TableHead className="text-white">Location</TableHead>
                          <TableHead className="text-white">Price (€)</TableHead>
                          <TableHead className="text-white text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!Array.isArray(instrumentsQuery.data) || instrumentsQuery.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No instruments in inventory. Click "Add Instrument" to add one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          instrumentsQuery.data.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.serialNumber}</TableCell>
                              <TableCell>{item.instrumentType}</TableCell>
                              <TableCell>{item.tuningType || '-'}</TableCell>
                              <TableCell>
                                {item.status === 'available' && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                )}
                                {item.status === 'reserved' && (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                )}
                                {item.status === 'sold' && (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                )}
                                {item.status === 'damaged' && (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                )}
                                {!['available', 'reserved', 'sold', 'damaged'].includes(item.status) && (
                                  <Badge>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{item.craftsperson || '-'}</TableCell>
                              <TableCell>{item.location || '-'}</TableCell>
                              <TableCell>{item.price ? `€${item.price.toFixed(2)}` : '-'}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditInstrument(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteInstrument(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Add Material Dialog */}
        <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>
                Add a new bag or box to the inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                {/* Hidden field - name will be auto-generated */}
                <input type="hidden" name="materialName" value={materialForm.materialName} />
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="materialType" className="text-right">
                    Type
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={materialForm.materialType} 
                      onValueChange={(value) => handleSelectChange('materialType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {materialForm.materialType === 'bag' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bagType" className="text-right">
                      Bag Type
                    </Label>
                    <div className="col-span-3">
                      <Select 
                        value={materialForm.bagType || ''} 
                        onValueChange={(value) => handleSelectChange('bagType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bag type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Innato">Innato</SelectItem>
                          <SelectItem value="Natey">Natey</SelectItem>
                          <SelectItem value="ZEN">ZEN</SelectItem>
                          <SelectItem value="Double">Double</SelectItem>
                          <SelectItem value="OvA">OvA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="size" className="text-right">
                    Size
                  </Label>
                  <div className="col-span-3">
                    {materialForm.materialType === 'bag' ? (
                      <Select 
                        value={materialForm.size} 
                        onValueChange={(value) => handleSelectChange('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                          <SelectItem value="Bagpack">Bagpack</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select 
                        value={materialForm.size} 
                        onValueChange={(value) => handleSelectChange('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select box size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15x15x15">15x15x15</SelectItem>
                          <SelectItem value="20x20x20">20x20x20</SelectItem>
                          <SelectItem value="30x12x12">30x12x12</SelectItem>
                          <SelectItem value="30x30x30">30x30x30</SelectItem>
                          <SelectItem value="35x35x30">35x35x30</SelectItem>
                          <SelectItem value="35x35x35">35x35x35</SelectItem>
                          <SelectItem value="40x40x40">40x40x40</SelectItem>
                          <SelectItem value="40x40x40 (2)">40x40x40 (2)</SelectItem>
                          <SelectItem value="50x50x50">50x50x50</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantity
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      placeholder="Current quantity"
                      value={materialForm.quantity}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reorderPoint" className="text-right">
                    Reorder Point
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="reorderPoint"
                      name="reorderPoint"
                      type="number"
                      placeholder="Reorder when quantity reaches"
                      value={materialForm.reorderPoint}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ordered" className="text-right">
                    On Order
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="ordered"
                      name="ordered"
                      type="number"
                      placeholder="Quantity on order"
                      value={materialForm.ordered}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Additional notes"
                      value={materialForm.notes || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddMaterialOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMaterialMutation.isPending}
                >
                  {createMaterialMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Material
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Material Dialog */}
        <Dialog open={isEditMaterialOpen} onOpenChange={setIsEditMaterialOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
              <DialogDescription>
                Update material information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="materialType" className="text-right">
                    Type
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={materialForm.materialType} 
                      onValueChange={(value) => handleSelectChange('materialType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="materialName" className="text-right">
                    Name
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="materialName"
                      name="materialName"
                      placeholder="Material name"
                      value={materialForm.materialName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                {materialForm.materialType === 'bag' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bagType" className="text-right">
                      Bag Type
                    </Label>
                    <div className="col-span-3">
                      <Select 
                        value={materialForm.bagType || ''} 
                        onValueChange={(value) => handleSelectChange('bagType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bag type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Innato">Innato</SelectItem>
                          <SelectItem value="Natey">Natey</SelectItem>
                          <SelectItem value="ZEN">ZEN</SelectItem>
                          <SelectItem value="Double">Double</SelectItem>
                          <SelectItem value="OvA">OvA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="size" className="text-right">
                    Size
                  </Label>
                  <div className="col-span-3">
                    {materialForm.materialType === 'bag' ? (
                      <Select 
                        value={materialForm.size} 
                        onValueChange={(value) => handleSelectChange('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                          <SelectItem value="Bagpack">Bagpack</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select 
                        value={materialForm.size} 
                        onValueChange={(value) => handleSelectChange('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select box size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15x15x15">15x15x15</SelectItem>
                          <SelectItem value="20x20x20">20x20x20</SelectItem>
                          <SelectItem value="30x12x12">30x12x12</SelectItem>
                          <SelectItem value="30x30x30">30x30x30</SelectItem>
                          <SelectItem value="35x35x30">35x35x30</SelectItem>
                          <SelectItem value="35x35x35">35x35x35</SelectItem>
                          <SelectItem value="40x40x40">40x40x40</SelectItem>
                          <SelectItem value="40x40x40 (2)">40x40x40 (2)</SelectItem>
                          <SelectItem value="50x50x50">50x50x50</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantity
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      placeholder="Current quantity"
                      value={materialForm.quantity}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reorderPoint" className="text-right">
                    Reorder Point
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="reorderPoint"
                      name="reorderPoint"
                      type="number"
                      placeholder="Reorder when quantity reaches"
                      value={materialForm.reorderPoint || ''}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ordered" className="text-right">
                    On Order
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="ordered"
                      name="ordered"
                      type="number"
                      placeholder="Quantity on order"
                      value={materialForm.ordered || ''}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Additional notes"
                      value={materialForm.notes || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditMaterialOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMaterialMutation.isPending}
                >
                  {updateMaterialMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Material
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Add Instrument Dialog */}
        <Dialog open={isAddInstrumentOpen} onOpenChange={setIsAddInstrumentOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Instrument</DialogTitle>
              <DialogDescription>
                Add a new instrument to the inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddInstrumentSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serialNumber" className="text-right">
                    Serial #
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      placeholder="Serial Number"
                      value={instrumentForm.serialNumber}
                      onChange={handleInstrumentInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="instrumentType" className="text-right">
                    Type
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={instrumentForm.instrumentType} 
                      onValueChange={(value) => handleInstrumentSelectChange('instrumentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select instrument type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INNATO">INNATO</SelectItem>
                        <SelectItem value="NATEY">NATEY</SelectItem>
                        <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                        <SelectItem value="ZEN">ZEN</SelectItem>
                        <SelectItem value="OvA">OvA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tuningType" className="text-right">
                    Tuning
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="tuningType"
                      name="tuningType"
                      placeholder="Tuning"
                      value={instrumentForm.tuningType}
                      onChange={handleInstrumentInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={instrumentForm.status} 
                      onValueChange={(value) => handleInstrumentSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="craftsperson" className="text-right">
                    Craftsperson
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="craftsperson"
                      name="craftsperson"
                      placeholder="Craftsperson"
                      value={instrumentForm.craftsperson}
                      onChange={handleInstrumentInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="location"
                      name="location"
                      placeholder="Location"
                      value={instrumentForm.location}
                      onChange={handleInstrumentInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price (€)
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="Price"
                      value={instrumentForm.price.toString()}
                      onChange={handleInstrumentInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddInstrumentOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createInstrumentMutation.isPending}>
                  {createInstrumentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Instrument Dialog */}
        <Dialog open={isEditInstrumentOpen} onOpenChange={setIsEditInstrumentOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Instrument</DialogTitle>
              <DialogDescription>
                Update the instrument inventory information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditInstrumentSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serialNumber" className="text-right">
                    Serial #
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      placeholder="Serial Number"
                      value={instrumentForm.serialNumber}
                      onChange={handleInstrumentInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="instrumentType" className="text-right">
                    Type
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={instrumentForm.instrumentType} 
                      onValueChange={(value) => handleInstrumentSelectChange('instrumentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select instrument type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INNATO">INNATO</SelectItem>
                        <SelectItem value="NATEY">NATEY</SelectItem>
                        <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                        <SelectItem value="ZEN">ZEN</SelectItem>
                        <SelectItem value="OvA">OvA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tuningType" className="text-right">
                    Tuning
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="tuningType"
                      name="tuningType"
                      placeholder="Tuning"
                      value={instrumentForm.tuningType}
                      onChange={handleInstrumentInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={instrumentForm.status} 
                      onValueChange={(value) => handleInstrumentSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="craftsperson" className="text-right">
                    Craftsperson
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="craftsperson"
                      name="craftsperson"
                      placeholder="Craftsperson"
                      value={instrumentForm.craftsperson}
                      onChange={handleInstrumentInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="location"
                      name="location"
                      placeholder="Location"
                      value={instrumentForm.location}
                      onChange={handleInstrumentInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price (€)
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="Price"
                      value={instrumentForm.price.toString()}
                      onChange={handleInstrumentInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditInstrumentOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateInstrumentMutation.isPending}>
                  {updateInstrumentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}