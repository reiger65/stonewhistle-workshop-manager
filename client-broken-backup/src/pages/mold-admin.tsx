import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash, Plus, Search, RotateCcw, Save, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";

// Mold schema
const moldSchema = z.object({
  name: z.string().min(1, "Mold name is required"),
  size: z.string().optional(),
  instrumentType: z.string().min(1, "Instrument type is required"),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

// Mold mapping schema
const moldMappingSchema = z.object({
  name: z.string().min(1, "Mapping name is required"),
  instrumentType: z.string().min(1, "Instrument type is required"),
  tuningNote: z.string().min(1, "Tuning note is required"),
  isActive: z.boolean().default(true),
});

// Box schema
const boxSchema = z.object({
  materialName: z.string().min(1, "Box name is required"),
  materialType: z.string().default("box"),
  size: z.string().min(1, "Size is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  reorderPoint: z.number().min(0, "Reorder point must be 0 or greater"),
  notes: z.string().optional(),
});

// Bag schema
const bagSchema = z.object({
  materialName: z.string().min(1, "Bag name is required"),
  materialType: z.string().default("bag"),
  bagType: z.string().min(1, "Bag type is required"),
  size: z.string().min(1, "Size is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  reorderPoint: z.number().min(0, "Reorder point must be 0 or greater"),
  notes: z.string().optional(),
});

type Mold = z.infer<typeof moldSchema> & { id: number };
type MoldMapping = z.infer<typeof moldMappingSchema> & { id: number };
type Box = z.infer<typeof boxSchema> & { id: number };
type Bag = z.infer<typeof bagSchema> & { id: number };

export default function MoldAdmin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("molds");
  const [editingMold, setEditingMold] = useState<Mold | null>(null);
  const [editingMapping, setEditingMapping] = useState<MoldMapping | null>(null);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [editingBag, setEditingBag] = useState<Bag | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mold form
  const moldForm = useForm<z.infer<typeof moldSchema>>({
    resolver: zodResolver(moldSchema),
    defaultValues: {
      name: "",
      size: "",
      instrumentType: "",
      isActive: true,
      notes: "",
    },
  });

  // Mold mapping form
  const mappingForm = useForm<z.infer<typeof moldMappingSchema>>({
    resolver: zodResolver(moldMappingSchema),
    defaultValues: {
      name: "",
      instrumentType: "",
      tuningNote: "",
      isActive: true,
    },
  });

  // Box form
  const boxForm = useForm<z.infer<typeof boxSchema>>({
    resolver: zodResolver(boxSchema),
    defaultValues: {
      materialName: "",
      materialType: "box",
      size: "",
      quantity: 0,
      reorderPoint: 5,
      notes: "",
    },
  });

  // Bag form
  const bagForm = useForm<z.infer<typeof bagSchema>>({
    resolver: zodResolver(bagSchema),
    defaultValues: {
      materialName: "",
      materialType: "bag",
      bagType: "",
      size: "",
      quantity: 0,
      reorderPoint: 5,
      notes: "",
    },
  });

  // Molds Query
  const { data: molds = [], isLoading: moldsLoading } = useQuery({
    queryKey: ['/api/molds'],
    refetchOnWindowFocus: false,
  });

  // Mold Mappings Query
  const { data: mappings = [], isLoading: mappingsLoading } = useQuery({
    queryKey: ['/api/mold-mappings'],
    refetchOnWindowFocus: false,
  });

  // Mold Mapping Items Query
  const { data: mappingItems = [], isLoading: mappingItemsLoading } = useQuery({
    queryKey: ['/api/mold-mappings/items', selectedMapping],
    enabled: !!selectedMapping,
    refetchOnWindowFocus: false,
  });

  // Materials Query (Bags and Boxes)
  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/materials'],
    refetchOnWindowFocus: false,
  });

  // Filter materials into bags and boxes
  const boxes = materials.filter(m => m.materialType === 'box');
  const bags = materials.filter(m => m.materialType === 'bag');

  // Create mold mutation
  const createMold = useMutation({
    mutationFn: (data: z.infer<typeof moldSchema>) => 
      apiRequest('/api/molds', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/molds'] });
      toast({
        title: "Success",
        description: "Mold created successfully",
      });
      resetMoldForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create mold: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Update mold mutation
  const updateMold = useMutation({
    mutationFn: ({ id, data }: { id: number, data: z.infer<typeof moldSchema> }) => 
      apiRequest(`/api/molds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/molds'] });
      toast({
        title: "Success",
        description: "Mold updated successfully",
      });
      resetMoldForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update mold: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Delete mold mutation
  const deleteMold = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/molds/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/molds'] });
      toast({
        title: "Success",
        description: "Mold deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete mold: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Create mapping mutation
  const createMapping = useMutation({
    mutationFn: (data: z.infer<typeof moldMappingSchema>) => 
      apiRequest('/api/mold-mappings', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mold-mappings'] });
      toast({
        title: "Success",
        description: "Mapping created successfully",
      });
      resetMappingForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create mapping: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Update mapping mutation
  const updateMapping = useMutation({
    mutationFn: ({ id, data }: { id: number, data: z.infer<typeof moldMappingSchema> }) => 
      apiRequest(`/api/mold-mappings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mold-mappings'] });
      toast({
        title: "Success",
        description: "Mapping updated successfully",
      });
      resetMappingForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update mapping: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Delete mapping mutation
  const deleteMapping = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/mold-mappings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mold-mappings'] });
      toast({
        title: "Success",
        description: "Mapping deleted successfully",
      });
      setSelectedMapping(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete mapping: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Add mold to mapping mutation
  const addMoldToMapping = useMutation({
    mutationFn: ({ mappingId, moldId }: { mappingId: number, moldId: number }) => 
      apiRequest(`/api/mold-mappings/${mappingId}/molds/${moldId}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mold-mappings/items', selectedMapping] });
      toast({
        title: "Success",
        description: "Mold added to mapping successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add mold to mapping: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Remove mold from mapping mutation
  const removeMoldFromMapping = useMutation({
    mutationFn: (mappingItemId: number) => 
      apiRequest(`/api/mold-mappings/items/${mappingItemId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mold-mappings/items', selectedMapping] });
      toast({
        title: "Success",
        description: "Mold removed from mapping successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove mold from mapping: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Create box mutation
  const createBox = useMutation({
    mutationFn: (data: z.infer<typeof boxSchema>) => 
      apiRequest('/api/materials', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Success",
        description: "Box created successfully",
      });
      resetBoxForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create box: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Update box mutation
  const updateBox = useMutation({
    mutationFn: ({ id, data }: { id: number, data: z.infer<typeof boxSchema> }) => 
      apiRequest(`/api/materials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Success",
        description: "Box updated successfully",
      });
      resetBoxForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update box: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Delete box mutation
  const deleteBox = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/materials/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Success",
        description: "Box deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete box: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Create bag mutation
  const createBag = useMutation({
    mutationFn: (data: z.infer<typeof bagSchema>) => 
      apiRequest('/api/materials', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Success",
        description: "Bag created successfully",
      });
      resetBagForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create bag: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Update bag mutation
  const updateBag = useMutation({
    mutationFn: ({ id, data }: { id: number, data: z.infer<typeof bagSchema> }) => 
      apiRequest(`/api/materials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Success",
        description: "Bag updated successfully",
      });
      resetBagForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update bag: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Delete bag mutation
  const deleteBag = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/materials/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Success",
        description: "Bag deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete bag: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (editingMold) {
      moldForm.reset({
        name: editingMold.name,
        size: editingMold.size || "",
        instrumentType: editingMold.instrumentType,
        isActive: editingMold.isActive,
        notes: editingMold.notes || "",
      });
    }
  }, [editingMold, moldForm]);

  useEffect(() => {
    if (editingMapping) {
      mappingForm.reset({
        name: editingMapping.name,
        instrumentType: editingMapping.instrumentType,
        tuningNote: editingMapping.tuningNote,
        isActive: editingMapping.isActive,
      });
    }
  }, [editingMapping, mappingForm]);

  useEffect(() => {
    if (editingBox) {
      boxForm.reset({
        materialName: editingBox.materialName,
        materialType: "box",
        size: editingBox.size,
        quantity: editingBox.quantity,
        reorderPoint: editingBox.reorderPoint,
        notes: editingBox.notes || "",
      });
    }
  }, [editingBox, boxForm]);

  useEffect(() => {
    if (editingBag) {
      bagForm.reset({
        materialName: editingBag.materialName,
        materialType: "bag",
        bagType: editingBag.bagType || "",
        size: editingBag.size,
        quantity: editingBag.quantity,
        reorderPoint: editingBag.reorderPoint,
        notes: editingBag.notes || "",
      });
    }
  }, [editingBag, bagForm]);

  // Reset forms
  const resetMoldForm = () => {
    moldForm.reset({
      name: "",
      size: "",
      instrumentType: "",
      isActive: true,
      notes: "",
    });
    setEditingMold(null);
  };

  const resetMappingForm = () => {
    mappingForm.reset({
      name: "",
      instrumentType: "",
      tuningNote: "",
      isActive: true,
    });
    setEditingMapping(null);
  };

  const resetBoxForm = () => {
    boxForm.reset({
      materialName: "",
      materialType: "box",
      size: "",
      quantity: 0,
      reorderPoint: 5,
      notes: "",
    });
    setEditingBox(null);
  };

  const resetBagForm = () => {
    bagForm.reset({
      materialName: "",
      materialType: "bag",
      bagType: "",
      size: "",
      quantity: 0,
      reorderPoint: 5,
      notes: "",
    });
    setEditingBag(null);
  };

  // Submit handlers
  const onSubmitMold = (data: z.infer<typeof moldSchema>) => {
    if (editingMold) {
      updateMold.mutate({ id: editingMold.id, data });
    } else {
      createMold.mutate(data);
    }
  };

  const onSubmitMapping = (data: z.infer<typeof moldMappingSchema>) => {
    if (editingMapping) {
      updateMapping.mutate({ id: editingMapping.id, data });
    } else {
      createMapping.mutate(data);
    }
  };

  const onSubmitBox = (data: z.infer<typeof boxSchema>) => {
    if (editingBox) {
      updateBox.mutate({ id: editingBox.id, data });
    } else {
      createBox.mutate(data);
    }
  };

  const onSubmitBag = (data: z.infer<typeof bagSchema>) => {
    if (editingBag) {
      updateBag.mutate({ id: editingBag.id, data });
    } else {
      createBag.mutate(data);
    }
  };

  // Filter molds based on search query
  const filteredMolds = molds.filter(mold => 
    mold.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mold.instrumentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (mold.notes && mold.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mold & Inventory Management</h1>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="molds">Molds</TabsTrigger>
          <TabsTrigger value="mappings">Tuning Mappings</TabsTrigger>
          <TabsTrigger value="boxes">Boxes</TabsTrigger>
          <TabsTrigger value="bags">Bags</TabsTrigger>
        </TabsList>

        {/* Molds Tab */}
        <TabsContent value="molds" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-1/3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search molds..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={resetMoldForm}
              variant="outline"
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> New Mold
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Mold Form */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{editingMold ? "Edit Mold" : "Add New Mold"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...moldForm}>
                  <form onSubmit={moldForm.handleSubmit(onSubmitMold)} className="space-y-4">
                    <FormField
                      control={moldForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Mold name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={moldForm.control}
                      name="instrumentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instrument Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select instrument type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="INNATO">INNATO</SelectItem>
                              <SelectItem value="NATEY">NATEY</SelectItem>
                              <SelectItem value="ZEN">ZEN</SelectItem>
                              <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                              <SelectItem value="OVA">OVA</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={moldForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <FormControl>
                            <Input placeholder="Size (e.g., 25cm)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={moldForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Notes (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={moldForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Inactive molds won't appear in tuning suggestions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={resetMoldForm}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#1F5B61] hover:bg-[#174349]">
                        {editingMold ? "Update Mold" : "Add Mold"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Mold List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Molds</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                  {moldsLoading ? (
                    <div>Loading molds...</div>
                  ) : filteredMolds.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No molds match your search" : "No molds found. Add your first mold."}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMolds.map((mold) => (
                        <div 
                          key={mold.id} 
                          className={`p-4 border rounded-lg flex justify-between items-center ${!mold.isActive ? 'bg-gray-50 opacity-70' : ''}`}
                        >
                          <div>
                            <div className="font-medium">{mold.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {mold.instrumentType}
                              {mold.size && `, Size: ${mold.size}`}
                            </div>
                            {mold.notes && (
                              <div className="text-sm mt-1">{mold.notes}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingMold(mold)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this mold?")) {
                                  deleteMold.mutate(mold.id);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Mapping List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Tuning Mappings</span>
                  <Button 
                    onClick={resetMappingForm}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" /> New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                  {mappingsLoading ? (
                    <div>Loading mappings...</div>
                  ) : mappings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No mappings found. Add your first mapping.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mappings.map((mapping) => (
                        <div 
                          key={mapping.id} 
                          className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer ${
                            selectedMapping === mapping.id ? 'border-[#1F5B61] bg-[#f0f7f8]' : ''
                          } ${!mapping.isActive ? 'bg-gray-50 opacity-70' : ''}`}
                          onClick={() => setSelectedMapping(mapping.id)}
                        >
                          <div>
                            <div className="font-medium">{mapping.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {mapping.instrumentType} - {mapping.tuningNote}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMapping(mapping);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this mapping? This will also remove all mold assignments.")) {
                                  deleteMapping.mutate(mapping.id);
                                }
                              }}
                            >
                              <Trash className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Mapping Form and Details */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {editingMapping ? "Edit Mapping" : 
                   selectedMapping ? "Mapping Details" : "Add New Mapping"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedMapping || editingMapping ? (
                  <Form {...mappingForm}>
                    <form onSubmit={mappingForm.handleSubmit(onSubmitMapping)} className="space-y-4">
                      <FormField
                        control={mappingForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Mapping name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mappingForm.control}
                        name="instrumentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instrument Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select instrument type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INNATO">INNATO</SelectItem>
                                <SelectItem value="NATEY">NATEY</SelectItem>
                                <SelectItem value="ZEN">ZEN</SelectItem>
                                <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                                <SelectItem value="OVA">OVA</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mappingForm.control}
                        name="tuningNote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tuning Note</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., C4, A3" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mappingForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>
                                Inactive mappings won't appear in tuning suggestions
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            resetMappingForm();
                            if (selectedMapping) setEditingMapping(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-[#1F5B61] hover:bg-[#174349]">
                          {editingMapping ? "Update Mapping" : "Add Mapping"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : selectedMapping ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Assigned Molds</h3>
                      {mappingItemsLoading ? (
                        <div>Loading mold assignments...</div>
                      ) : mappingItems.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground border rounded-md">
                          No molds assigned to this mapping yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {mappingItems.map((item) => (
                            <div 
                              key={item.id} 
                              className="p-3 border rounded-lg flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Size: {item.size || 'N/A'}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (confirm("Remove this mold from the mapping?")) {
                                    removeMoldFromMapping.mutate(item.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Add Mold to Mapping</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          onValueChange={(value) => {
                            const moldId = parseInt(value);
                            if (moldId && selectedMapping) {
                              addMoldToMapping.mutate({
                                mappingId: selectedMapping,
                                moldId,
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a mold to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {molds
                              .filter(mold => mold.isActive)
                              .filter(mold => {
                                // Filter out molds that are already assigned to this mapping
                                const mapping = mappings.find(m => m.id === selectedMapping);
                                if (!mapping) return true;
                                return mold.instrumentType === mapping.instrumentType && 
                                  !mappingItems.some(item => item.id === mold.id);
                              })
                              .map(mold => (
                                <SelectItem key={mold.id} value={mold.id.toString()}>
                                  {mold.name} ({mold.size || 'No size'})
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a mapping or create a new one
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Boxes Tab */}
        <TabsContent value="boxes" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Box Form */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{editingBox ? "Edit Box" : "Add New Box"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...boxForm}>
                  <form onSubmit={boxForm.handleSubmit(onSubmitBox)} className="space-y-4">
                    <FormField
                      control={boxForm.control}
                      name="materialName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Box name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={boxForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select box size" />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={boxForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Current quantity" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={boxForm.control}
                        name="reorderPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reorder Point</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Reorder when below" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={boxForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Notes (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={resetBoxForm}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#1F5B61] hover:bg-[#174349]">
                        {editingBox ? "Update Box" : "Add Box"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Box List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Boxes Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                  {materialsLoading ? (
                    <div>Loading boxes...</div>
                  ) : boxes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No boxes found. Add your first box.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {boxes.map((box) => (
                        <div 
                          key={box.id} 
                          className={`p-4 border rounded-lg flex justify-between items-center ${
                            box.quantity <= box.reorderPoint ? 'bg-amber-50 border-amber-200' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium">{box.materialName}</div>
                            <div className="text-sm text-muted-foreground">
                              Size: {box.size}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className={`text-sm font-medium ${
                                box.quantity <= box.reorderPoint ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                Quantity: {box.quantity}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Reorder below: {box.reorderPoint}
                              </div>
                            </div>
                            {box.notes && (
                              <div className="text-sm mt-1 text-muted-foreground">{box.notes}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingBox(box)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this box?")) {
                                  deleteBox.mutate(box.id);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bags Tab */}
        <TabsContent value="bags" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Bag Form */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{editingBag ? "Edit Bag" : "Add New Bag"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...bagForm}>
                  <form onSubmit={bagForm.handleSubmit(onSubmitBag)} className="space-y-4">
                    <FormField
                      control={bagForm.control}
                      name="materialName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Bag name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={bagForm.control}
                      name="bagType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bag Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select bag type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Innato">Innato</SelectItem>
                              <SelectItem value="Natey">Natey</SelectItem>
                              <SelectItem value="ZEN">ZEN</SelectItem>
                              <SelectItem value="Double">Double</SelectItem>
                              <SelectItem value="OvA">OvA</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={bagForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select bag size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="S">S</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="XL">XL</SelectItem>
                              <SelectItem value="XXL">XXL</SelectItem>
                              <SelectItem value="Bagpack">Bagpack</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={bagForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Current quantity" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bagForm.control}
                        name="reorderPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reorder Point</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Reorder when below" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={bagForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Notes (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={resetBagForm}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#1F5B61] hover:bg-[#174349]">
                        {editingBag ? "Update Bag" : "Add Bag"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Bag List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Bags Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                  {materialsLoading ? (
                    <div>Loading bags...</div>
                  ) : bags.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No bags found. Add your first bag.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bags.map((bag) => (
                        <div 
                          key={bag.id} 
                          className={`p-4 border rounded-lg flex justify-between items-center ${
                            bag.quantity <= bag.reorderPoint ? 'bg-amber-50 border-amber-200' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium">{bag.materialName}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {bag.bagType}, Size: {bag.size}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className={`text-sm font-medium ${
                                bag.quantity <= bag.reorderPoint ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                Quantity: {bag.quantity}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Reorder below: {bag.reorderPoint}
                              </div>
                            </div>
                            {bag.notes && (
                              <div className="text-sm mt-1 text-muted-foreground">{bag.notes}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingBag(bag)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this bag?")) {
                                  deleteBag.mutate(bag.id);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}