import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { useLanguage } from "@/lib/languageContext";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  MoreVertical, 
  Plus, 
  RefreshCw, 
  GripVertical, 
  Calendar, 
  ArrowUp,
  ArrowDown,
  Clock,
  Package,
  Truck
} from "lucide-react";
import { format, parseISO, isValid, isFuture } from "date-fns";
import { MaterialInventory } from "@shared/schema";

// Import DnD kit components
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Material Inventory Item Component
function SortableMaterialItem({ material, onUpdate, onDelete }) {
  const isLowStock = material.quantity <= material.reorderPoint;
  const hasOrdered = material?.ordered > 0;
  const expectedDelivery = material?.expectedDelivery ? parseISO(material.expectedDelivery) : null;
  const deliveryIsFuture = expectedDelivery && isValid(expectedDelivery) && isFuture(expectedDelivery);
  
  // Setup sortable hooks
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `${material.id}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <TableRow 
      ref={setNodeRef} 
      style={style}
      className={`${material.id % 2 === 0 ? 'bg-white' : 'bg-gray-100'} border-b-2 border-gray-200`}
    >
      <TableCell className="w-[40px]">
        <div {...attributes} {...listeners} className="cursor-grab flex items-center justify-center">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </TableCell>
      <TableCell>{material.materialName}</TableCell>
      <TableCell>{material.size}</TableCell>
      <TableCell>
        <div className="flex items-center">
          {material.quantity}
          {isLowStock && (
            <Badge variant="destructive" className="ml-2">
              Low Stock
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{material.reorderPoint}</TableCell>
      <TableCell>
        {hasOrdered && (
          <div className="flex items-center text-xs">
            <Truck className="h-3 w-3 mr-1" />
            <span>{material.ordered} ordered</span>
            {deliveryIsFuture && (
              <>
                <Clock className="h-3 w-3 mx-1" />
                <span>{format(expectedDelivery, 'dd MMM')}</span>
              </>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>{material.notes || '-'}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onUpdate(material)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(material.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Instrument Inventory Item Component
function InstrumentInventoryItem({ instrument, onUpdate, onDelete }) {
  return (
    <TableRow className={`${instrument.id % 2 === 0 ? 'bg-white' : 'bg-gray-100'} border-b-2 border-gray-200`}>
      <TableCell>{instrument.serialNumber}</TableCell>
      <TableCell>{instrument.instrumentType}</TableCell>
      <TableCell>{instrument.tuningType || '-'}</TableCell>
      <TableCell>{instrument.status}</TableCell>
      <TableCell>{instrument.craftsperson || '-'}</TableCell>
      <TableCell>{instrument.location || '-'}</TableCell>
      <TableCell>{instrument.price ? `$${(instrument.price / 100).toFixed(2)}` : '-'}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onUpdate(instrument)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(instrument.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Material Form Schema
const materialFormSchema = z.object({
  materialName: z.string().min(1, "Name is required"),
  materialType: z.enum(["bag", "box"]),
  bagType: z.string().optional(),
  size: z.string().min(1, "Size is required"),
  quantity: z.coerce.number().int().min(0),
  reorderPoint: z.coerce.number().int().min(0),
  ordered: z.coerce.number().int().min(0).optional(),
  expectedDelivery: z.string().optional(),
  orderDate: z.string().optional(),
  orderReference: z.string().optional(),
  notes: z.string().optional(),
});

// Instrument Form Schema
const instrumentFormSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required"),
  instrumentType: z.string().min(1, "Instrument type is required"),
  tuningType: z.string().optional(),
  color: z.string().optional(),
  stockQuality: z.string().optional(),
  needsSmokefiring: z.boolean().optional(),
  dateProduced: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  location: z.string().optional(),
  craftsperson: z.string().optional(),
  notes: z.string().optional(),
  price: z.coerce.number().optional(),
});

// Add/Edit Material Dialog
function MaterialDialog({ isOpen, onOpenChange, material, onSave }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // These logs help us debug if the component is rendered and when
  console.log("MaterialDialog rendered. isOpen:", isOpen, "material:", material);
  
  // Import the necessary function for API requests
  const { apiRequest } = require("@/lib/queryClient");
  
  const form = useForm({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      materialName: "",
      materialType: "bag",
      bagType: "",
      size: "",
      quantity: 0,
      reorderPoint: 5,
      ordered: 0,
      expectedDelivery: "",
      orderDate: "",
      orderReference: "",
      notes: "",
    },
  });
  
  // Initialize form with material data when editing
  useEffect(() => {
    if (material && isOpen) {
      console.log("Initializing form with material:", material);
      form.reset({
        materialName: material.materialName || "",
        materialType: material.materialType || "bag",
        bagType: material.bagType || "",
        size: material.size || "",
        quantity: material.quantity || 0,
        reorderPoint: material.reorderPoint || 5,
        ordered: material.ordered || 0,
        expectedDelivery: material.expectedDelivery ? new Date(material.expectedDelivery).toISOString().split('T')[0] : "",
        orderDate: material.orderDate ? new Date(material.orderDate).toISOString().split('T')[0] : "",
        orderReference: material.orderReference || "",
        notes: material.notes || "",
      });
    }
  }, [isOpen, material, form]);
  
  const materialType = form.watch("materialType");
  const ordered = form.watch("ordered");
  
  async function onSubmit(data) {
    try {
      // Create a clean copy of the data
      const cleanData = { ...data };
      
      // Convert string fields to numbers to match the schema
      cleanData.quantity = Number(cleanData.quantity);
      cleanData.reorderPoint = Number(cleanData.reorderPoint);
      cleanData.ordered = Number(cleanData.ordered);
      
      // Handle date fields properly
      if (cleanData.expectedDelivery && cleanData.expectedDelivery.trim() !== '') {
        try {
          const parsedDate = new Date(cleanData.expectedDelivery);
          if (!isNaN(parsedDate.getTime())) {
            cleanData.expectedDelivery = parsedDate.toISOString();
          } else {
            cleanData.expectedDelivery = null;
          }
        } catch (e) {
          cleanData.expectedDelivery = null; 
        }
      } else {
        cleanData.expectedDelivery = null;
      }
      
      if (cleanData.orderDate && cleanData.orderDate.trim() !== '') {
        try {
          const parsedDate = new Date(cleanData.orderDate);
          if (!isNaN(parsedDate.getTime())) {
            cleanData.orderDate = parsedDate.toISOString();
          } else {
            cleanData.orderDate = null;
          }
        } catch (e) {
          cleanData.orderDate = null;
        }
      } else {
        cleanData.orderDate = null;
      }
      
      // For box and bag types, automatically use the type and size as the name
      if (cleanData.materialType === "box") {
        cleanData.materialName = `BOX ${cleanData.size}`;
      } else if (cleanData.materialType === "bag") {
        cleanData.materialName = `${cleanData.bagType?.toUpperCase() || ""}BAG ${cleanData.size}`;
      }
      
      // Follow the same pattern as instruments form
      if (material?.id) {
        await fetch(`/api/materials/${material.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanData),
        });
        
        toast({
          title: "Material updated",
          description: "The material has been successfully updated.",
        });
      } else {
        await fetch('/api/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanData),
        });
        
        toast({
          title: "Material added",
          description: "The material has been successfully added to inventory.",
        });
      }
      
      // Invalidate materials queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials/type/bag'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials/type/box'] });
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving material:", error);
      toast({
        title: "Error",
        description: `Failed to save material: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {material?.id ? "Edit Material" : "Add Material"}
          </DialogTitle>
          <DialogDescription>
            {material?.id
              ? "Update the details of this material"
              : "Add a new material to inventory"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden field - name will be auto-generated */}
            <input type="hidden" {...form.register("materialName")} />
            
            <FormField
              control={form.control}
              name="materialType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bag">Bag</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {materialType === "bag" && (
              <FormField
                control={form.control}
                name="bagType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bag Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
            )}
            
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  {materialType === "bag" ? (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
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
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
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
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Order tracking fields */}
            <div className="p-4 border border-gray-200 rounded-md space-y-4 bg-gray-50">
              <h4 className="font-medium text-sm flex items-center">
                <Truck className="h-4 w-4 mr-1" />
                Order Tracking
              </h4>
              
              <FormField
                control={form.control}
                name="ordered"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Quantity Ordered</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {ordered > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Date</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value ? field.value.substring(0, 10) : ''} 
                              />
                              <Calendar className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expectedDelivery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Delivery</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value ? field.value.substring(0, 10) : ''} 
                              />
                              <Calendar className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="orderReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="Order reference or ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit">
                {material?.id ? "Update" : "Add"} Material
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Add/Edit Instrument Dialog
function InstrumentDialog({ isOpen, onOpenChange, instrument, onSave }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(instrumentFormSchema),
    defaultValues: {
      serialNumber: "",
      instrumentType: "",
      tuningType: "",
      color: "",
      stockQuality: "A",
      needsSmokefiring: false,
      dateProduced: "",
      status: "available",
      location: "",
      craftsperson: "",
      notes: "",
      price: 0,
    },
  });
  
  // Initialize form with instrument data when editing
  useEffect(() => {
    if (instrument && isOpen) {
      console.log("Initializing form with instrument:", instrument);
      form.reset({
        serialNumber: instrument.serialNumber || "",
        instrumentType: instrument.instrumentType || "",
        tuningType: instrument.tuningType || "",
        color: instrument.color || "",
        stockQuality: instrument.stockQuality || "A",
        needsSmokefiring: instrument.needsSmokefiring || false,
        dateProduced: instrument.dateProduced ? new Date(instrument.dateProduced).toISOString().split('T')[0] : "",
        status: instrument.status || "available",
        location: instrument.location || "",
        craftsperson: instrument.craftsperson || "",
        notes: instrument.notes || "",
        price: instrument.price ? instrument.price / 100 : 0, // Convert cents to dollars for display
      });
    }
  }, [isOpen, instrument, form]);
  
  async function onSubmit(data) {
    try {
      // Create a clean copy of the data
      const cleanData = { ...data };
      
      // Convert price from dollars to cents
      if (cleanData.price) {
        cleanData.price = Math.round(cleanData.price * 100);
      }
      
      // Handle date field properly
      if (cleanData.dateProduced && cleanData.dateProduced.trim() !== '') {
        try {
          const parsedDate = new Date(cleanData.dateProduced);
          if (!isNaN(parsedDate.getTime())) {
            cleanData.dateProduced = parsedDate.toISOString();
          } else {
            cleanData.dateProduced = null;
          }
        } catch (e) {
          cleanData.dateProduced = null;
        }
      } else {
        cleanData.dateProduced = null;
      }
      
      if (instrument?.id) {
        await apiRequest("PATCH", `/api/instruments/${instrument.id}`, cleanData);
        toast({
          title: "Instrument updated",
          description: "The instrument has been successfully updated.",
        });
      } else {
        await apiRequest("POST", "/api/instruments", cleanData);
        toast({
          title: "Instrument added",
          description: "The instrument has been successfully added to inventory.",
        });
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save instrument. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {instrument?.id ? "Edit Instrument" : "Add Instrument"}
          </DialogTitle>
          <DialogDescription>
            {instrument?.id
              ? "Update the details of this instrument"
              : "Add a new instrument to inventory"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Serial Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instrumentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrument Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instrument type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INNATO">INNATO</SelectItem>
                      <SelectItem value="NATEY">NATEY</SelectItem>
                      <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                      <SelectItem value="ZEN">ZEN</SelectItem>
                      <SelectItem value="OvA">OvA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tuningType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tuning</FormLabel>
                  <FormControl>
                    <Input placeholder="Tuning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="craftsperson"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Craftsperson</FormLabel>
                    <FormControl>
                      <Input placeholder="Craftsperson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                      value={field.value !== undefined ? field.value : ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Price in dollars (e.g., 199.99)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit">
                {instrument?.id ? "Update" : "Add"} Instrument
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Main Stock/Inventory Page
export default function StockPage() {
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [editMaterialOpen, setEditMaterialOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  
  const [addInstrumentOpen, setAddInstrumentOpen] = useState(false);
  const [editInstrumentOpen, setEditInstrumentOpen] = useState(false);
  const [currentInstrument, setCurrentInstrument] = useState(null);
  
  const [materialItems, setMaterialItems] = useState<MaterialInventory[]>([]);
  const [bagItems, setBagItems] = useState<MaterialInventory[]>([]);
  const [boxItems, setBoxItems] = useState<MaterialInventory[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Setup DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Material queries
  const materialsQuery = useQuery<MaterialInventory[]>({
    queryKey: ['/api/materials'],
    onError: (error) => {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error loading materials",
        description: "Could not load inventory materials. Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Material mutations
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<MaterialInventory> }) => {
      return await apiRequest('PATCH', `/api/materials/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Updated",
        description: "Material has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      });
    }
  });
  
  // Update display order mutation
  const updateDisplayOrderMutation = useMutation({
    mutationFn: async ({ id, displayOrder }: { id: number, displayOrder: number }) => {
      return await apiRequest('PATCH', `/api/materials/${id}`, { displayOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
    }
  });
  
  // Instrument queries
  const instrumentsQuery = useQuery({
    queryKey: ['/api/instruments'],
    onError: (error) => {
      console.error("Error fetching instruments:", error);
      toast({
        title: "Error loading instruments",
        description: "Could not load instrument inventory. Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Effect to filter and sort materials when data changes
  useEffect(() => {
    if (materialsQuery.data && Array.isArray(materialsQuery.data)) {
      try {
        // Sort by display order first, then by ID
        const sortedMaterials = [...materialsQuery.data].sort((a, b) => {
          // Handle null displayOrder values
          const aOrder = a.displayOrder || 0;
          const bOrder = b.displayOrder || 0;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return a.id - b.id;
        });

        setMaterialItems(sortedMaterials);
        
        // Split into bags and boxes
        setBagItems(sortedMaterials.filter(item => item.materialType === 'bag'));
        setBoxItems(sortedMaterials.filter(item => item.materialType === 'box'));
      } catch (error) {
        console.error("Error processing materials data:", error);
      }
    }
  }, [materialsQuery.data]);
  
  // Handle drag end for bags
  const handleBagDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setBagItems(items => {
        // Get the old index and new index from the drag event
        const oldIndex = items.findIndex(item => `${item.id}` === active.id);
        const newIndex = items.findIndex(item => `${item.id}` === over.id);
        
        // Create the new array with the item moved
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update display order in the database
        newItems.forEach((item, index) => {
          updateDisplayOrderMutation.mutate({
            id: item.id,
            displayOrder: index
          });
        });
        
        return newItems;
      });
    }
  };
  
  // Handle drag end for boxes
  const handleBoxDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setBoxItems(items => {
        // Get the old index and new index from the drag event
        const oldIndex = items.findIndex(item => `${item.id}` === active.id);
        const newIndex = items.findIndex(item => `${item.id}` === over.id);
        
        // Create the new array with the item moved
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update display order in the database
        // We need to offset by the number of bag items for proper ordering
        const bagOffset = bagItems.length;
        newItems.forEach((item, index) => {
          updateDisplayOrderMutation.mutate({
            id: item.id,
            displayOrder: index + bagOffset
          });
        });
        
        return newItems;
      });
    }
  };
  
  // Handle add material
  function handleAddMaterial() {
    setCurrentMaterial(null);
    setAddMaterialOpen(true);
  }
  
  // Handle edit material
  function handleEditMaterial(material) {
    setCurrentMaterial(material);
    setEditMaterialOpen(true);
  }
  
  // Handle delete material
  async function handleDeleteMaterial(id) {
    if (confirm("Are you sure you want to delete this material? This cannot be undone.")) {
      try {
        await apiRequest("DELETE", `/api/materials/${id}`);
        materialsQuery.refetch();
        toast({
          title: "Material deleted",
          description: "The material has been removed from inventory.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete material. Please try again.",
          variant: "destructive",
        });
      }
    }
  }
  
  // Handle add instrument
  function handleAddInstrument() {
    setCurrentInstrument(null);
    setAddInstrumentOpen(true);
  }
  
  // Handle edit instrument
  function handleEditInstrument(instrument) {
    setCurrentInstrument(instrument);
    setEditInstrumentOpen(true);
  }
  
  // Handle delete instrument
  async function handleDeleteInstrument(id) {
    if (confirm("Are you sure you want to delete this instrument? This cannot be undone.")) {
      try {
        await apiRequest("DELETE", `/api/instruments/${id}`);
        instrumentsQuery.refetch();
        toast({
          title: "Instrument deleted",
          description: "The instrument has been removed from inventory.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete instrument. Please try again.",
          variant: "destructive",
        });
      }
    }
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1F5B61]">Inventory Management</h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                materialsQuery.refetch();
                instrumentsQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Display low stock warning alert */}
        {Array.isArray(materialsQuery.data) && materialsQuery.data.some(material => material.quantity <= (material.reorderPoint || 0)) && (
          <Alert variant="default" className="bg-amber-50 border-amber-500">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-600">Low Stock Warning</AlertTitle>
            <AlertDescription>
              Some materials are running low. Please check the inventory and reorder as needed.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Main tabs for inventory sections */}
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="instruments">Instruments</TabsTrigger>
          </TabsList>
          
          {/* Materials Tab Content */}
          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Materials Inventory</h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => materialsQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button size="sm" onClick={handleAddMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </div>
            </div>
            
            {materialsQuery.isLoading ? (
              <div className="text-center py-4">Loading materials...</div>
            ) : materialsQuery.isError ? (
              <div className="text-center py-4 text-destructive">
                Error loading materials: {materialsQuery.error.message}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bag Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-[#1F5B61]" />
                    Bag Inventory
                  </h3>
                  <div className="rounded-md border">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleBagDragEnd}
                    >
                      <Table>
                        <TableHeader className="bg-[#1F5B61] text-white">
                          <TableRow className="border-b-0">
                            <TableHead className="w-[40px] text-white"></TableHead>
                            <TableHead className="text-white">Name</TableHead>
                            <TableHead className="text-white">Size</TableHead>
                            <TableHead className="text-white">Quantity</TableHead>
                            <TableHead className="text-white">Reorder Point</TableHead>
                            <TableHead className="text-white">On Order</TableHead>
                            <TableHead className="text-white">Notes</TableHead>
                            <TableHead className="w-[80px] text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <SortableContext items={bagItems.map(item => `${item.id}`)} strategy={verticalListSortingStrategy}>
                          <TableBody>
                            {bagItems.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center">
                                  No bags in inventory
                                </TableCell>
                              </TableRow>
                            ) : (
                              bagItems.map((material) => (
                                <SortableMaterialItem
                                  key={material.id}
                                  material={material}
                                  onUpdate={handleEditMaterial}
                                  onDelete={handleDeleteMaterial}
                                />
                              ))
                            )}
                          </TableBody>
                        </SortableContext>
                      </Table>
                    </DndContext>
                  </div>
                </div>
                
                {/* Box Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-[#C26E50]" />
                    Box Inventory
                  </h3>
                  <div className="rounded-md border">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleBoxDragEnd}
                    >
                      <Table>
                        <TableHeader className="bg-[#C26E50] text-white">
                          <TableRow className="border-b-0">
                            <TableHead className="w-[40px] text-white"></TableHead>
                            <TableHead className="text-white">Name</TableHead>
                            <TableHead className="text-white">Size</TableHead>
                            <TableHead className="text-white">Quantity</TableHead>
                            <TableHead className="text-white">Reorder Point</TableHead>
                            <TableHead className="text-white">On Order</TableHead>
                            <TableHead className="text-white">Notes</TableHead>
                            <TableHead className="w-[80px] text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <SortableContext items={boxItems.map(item => `${item.id}`)} strategy={verticalListSortingStrategy}>
                          <TableBody>
                            {boxItems.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center">
                                  No boxes in inventory
                                </TableCell>
                              </TableRow>
                            ) : (
                              boxItems.map((material) => (
                                <SortableMaterialItem
                                  key={material.id}
                                  material={material}
                                  onUpdate={handleEditMaterial}
                                  onDelete={handleDeleteMaterial}
                                />
                              ))
                            )}
                          </TableBody>
                        </SortableContext>
                      </Table>
                    </DndContext>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add/Edit Material Dialogs */}
            <MaterialDialog
              isOpen={addMaterialOpen}
              onOpenChange={setAddMaterialOpen}
              material={null}
              onSave={() => materialsQuery.refetch()}
            />
            
            <MaterialDialog
              isOpen={editMaterialOpen}
              onOpenChange={setEditMaterialOpen}
              material={currentMaterial}
              onSave={() => materialsQuery.refetch()}
            />
          </TabsContent>
          
          {/* Instruments Tab Content */}
          <TabsContent value="instruments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Instrument Inventory</h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => instrumentsQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button size="sm" onClick={handleAddInstrument}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instrument
                </Button>
              </div>
            </div>
            
            {instrumentsQuery.isLoading ? (
              <div className="text-center py-4">Loading instruments...</div>
            ) : instrumentsQuery.isError ? (
              <div className="text-center py-4 text-destructive">
                Error loading instruments: {instrumentsQuery.error.message}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-[#1F5B61] text-white">
                    <TableRow className="border-b-0">
                      <TableHead className="text-white">Serial #</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Tuning</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Craftsperson</TableHead>
                      <TableHead className="text-white">Location</TableHead>
                      <TableHead className="text-white">Price</TableHead>
                      <TableHead className="w-[80px] text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!Array.isArray(instrumentsQuery.data) || instrumentsQuery.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          No instruments in inventory
                        </TableCell>
                      </TableRow>
                    ) : (
                      instrumentsQuery.data.map((instrument) => (
                        <InstrumentInventoryItem
                          key={instrument.id}
                          instrument={instrument}
                          onUpdate={handleEditInstrument}
                          onDelete={handleDeleteInstrument}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Add/Edit Instrument Dialogs */}
            <InstrumentDialog
              isOpen={addInstrumentOpen}
              onOpenChange={setAddInstrumentOpen}
              instrument={null}
              onSave={() => instrumentsQuery.refetch()}
            />
            
            <InstrumentDialog
              isOpen={editInstrumentOpen}
              onOpenChange={setEditInstrumentOpen}
              instrument={currentInstrument}
              onSave={() => instrumentsQuery.refetch()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}