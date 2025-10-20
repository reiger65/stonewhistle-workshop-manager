import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Music, Plus, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { getNormalizedInstrumentType } from '@/lib/utils';

// Form schema for flute settings
const fluteSettingsSchema = z.object({
  instrumentType: z.string().min(1, { message: "Instrument type is required" }),
  tuningNote: z.string().min(1, { message: "Tuning note is required" }),
  frequency: z.coerce.number().int().default(440),
  description: z.string().optional(),
  sensitivityThreshold: z.string().default("0.0001"),
  isActive: z.boolean().default(true),
  adjustedNotes: z.record(z.string(), z.boolean()).optional(),
});

type FluteSettingsFormValues = z.infer<typeof fluteSettingsSchema>;

// Default instrument types and their possible tunings
const INSTRUMENT_TYPES = [
  "INNATO",
  "NATEY",
  "DOUBLE",
  "ZEN"
];

// Default tunings for each instrument type
const DEFAULT_TUNINGS = {
  "INNATO": [
    "Em4", "Ebm4", "Dm4", "C#m4", "Cm4", "Bm3", "Bbm3", 
    "Am3", "G#m3", "Gm3", "F#m3", "Fm3", "Em3"
  ],
  "NATEY": [
    "Am4", "G#m4", "Gm4", "F#m4", "Fm4", "Em4", "Ebm4", 
    "Dm4", "C#m4", "Cm4", "Bm3", "Bbm3", "Am3", "G#m3", "Gm3"
  ],
  "DOUBLE": [
    "C#m4", "Cm4", "Bm3", "Bbm3", "Am3", "G#m3", "Gm3"
  ],
  "ZEN": [
    "Gm3", "Em3"
  ]
};

// Frequency options
const FREQUENCY_OPTIONS = [
  { value: 440, label: "440 Hz (Standard)" },
  { value: 432, label: "432 Hz (Alternative)" },
  { value: 425, label: "425 Hz (Huygens)" },
  { value: 420, label: "420 Hz (Ancient)" }
];

export default function FluteSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSettingId, setCurrentSettingId] = useState<number | null>(null);
  
  // Query to fetch flute settings
  const { 
    data: fluteSettings = [], 
    isLoading,
    isError,
    refetch
  } = useQuery({ 
    queryKey: ['/api/flute-settings'],
    retry: 1
  });
  
  // Form setup
  const form = useForm<FluteSettingsFormValues>({
    resolver: zodResolver(fluteSettingsSchema),
    defaultValues: {
      instrumentType: "INNATO",
      tuningNote: "Cm4",
      frequency: 440,
      description: "",
      sensitivityThreshold: "0.0001",
      isActive: true,
      adjustedNotes: {},
    },
  });
  
  // State for tuning options based on selected instrument
  const [tuningOptions, setTuningOptions] = useState<string[]>(DEFAULT_TUNINGS["INNATO"]);
  
  // Update tuning options when instrument type changes
  useEffect(() => {
    const instrumentType = form.watch("instrumentType");
    if (instrumentType) {
      const normalizedType = getNormalizedInstrumentType(instrumentType);
      setTuningOptions(DEFAULT_TUNINGS[normalizedType as keyof typeof DEFAULT_TUNINGS] || []);
      
      // If current tuning is not valid for this instrument, reset to first option
      const currentTuning = form.watch("tuningNote");
      const validTunings = DEFAULT_TUNINGS[normalizedType as keyof typeof DEFAULT_TUNINGS] || [];
      if (!validTunings.includes(currentTuning)) {
        form.setValue("tuningNote", validTunings[0] || "");
      }
    }
  }, [form.watch("instrumentType")]);
  
  // Mutations for create/update/delete
  const createMutation = useMutation({
    mutationFn: (data: FluteSettingsFormValues) => 
      apiRequest('/api/flute-settings', 'POST', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Flute settings created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/flute-settings'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create settings: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: FluteSettingsFormValues }) => 
      apiRequest(`/api/flute-settings/${id}`, 'PATCH', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Flute settings updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/flute-settings'] });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setCurrentSettingId(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/flute-settings/${id}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Flute settings deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/flute-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete settings: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: FluteSettingsFormValues) => {
    if (isEditMode && currentSettingId) {
      updateMutation.mutate({ id: currentSettingId, data });
    } else {
      createMutation.mutate(data);
    }
  };
  
  // Handle edit button click
  const handleEdit = (setting: any) => {
    setIsEditMode(true);
    setCurrentSettingId(setting.id);
    
    // Reset form and set values
    form.reset({
      instrumentType: setting.instrumentType,
      tuningNote: setting.tuningNote,
      frequency: setting.frequency,
      description: setting.description || "",
      sensitivityThreshold: setting.sensitivityThreshold || "0.0001",
      isActive: setting.isActive,
      adjustedNotes: setting.adjustedNotes || {},
    });
    
    setIsDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this setting? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Handle add new button click
  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentSettingId(null);
    form.reset({
      instrumentType: "INNATO",
      tuningNote: "Cm4",
      frequency: 440,
      description: "",
      sensitivityThreshold: "0.0001",
      isActive: true,
      adjustedNotes: {},
    });
    setIsDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Flute Settings Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleAddNew} className="gap-1">
            <Plus className="h-4 w-4" />
            Add New Setting
          </Button>
        </div>
      </div>
      
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load flute settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : fluteSettings.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <Music className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-2 text-xl font-medium">No flute settings found</h3>
          <p className="text-muted-foreground mt-1">
            Add your first flute setting by clicking the button above.
          </p>
        </div>
      ) : (
        <Table>
          <TableCaption>
            A list of all flute settings for the tuner application.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Instrument</TableHead>
              <TableHead>Tuning Note</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fluteSettings.map((setting: any) => (
              <TableRow key={setting.id}>
                <TableCell className="font-medium">
                  {setting.instrumentType}
                </TableCell>
                <TableCell>{setting.tuningNote}</TableCell>
                <TableCell>{setting.frequency} Hz</TableCell>
                <TableCell className="max-w-xs truncate">
                  {setting.description || "—"}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    setting.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {setting.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleEdit(setting)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(setting.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      {/* Dialog for create/edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Flute Setting" : "Create New Flute Setting"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update the settings for this flute configuration."
                : "Add a new flute configuration to be used by the tuner application."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Instrument Type */}
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
                          {INSTRUMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Tuning Note */}
                <FormField
                  control={form.control}
                  name="tuningNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tuning Note</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tuning note" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tuningOptions.map((tuning) => (
                            <SelectItem key={tuning} value={tuning}>
                              {tuning}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Sensitivity Threshold */}
                <FormField
                  control={form.control}
                  name="sensitivityThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sensitivity Threshold</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0.0001" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A lower value makes the tuner more sensitive
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Add any notes or description about this tuning configuration" 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Is Active */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        When active, this setting will be available in the tuner
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
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-background" />
                  )}
                  {isEditMode ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}