import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addWeeks } from "date-fns";
import { insertOrderSchema, type InsertOrder, type OrderStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AddOrderDialogProps {
  open: boolean;
  onClose: () => void;
  initialStatus?: string;
}

export function AddOrderDialog({ open, onClose, initialStatus = 'materials_prep' }: AddOrderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const today = new Date();
  const twoWeeksLater = addWeeks(today, 2);
  
  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      orderNumber: '',
      shopifyOrderId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      orderType: 'retail',
      status: initialStatus as OrderStatus,
      orderDate: format(today, 'dd-M-yyyy'),
      deadline: format(twoWeeksLater, 'dd-M-yyyy'),
      notes: '',
    }
  });
  
  const createOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const res = await apiRequest('POST', '/api/orders', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Created",
        description: "New order has been created successfully",
      });
      onClose();
      
      // Add the instrument with the selected details
      createOrderItemMutation.mutate({
        orderId: data.id,
        serialNumber: `${data.orderNumber}-1`,
        itemType: selectedInstrumentType,
        itemSize: selectedSize, 
        tuningType: selectedTuning,
        color: itemColor || "Natural",
        boxSize: selectedBoxSize,
        status: data.status,
        specifications: {
          'Type': selectedInstrumentType.replace('_', ' '),
          'Bag Size': selectedSize,
          'Box Size': selectedBoxSize,
          'Tuning Type': selectedTuning,
          'Pitch': selectedTuningHertz,
          'Color': itemColor || "Natural",
        }
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Order Creation Failed",
        description: "Failed to create new order",
      });
    }
  });
  
  // Real instrument types based on the workshop's inventory
  const instrumentTypes = [
    { value: "INNATO", label: "INNATO" },
    { value: "NATEY", label: "NATEY" },
    { value: "DOUBLE", label: "DOUBLE" },
    { value: "ZEN", label: "ZEN" },
    { value: "ZEN_L", label: "ZEN L" },
    { value: "ZEN_M", label: "ZEN M" },
    { value: "OVA", label: "OvA" },
    { value: "CARDS", label: "CARDS" }
  ];

  // Instrument bag sizes
  const instrumentSizes = [
    { value: "XXL", label: "XXL" },
    { value: "XL", label: "XL" },
    { value: "L", label: "L" },
    { value: "M", label: "M" },
    { value: "S", label: "S" }
  ];
  
  // Box sizes
  const boxSizes = [
    { value: "35x35x35", label: "35×35×35" },
    { value: "35x35x30", label: "35×35×30" },
    { value: "31x31x31", label: "31×31×31" },
    { value: "30x12x12", label: "30×12×12" },
    { value: "20x20x20", label: "20×20×20" },
    { value: "20x16x14", label: "20×16×14" },
    { value: "17x12x13", label: "17×12×13" },
    { value: "15x15x15", label: "15×15×15" },
    { value: "Envelope", label: "Envelope" },
    { value: "-", label: "None" }
  ];

  // Tuning hertz values
  const tuningHertzValues = [
    { value: "432", label: "432 Hz" },
    { value: "440", label: "440 Hz" },
    { value: "----", label: "Not Applicable" }
  ];
  
  // Color types
  const tuningTypes = [
    { value: "C", label: "C" },
    { value: "B", label: "B" },
    { value: "TB", label: "TB" },
    { value: "SB", label: "SB" },
    { value: "T", label: "T" }
  ];
  
  // State for item creation
  const [selectedInstrumentType, setSelectedInstrumentType] = useState("INNATO_C4");
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedTuning, setSelectedTuning] = useState("C");
  const [selectedTuningHertz, setSelectedTuningHertz] = useState("432");
  // Changed default box size to make Envelope more accessible in the workflow
  const [selectedBoxSize, setSelectedBoxSize] = useState("-"); // Default to "None", users must actively select a box size
  const [selectedReseller, setSelectedReseller] = useState("none");
  const [itemColor, setItemColor] = useState("");
  
  const createOrderItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/orders/${data.orderId}/items`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  });
  
  const onSubmit = (data: InsertOrder) => {
    // Convert null values to empty strings for form fields
    const sanitizedData = {
      ...data,
      customerEmail: data.customerEmail ?? '',
      customerPhone: data.customerPhone ?? '',
      notes: data.notes ?? ''
    };
    createOrderMutation.mutate(sanitizedData);
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Order</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order #</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Type</FormLabel>
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
                        <SelectItem value="retail">Retail Customer</SelectItem>
                        <SelectItem value="reseller">Reseller/Shop</SelectItem>
                        <SelectItem value="repair">Repair/Maintenance</SelectItem>
                        <SelectItem value="custom">Custom Order</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label htmlFor="reseller">Reseller</Label>
                <Select 
                  value={selectedReseller}
                  onValueChange={setSelectedReseller}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select reseller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="reseller1">Moon Flutes</SelectItem>
                    <SelectItem value="reseller2">Wind Instruments Shop</SelectItem>
                    <SelectItem value="reseller3">Melody Market</SelectItem>
                    <SelectItem value="reseller4">Harmony House</SelectItem>
                    <SelectItem value="reseller5">Mystical Sounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-3">Instrument Details</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="instrumentType">Instrument Type</Label>
                  <Select 
                    value={selectedInstrumentType}
                    onValueChange={setSelectedInstrumentType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {instrumentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="size">Bag Size</Label>
                  <Select 
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select bag size" />
                    </SelectTrigger>
                    <SelectContent>
                      {instrumentSizes.map(size => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="tuningHertz">Pitch (Hz)</Label>
                  <Select 
                    value={selectedTuningHertz}
                    onValueChange={setSelectedTuningHertz}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select pitch" />
                    </SelectTrigger>
                    <SelectContent>
                      {tuningHertzValues.map(hertz => (
                        <SelectItem key={hertz.value} value={hertz.value}>
                          {hertz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="tuningType">Color Type</Label>
                  <Select 
                    value={selectedTuning}
                    onValueChange={setSelectedTuning}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select color type" />
                    </SelectTrigger>
                    <SelectContent>
                      {tuningTypes.map(tuning => (
                        <SelectItem key={tuning.value} value={tuning.value}>
                          {tuning.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input 
                    id="color"
                    value={itemColor}
                    onChange={(e) => setItemColor(e.target.value)}
                    placeholder="Enter color"
                  />
                </div>
                
                <div>
                  <Label htmlFor="boxSize">Box Size</Label>
                  <Select 
                    value={selectedBoxSize}
                    onValueChange={setSelectedBoxSize}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select box size" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Explicitly render the Envelope option first to ensure it's visible */}
                      <SelectItem key="envelope-option" value="Envelope">Envelope</SelectItem>
                      
                      {/* Then render all other sizes from the array */}
                      {boxSizes
                        .filter(size => size.value !== "Envelope") // Filter out Envelope since we added it manually above
                        .map(size => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))
                      }
                      
                      {/* Other special options */}
                      <SelectItem value="custom">Custom Size</SelectItem>
                      <SelectItem value="multi_pack">Multiple Items in One Box</SelectItem>
                      <SelectItem value="pickup">Customer Pickup (No Box)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="h-12 px-6 text-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 h-12 px-6 text-lg"
                disabled={createOrderMutation.isPending}
              >
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}