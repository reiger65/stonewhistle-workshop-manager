import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/languageContext';
import { LanguageCode } from '@/lib/translations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Password change form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingMolds, setIsLoadingMolds] = useState(false);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [molds, setMolds] = useState<any[]>([]);
  const [moldMappings, setMoldMappings] = useState<any[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<any | null>(null);
  const [mappingMolds, setMappingMolds] = useState<any[]>([]);
  
  // Mold form state
  const [newMold, setNewMold] = useState({
    name: '',
    size: '',
    instrumentType: 'INNATO',
    notes: ''
  });
  
  // Mapping form state
  const [newMapping, setNewMapping] = useState({
    name: '',
    instrumentType: 'INNATO',
    tuningNote: ''
  });
  
  const [shopifySettings, setShopifySettings] = useState({
    apiKey: '',
    apiSecret: '',
    storeUrl: '',
    autoSync: true,
    syncInterval: '15'
  });
  
  const [serialNumberSettings, setSerialNumberSettings] = useState({
    prefix: 'SW',
    separator: '-',
    yearDigits: '4',
    includeMonth: true,
    resetCounter: false
  });
  
  const [interfaceSettings, setInterfaceSettings] = useState({
    defaultView: 'production',
    language: language as string,
    dateFormat: 'MM/DD/YYYY',
    itemsPerPage: '10'
  });
  
  // Type definitions for our note adjustments
  type NoteAdjustments = Record<string, number>;
  type TuningAdjustments = Record<string, NoteAdjustments>;
  type InstrumentAdjustments = Record<string, TuningAdjustments>;
  
  // Note tuning adjustments for the reference page
  const [noteTuningAdjustments, setNoteTuningAdjustments] = useState<InstrumentAdjustments>({
    // Special adjustments for Innato
    innato: {
      Cm4: {
        // Left vessel notes
        'G3': 0,
        'Bb3': 10, // Important: +10 cents adjustment
        'C4': 0,
        'D4': 0,
        // Right vessel notes
        'C4_right': 0,
        'D#4': 10, // minor third: +10 cents
        'F4': 10,  // fourth: +10 cents
        'G4': 0,
        // Front vessel notes
        'G4_front': 0,
        'Bb4': 10, // minor seventh: +10 cents
        'C5': 0,
        'D5': 0
      },
      // Default adjustments for other tunings
      default: {
        'minorThird': 10,
        'fourth': 10,
        'minorSeventh': 10
      }
    },
    // Natey adjustments if needed
    natey: {
      default: {}
    },
    // Double flute adjustments
    double: {
      Cm4: {
        'C4': 0,
        'D#4': 10, // minor third: +10 cents
        'F4': 10,  // fourth: +10 cents
        'G4': 0,
        'Bb4': 10, // minor seventh: +10 cents
        'C5': 0
      },
      default: {}
    }
  });
  
  // Currently selected instrument type in reference tab
  const [referenceInstrumentType, setReferenceInstrumentType] = useState<string>('innato');
  const [referenceKey, setReferenceKey] = useState<string>('Cm4');
  
  // Function to update a specific note's tuning adjustment
  const updateNoteAdjustment = (
    instrumentType: string,
    tuning: string,
    note: string,
    adjustment: number
  ) => {
    setNoteTuningAdjustments(prev => {
      // Create a deep copy to avoid direct state mutations
      const newAdjustments: InstrumentAdjustments = JSON.parse(JSON.stringify(prev));
      
      // Make sure the instrument type exists
      if (!newAdjustments[instrumentType]) {
        newAdjustments[instrumentType] = { default: {} };
      }
      
      // Make sure the tuning exists for this instrument
      if (!newAdjustments[instrumentType][tuning]) {
        // If this tuning doesn't exist yet, create it from default
        newAdjustments[instrumentType][tuning] = { 
          ...(newAdjustments[instrumentType].default || {}) 
        };
      }
      
      // Update the specific note
      newAdjustments[instrumentType][tuning][note] = adjustment;
      return newAdjustments;
    });
  };
  
  // Material mappings for instruments to bag and box sizes
  const [materialSettings, setMaterialSettings] = useState({
    // INNATO bag sizes based on tuning
    innato: [
      { tuning: 'E4', bagSize: 'S', boxSize: '30x30x30' },
      { tuning: 'D4', bagSize: 'S', boxSize: '30x30x30' },
      { tuning: 'C#4', bagSize: 'M', boxSize: '30x30x30' },
      { tuning: 'C4', bagSize: 'M', boxSize: '30x30x30' },
      { tuning: 'B3', bagSize: 'L', boxSize: '30x30x30' },
      { tuning: 'Bb3', bagSize: 'L', boxSize: '30x30x30' },
      { tuning: 'A3', bagSize: 'XL', boxSize: '30x30x30' },
      { tuning: 'G#3', bagSize: 'XL', boxSize: '30x30x30' },
      { tuning: 'G3', bagSize: 'XXL', boxSize: '35x35x35' },
      { tuning: 'F3', bagSize: 'XXL', boxSize: '35x35x35' },
      { tuning: 'E3', bagSize: 'XXL', boxSize: '35x35x35' },
      { tuning: 'default', bagSize: 'M', boxSize: '30x30x30' }
    ],
    // NATEY bag sizes
    natey: [
      { tuning: 'A4', bagSize: 'S', boxSize: '15x15x15' },
      { tuning: 'G#4', bagSize: 'S', boxSize: '15x15x15' },
      { tuning: 'G4', bagSize: 'S', boxSize: '15x15x15' },
      { tuning: 'F#4', bagSize: 'S', boxSize: '15x15x15' },
      { tuning: 'F4', bagSize: 'S', boxSize: '15x15x15' },
      { tuning: 'E4', bagSize: 'M', boxSize: '12x12x30' },
      { tuning: 'D#4', bagSize: 'M', boxSize: '12x12x30' },
      { tuning: 'D4', bagSize: 'M', boxSize: '12x12x30' },
      { tuning: 'C#4', bagSize: 'M', boxSize: '12x12x30' },
      { tuning: 'C4', bagSize: 'M', boxSize: '12x12x30' },
      { tuning: 'B3', bagSize: 'M', boxSize: '12x12x30' },
      { tuning: 'Bb3', bagSize: 'L', boxSize: '12x12x30' },
      { tuning: 'A3', bagSize: 'L', boxSize: '12x12x30' },
      { tuning: 'G#3', bagSize: 'L', boxSize: '12x12x30' },
      { tuning: 'G3', bagSize: 'L', boxSize: '12x12x30' },
      { tuning: 'default', bagSize: 'M', boxSize: '12x12x30' }
    ],
    // ZEN flute sizes
    zen: [
      { tuning: 'L', bagSize: 'L', boxSize: '15x15x15' },
      { tuning: 'M', bagSize: 'M', boxSize: '15x15x15' },
      { tuning: 'default', bagSize: 'M', boxSize: '15x15x15' }
    ],
    // DOUBLE flute sizes
    double: [
      { tuning: 'C#4', bagSize: 'M', boxSize: '20x20x20' },
      { tuning: 'C4', bagSize: 'M', boxSize: '20x20x20' },
      { tuning: 'B3', bagSize: 'M', boxSize: '20x20x20' },
      { tuning: 'Bb3', bagSize: 'L', boxSize: '20x20x20' },
      { tuning: 'A3', bagSize: 'L', boxSize: '20x20x20' },
      { tuning: 'G#3', bagSize: 'L', boxSize: '20x20x20' },
      { tuning: 'G3', bagSize: 'L', boxSize: '20x20x20' },
      { tuning: 'default', bagSize: 'M', boxSize: '20x20x20' }
    ],
    // OvA sizes - always uses OvAbag and 40x40x60 box
    ova: [
      { tuning: '64 Hz', bagSize: 'OvAbag', boxSize: '40x40x60' },
      { tuning: 'default', bagSize: 'OvAbag', boxSize: '40x40x60' }
    ],
    // Cards - no bag, envelope box
    cards: [
      { tuning: 'Envelope', bagSize: '-', boxSize: 'ENVELOPE' },
      { tuning: 'default', bagSize: '-', boxSize: 'ENVELOPE' }
    ]
  });
  
  // Available bag sizes
  const [bagSizes, setBagSizes] = useState(['S', 'M', 'L', 'XL', 'XXL', 'OvAbag', '-']);
  const [customBagSize, setCustomBagSize] = useState('');
  
  // Available box sizes 
  const [boxSizes, setBoxSizes] = useState(['15x15x15', '20x20x20', '12x12x30', '30x30x30', '35x35x35', '40x40x60', 'ENVELOPE', '-']);
  const [customBoxSize, setCustomBoxSize] = useState('');
  
  // Available tuning options for each instrument type
  const tuningOptions = {
    innato: ['E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3'],
    natey: ['A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3'],
    zen: ['M', 'L'],
    double: ['C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3'],
    ova: ['64 Hz'],
    cards: ['Envelope']
  };
  
  // Function to update a specific material mapping
  const updateMaterialMapping = (
    instrumentType: string,
    index: number,
    field: 'tuning' | 'bagSize' | 'boxSize',
    value: string
  ) => {
    setMaterialSettings(prev => {
      const newSettings = { ...prev };
      const instrumentMappings = [...newSettings[instrumentType as keyof typeof newSettings]];
      instrumentMappings[index] = {
        ...instrumentMappings[index],
        [field]: value
      };
      return {
        ...newSettings,
        [instrumentType]: instrumentMappings
      };
    });
  };
  
  // Add a new rule for an instrument type
  const addMaterialRule = (instrumentType: string) => {
    setMaterialSettings(prev => {
      const newSettings = { ...prev };
      const instrumentMappings = [...newSettings[instrumentType as keyof typeof newSettings]];
      instrumentMappings.push({
        tuning: 'new rule',
        bagSize: instrumentMappings[0].bagSize,
        boxSize: instrumentMappings[0].boxSize
      });
      return {
        ...newSettings,
        [instrumentType]: instrumentMappings
      };
    });
  };
  
  // Remove a rule for an instrument type
  const removeMaterialRule = (instrumentType: string, index: number) => {
    setMaterialSettings(prev => {
      const newSettings = { ...prev };
      const instrumentMappings = [...newSettings[instrumentType as keyof typeof newSettings]];
      // Don't remove the last rule
      if (instrumentMappings.length <= 1) return prev;
      
      instrumentMappings.splice(index, 1);
      return {
        ...newSettings,
        [instrumentType]: instrumentMappings
      };
    });
  };
  
  // Functions for mold management
  const loadMolds = () => {
    setIsLoadingMolds(true);
    fetch('/api/molds')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch molds');
        return res.json();
      })
      .then(data => {
        setMolds(data);
      })
      .catch(error => {
        console.error('Error loading molds:', error);
        toast({
          title: 'Error Loading Molds',
          description: 'There was a problem loading your mold inventory.',
          variant: 'destructive'
        });
      })
      .finally(() => {
        setIsLoadingMolds(false);
      });
  };

  const loadMoldMappings = () => {
    setIsLoadingMappings(true);
    fetch('/api/mold-mappings')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch mold mappings');
        return res.json();
      })
      .then(data => {
        setMoldMappings(data);
      })
      .catch(error => {
        console.error('Error loading mold mappings:', error);
        toast({
          title: 'Error Loading Mold Mappings',
          description: 'There was a problem loading your mold mappings.',
          variant: 'destructive'
        });
      })
      .finally(() => {
        setIsLoadingMappings(false);
      });
  };

  const loadMappingMolds = (mappingId: number) => {
    // Set the selected mapping first
    const mapping = moldMappings.find(m => m.id === mappingId);
    setSelectedMapping(mapping || null);
    
    fetch(`/api/mold-mappings/${mappingId}/molds`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch mapping molds');
        return res.json();
      })
      .then(data => {
        setMappingMolds(data);
        setSelectedMappingId(mappingId);
      })
      .catch(error => {
        console.error('Error loading mapping molds:', error);
        toast({
          title: 'Error Loading Mapping Molds',
          description: 'There was a problem loading molds for the selected mapping.',
          variant: 'destructive'
        });
      });
  };

  const createMold = () => {
    fetch('/api/molds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMold),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create mold');
        return res.json();
      })
      .then(data => {
        setMolds([...molds, data]);
        // Reset form
        setNewMold({
          name: '',
          size: '',
          instrumentType: 'INNATO',
          notes: ''
        });
        toast({
          title: 'Mold Created',
          description: `Mold "${data.name}" has been added to inventory.`,
        });
      })
      .catch(error => {
        console.error('Error creating mold:', error);
        toast({
          title: 'Error Creating Mold',
          description: 'There was a problem creating the mold.',
          variant: 'destructive'
        });
      });
  };

  // State for the force delete dialog
  const [moldToDelete, setMoldToDelete] = useState<number | null>(null);
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);
  
  const deleteMold = (id: number) => {
    // First try regular delete
    fetch(`/api/molds/${id}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (res.status === 204) {
          // Regular delete succeeded
          setMolds(molds.filter(mold => mold.id !== id));
          toast({
            title: 'Mold Deleted',
            description: 'Mold has been removed from inventory.',
          });
        } else if (res.status === 400) {
          // If normal delete fails because mold is used in mappings, show confirmation dialog
          setMoldToDelete(id);
          setShowForceDeleteDialog(true);
        } else {
          throw new Error('Failed to delete mold');
        }
      })
      .catch(error => {
        console.error('Error deleting mold:', error);
        toast({
          title: 'Error Deleting Mold',
          description: error.message,
          variant: 'destructive'
        });
      });
  };
  
  // Function to confirm force delete from dialog
  const confirmForceDelete = () => {
    if (moldToDelete === null) return;
    
    // Perform force delete
    fetch(`/api/molds/${moldToDelete}?force=true`, {
      method: 'DELETE',
    })
      .then(res => {
        if (res.status === 204) {
          setMolds(molds.filter(mold => mold.id !== moldToDelete));
          toast({
            title: 'Mold Deleted',
            description: 'Mold has been removed from all mappings and inventory.',
          });
        } else {
          throw new Error('Failed to delete mold');
        }
      })
      .catch(error => {
        console.error('Error force deleting mold:', error);
        toast({
          title: 'Error Deleting Mold',
          description: error.message,
          variant: 'destructive'
        });
      })
      .finally(() => {
        // Reset state
        setMoldToDelete(null);
        setShowForceDeleteDialog(false);
      });
  };

  const createMoldMapping = () => {
    fetch('/api/mold-mappings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMapping),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create mold mapping');
        return res.json();
      })
      .then(data => {
        setMoldMappings([...moldMappings, data]);
        // Reset form
        setNewMapping({
          name: '',
          instrumentType: 'INNATO',
          tuningNote: ''
        });
        toast({
          title: 'Mapping Created',
          description: `Mold mapping for "${data.name}" has been created.`,
        });
      })
      .catch(error => {
        console.error('Error creating mold mapping:', error);
        toast({
          title: 'Error Creating Mapping',
          description: 'There was a problem creating the mold mapping.',
          variant: 'destructive'
        });
      });
  };

  const deleteMoldMapping = (id: number) => {
    fetch(`/api/mold-mappings/${id}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (res.status === 204) {
          setMoldMappings(moldMappings.filter(mapping => mapping.id !== id));
          if (selectedMappingId === id) {
            setSelectedMappingId(null);
            setSelectedMapping(null);
            setMappingMolds([]);
          }
          toast({
            title: 'Mapping Deleted',
            description: 'Mold mapping has been deleted.',
          });
        } else {
          throw new Error('Failed to delete mold mapping');
        }
      })
      .catch(error => {
        console.error('Error deleting mold mapping:', error);
        toast({
          title: 'Error Deleting Mapping',
          description: error.message,
          variant: 'destructive'
        });
      });
  };

  const addMoldToMapping = (mappingId: number, moldId: number) => {
    fetch(`/api/mold-mappings/${mappingId}/molds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moldId }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add mold to mapping');
        return res.json();
      })
      .then(data => {
        // Reload mapping molds
        loadMappingMolds(mappingId);
        toast({
          title: 'Mold Added',
          description: 'Mold has been added to the mapping.',
        });
      })
      .catch(error => {
        console.error('Error adding mold to mapping:', error);
        toast({
          title: 'Error Adding Mold',
          description: error.message,
          variant: 'destructive'
        });
      });
  };

  const removeMoldFromMapping = (itemId: number) => {
    if (!itemId) {
      console.error('Tried to remove a mold mapping item with invalid ID:', itemId);
      toast({
        title: 'Error Removing Mold',
        description: 'Invalid mapping item ID',
        variant: 'destructive'
      });
      return;
    }

    console.log(`Removing mold mapping item with ID: ${itemId}`);
    
    fetch(`/api/mold-mappings/items/${itemId}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (res.status === 204) {
          // Update the local mapping molds list
          setMappingMolds(mappingMolds.filter(item => item.id !== itemId));
          toast({
            title: 'Mold Removed',
            description: 'Mold has been removed from the mapping.',
          });
        } else {
          throw new Error('Failed to remove mold from mapping');
        }
      })
      .catch(error => {
        console.error('Error removing mold from mapping:', error);
        toast({
          title: 'Error Removing Mold',
          description: error.message,
          variant: 'destructive'
        });
      });
  };

  // Load settings from server on component mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        // Update state with loaded settings
        if (data.materialSettings) {
          setMaterialSettings(data.materialSettings);
        }
        if (data.shopifySettings) {
          setShopifySettings(data.shopifySettings);
        }
        if (data.serialNumberSettings) {
          setSerialNumberSettings(data.serialNumberSettings);
        }
        if (data.interfaceSettings) {
          setInterfaceSettings(data.interfaceSettings);
        }
      })
      .catch(error => {
        console.error("Error loading settings:", error);
        toast({
          title: "Error Loading Settings",
          description: "There was a problem loading your workshop settings.",
          variant: "destructive"
        });
      });
    
    // Load molds and mold mappings
    loadMolds();
    loadMoldMappings();
  }, []);

  const saveSettings = (settingType: string) => {
    let endpoint = '/api/settings';
    let payload = {};
    
    // Determine which settings to save based on type
    switch (settingType) {
      case 'Materials':
        endpoint = '/api/settings/materialSettings';
        payload = materialSettings;
        break;
      case 'Shopify':
        endpoint = '/api/settings/shopifySettings';
        payload = shopifySettings;
        break;
      case 'Serial Number':
        endpoint = '/api/settings/serialNumberSettings';
        payload = serialNumberSettings;
        break;
      case 'Interface':
        endpoint = '/api/settings/interfaceSettings';
        payload = interfaceSettings;
        break;
      default:
        console.error(`Unknown setting type: ${settingType}`);
        return;
    }
    
    // Save settings to the server
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to save ${settingType} settings`);
      }
      return res.json();
    })
    .then(data => {
      toast({
        title: "Settings Saved",
        description: `${settingType} settings have been updated successfully`,
      });
    })
    .catch(error => {
      console.error(`Error saving ${settingType} settings:`, error);
      toast({
        title: "Settings Save Failed",
        description: error.message,
        variant: "destructive",
      });
    });
  };
  
  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const onPasswordFormSubmit = (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    
    // Call API to change password
    fetch('/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to change password. Please check your current password.');
        }
        return res.json();
      })
      .then(() => {
        toast({
          title: "Password Changed",
          description: "Your password has been changed successfully.",
        });
        // Reset form
        passwordForm.reset();
      })
      .catch(error => {
        toast({
          title: "Password Change Failed",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsChangingPassword(false);
      });
  };

  // Function to reset all molds and mappings
  const resetAllMolds = () => {
    if (confirm("Are you sure you want to delete ALL molds and mappings? This cannot be undone.")) {
      fetch('/api/molds/reset/all', {
        method: 'DELETE',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast({
              title: 'Reset Successful',
              description: data.message,
            });
            // Reload molds and mappings
            setMolds([]);
            setMoldMappings([]);
            setSelectedMappingId(null);
            setSelectedMapping(null);
            setMappingMolds([]);
          } else {
            throw new Error(data.message || 'Failed to reset molds and mappings');
          }
        })
        .catch(error => {
          console.error('Error resetting molds:', error);
          toast({
            title: 'Reset Failed',
            description: error.message,
            variant: 'destructive'
          });
        });
    }
  };

  return (
    <MainLayout>
      {/* Force Delete Alert Dialog */}
      <AlertDialog open={showForceDeleteDialog} onOpenChange={setShowForceDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This mold is used in one or more mappings. Deleting it will remove it from all mappings 
              which might break instrument configurations that depend on this mold.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmForceDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Force Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Workshop Settings</CardTitle>
          <CardDescription>
            Configure your workshop workflow management system
          </CardDescription>
        </CardHeader>
        <CardContent>

          
          <Tabs defaultValue="materials" className="w-full mt-4 border-t pt-4">
            <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-8 md:grid-cols-none">
              <TabsTrigger value="shopify">Shopify Integration</TabsTrigger>
              <TabsTrigger value="serials">Serial Numbers</TabsTrigger>
              <TabsTrigger value="interface">Interface</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="molds">Molds</TabsTrigger>
              <TabsTrigger value="themes">Themes</TabsTrigger>
              <TabsTrigger value="user">User Settings</TabsTrigger>
              <TabsTrigger value="reference">Instruments Reference</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shopify" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Shopify API Key</Label>
                  <Input 
                    id="apiKey" 
                    value={shopifySettings.apiKey}
                    onChange={(e) => setShopifySettings({...shopifySettings, apiKey: e.target.value})}
                    placeholder="Enter your Shopify API key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input 
                    id="apiSecret" 
                    type="password"
                    value={shopifySettings.apiSecret}
                    onChange={(e) => setShopifySettings({...shopifySettings, apiSecret: e.target.value})}
                    placeholder="Enter your Shopify API secret"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeUrl">Store URL</Label>
                  <Input 
                    id="storeUrl" 
                    value={shopifySettings.storeUrl}
                    onChange={(e) => setShopifySettings({...shopifySettings, storeUrl: e.target.value})}
                    placeholder="your-store.myshopify.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                  <Select 
                    value={shopifySettings.syncInterval}
                    onValueChange={(value) => setShopifySettings({...shopifySettings, syncInterval: value})}
                  >
                    <SelectTrigger id="syncInterval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoSync">Auto-Sync New Orders</Label>
                    <Switch 
                      id="autoSync" 
                      checked={shopifySettings.autoSync}
                      onCheckedChange={(checked) => setShopifySettings({...shopifySettings, autoSync: checked})}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically import new orders from Shopify
                  </p>
                  <Button 
                    className="mt-2 bg-primary/80 hover:bg-primary/90" 
                    size="sm"
                    onClick={() => {
                      fetch('/api/import-shopify', { method: 'POST' })
                        .then(res => res.json())
                        .then(data => {
                          toast({
                            title: 'Orders Synced',
                            description: `Successfully processed orders from Shopify. ${data.newOrdersCount || 0} new orders imported.`,
                          });
                          // Refresh data
                          setTimeout(() => window.location.reload(), 1500);
                        })
                        .catch(err => {
                          toast({
                            title: 'Sync Failed',
                            description: 'Failed to sync with Shopify. Please try again.',
                            variant: 'destructive',
                          });
                        });
                    }}
                  >
                    Sync Now
                  </Button>
                </div>
              </div>
              
              <Button 
                className="bg-primary hover:bg-primary/90 mt-4"
                onClick={() => saveSettings('Shopify')}
              >
                Save Shopify Settings
              </Button>
            </TabsContent>
            
            <TabsContent value="serials" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Serial Number Prefix</Label>
                  <Input 
                    id="prefix" 
                    value={serialNumberSettings.prefix}
                    onChange={(e) => setSerialNumberSettings({...serialNumberSettings, prefix: e.target.value})}
                    maxLength={5}
                    placeholder="SW"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Short prefix for your workshop (e.g. SW for Stone Whistle)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="separator">Separator Character</Label>
                  <Input 
                    id="separator" 
                    value={serialNumberSettings.separator}
                    onChange={(e) => setSerialNumberSettings({...serialNumberSettings, separator: e.target.value})}
                    maxLength={1}
                    placeholder="-"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Character used to separate parts of the serial number
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearDigits">Year Format</Label>
                  <Select 
                    value={serialNumberSettings.yearDigits}
                    onValueChange={(value) => setSerialNumberSettings({...serialNumberSettings, yearDigits: value})}
                  >
                    <SelectTrigger id="yearDigits">
                      <SelectValue placeholder="Select year format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2-digit year (23)</SelectItem>
                      <SelectItem value="4">4-digit year (2023)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeMonth">Include Month in Serial</Label>
                    <Switch 
                      id="includeMonth" 
                      checked={serialNumberSettings.includeMonth}
                      onCheckedChange={(checked) => setSerialNumberSettings({...serialNumberSettings, includeMonth: checked})}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Include month number in serial (e.g. SW-2023-09-001)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resetCounter">Reset Counter Yearly</Label>
                    <Switch 
                      id="resetCounter" 
                      checked={serialNumberSettings.resetCounter}
                      onCheckedChange={(checked) => setSerialNumberSettings({...serialNumberSettings, resetCounter: checked})}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Reset sequential counter each year
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                <h3 className="text-sm font-medium mb-2">Serial Number Preview</h3>
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-mono bg-white dark:bg-gray-900 px-3 py-1 rounded border border-gray-300 dark:border-gray-600">
                    {serialNumberSettings.prefix}{serialNumberSettings.separator}
                    {serialNumberSettings.yearDigits === '2' ? '23' : '2023'}
                    {serialNumberSettings.includeMonth ? `${serialNumberSettings.separator}09` : ''}
                    {serialNumberSettings.separator}001
                  </div>
                </div>
              </div>
              
              <Button 
                className="bg-primary hover:bg-primary/90 mt-4"
                onClick={() => saveSettings('Serial Number')}
              >
                Save Serial Number Settings
              </Button>
            </TabsContent>
            
            <TabsContent value="interface" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultView">Default View</Label>
                  <Select 
                    value={interfaceSettings.defaultView}
                    onValueChange={(value) => setInterfaceSettings({...interfaceSettings, defaultView: value})}
                  >
                    <SelectTrigger id="defaultView">
                      <SelectValue placeholder="Select default view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production Board</SelectItem>
                      <SelectItem value="worksheet">Buildlist</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                      <SelectItem value="completed">Completed Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={interfaceSettings.language}
                    onValueChange={(value) => {
                      // Update both the interface settings and the app language context
                      setInterfaceSettings({...interfaceSettings, language: value});
                      setLanguage(value as LanguageCode);
                    }}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="nl">Dutch</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={interfaceSettings.dateFormat}
                    onValueChange={(value) => setInterfaceSettings({...interfaceSettings, dateFormat: value})}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemsPerPage">Items Per Page</Label>
                  <Select 
                    value={interfaceSettings.itemsPerPage}
                    onValueChange={(value) => setInterfaceSettings({...interfaceSettings, itemsPerPage: value})}
                  >
                    <SelectTrigger id="itemsPerPage">
                      <SelectValue placeholder="Select items per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="25">25 items</SelectItem>
                      <SelectItem value="50">50 items</SelectItem>
                      <SelectItem value="100">100 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                className="bg-primary hover:bg-primary/90 mt-4"
                onClick={() => saveSettings('Interface')}
              >
                Save Interface Settings
              </Button>
            </TabsContent>
            
            <TabsContent value="user" className="mt-6 space-y-4">
              <div className="max-w-md mx-auto">
                <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Current User</h3>
                    <p className="text-sm text-gray-500">Username: Reiger65</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Update your password to keep your account secure. Your password must be at least 8 characters long.
                    </p>
                    
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordFormSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your current password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter new password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90 w-full"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Changing Password...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="mt-6 space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Material Assignments</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure which bag and box sizes are used for each instrument type and tuning.
                    The system will automatically assign the appropriate materials based on these rules.
                  </p>
                  
                  {/* Custom material size management */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md mb-6">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Add Custom Bag Size</h4>
                      <div className="flex space-x-2">
                        <Input 
                          value={customBagSize}
                          onChange={(e) => setCustomBagSize(e.target.value)}
                          placeholder="Enter new bag size..."
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => {
                            if (customBagSize.trim() && !bagSizes.includes(customBagSize.trim())) {
                              setBagSizes([...bagSizes, customBagSize.trim()]);
                              setCustomBagSize('');
                              toast({
                                title: "Bag Size Added",
                                description: `New bag size "${customBagSize.trim()}" is now available for selection`,
                              });
                            } else if (bagSizes.includes(customBagSize.trim())) {
                              toast({
                                title: "Duplicate Bag Size",
                                description: "This bag size already exists in the list",
                                variant: "destructive"
                              });
                            }
                          }}
                          disabled={!customBagSize.trim()}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bagSizes.map(size => (
                          <Badge key={size} variant="outline" className="text-xs">
                            {size}
                            {size !== '-' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-red-500"
                                onClick={() => {
                                  setBagSizes(bagSizes.filter(s => s !== size));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Add Custom Box Size</h4>
                      <div className="flex space-x-2">
                        <Input 
                          value={customBoxSize}
                          onChange={(e) => setCustomBoxSize(e.target.value)}
                          placeholder="Enter new box size..."
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => {
                            if (customBoxSize.trim() && !boxSizes.includes(customBoxSize.trim())) {
                              setBoxSizes([...boxSizes, customBoxSize.trim()]);
                              setCustomBoxSize('');
                              toast({
                                title: "Box Size Added",
                                description: `New box size "${customBoxSize.trim()}" is now available for selection`,
                              });
                            } else if (boxSizes.includes(customBoxSize.trim())) {
                              toast({
                                title: "Duplicate Box Size",
                                description: "This box size already exists in the list",
                                variant: "destructive"
                              });
                            }
                          }}
                          disabled={!customBoxSize.trim()}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {boxSizes.map(size => (
                          <Badge key={size} variant="outline" className="text-xs">
                            {size}
                            {size !== '-' && size !== 'E~NVELOPE' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-red-500"
                                onClick={() => {
                                  setBoxSizes(boxSizes.filter(s => s !== size));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* INNATO Flutes */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-md font-semibold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md inline-block">
                    INNATO Flutes
                  </h4>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[30%]">Tuning/Note</TableHead>
                        <TableHead className="w-[30%]">Bag Size</TableHead>
                        <TableHead className="w-[30%]">Box Size</TableHead>
                        <TableHead className="w-[10%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialSettings.innato.map((setting, index) => (
                        <TableRow key={`innato-${index}`}>
                          <TableCell>
                            <Select
                              value={setting.tuning || ''}
                              onValueChange={(value) => updateMaterialMapping('innato', index, 'tuning', value)}
                            >
                              <SelectTrigger className="text-black bg-white">
                                <SelectValue className="text-black" />
                              </SelectTrigger>
                              <SelectContent>
                                {tuningOptions.innato.map(tuning => (
                                  <SelectItem key={`innato-tuning-${tuning}`} value={tuning}>{tuning}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={setting.bagSize}
                              onValueChange={(value) => updateMaterialMapping('innato', index, 'bagSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {bagSizes.map(size => (
                                  <SelectItem key={`innato-bag-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={setting.boxSize}
                              onValueChange={(value) => updateMaterialMapping('innato', index, 'boxSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {boxSizes.map(size => (
                                  <SelectItem key={`innato-box-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeMaterialRule('innato', index)}
                              disabled={materialSettings.innato.length <= 1}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addMaterialRule('innato')}
                    className="mt-2"
                  >
                    Add INNATO Rule
                  </Button>
                </div>

                {/* NATEY Flutes */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-md font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-md inline-block">
                    NATEY Flutes
                  </h4>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[30%]">Tuning/Note</TableHead>
                        <TableHead className="w-[30%]">Bag Size</TableHead>
                        <TableHead className="w-[30%]">Box Size</TableHead>
                        <TableHead className="w-[10%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialSettings.natey.map((setting, index) => (
                        <TableRow key={`natey-${index}`}>
                          <TableCell>
                            <Select
                              value={setting.tuning}
                              onValueChange={(value) => updateMaterialMapping('natey', index, 'tuning', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {tuningOptions.natey.map(tuning => (
                                  <SelectItem key={`natey-tuning-${tuning}`} value={tuning}>{tuning}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              value={setting.bagSize}
                              onChange={(e) => updateMaterialMapping('natey', index, 'bagSize', e.target.value)}
                            >
                              {bagSizes.map(size => (
                                <option key={`bag-${size}`} value={size}>{size}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              value={setting.boxSize}
                              onChange={(e) => updateMaterialMapping('natey', index, 'boxSize', e.target.value)}
                            >
                              {boxSizes.map(size => (
                                <option key={`box-${size}`} value={size}>{size}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeMaterialRule('natey', index)}
                              disabled={materialSettings.natey.length <= 1}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addMaterialRule('natey')}
                    className="mt-2"
                  >
                    Add NATEY Rule
                  </Button>
                </div>

                {/* ZEN Flutes */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-md font-semibold bg-teal-100 text-teal-800 px-3 py-1 rounded-md inline-block">
                    ZEN Flutes
                  </h4>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[30%]">Size</TableHead>
                        <TableHead className="w-[30%]">Bag Size</TableHead>
                        <TableHead className="w-[30%]">Box Size</TableHead>
                        <TableHead className="w-[10%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialSettings.zen.map((setting, index) => (
                        <TableRow key={`zen-${index}`}>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              value={setting.tuning}
                              onChange={(e) => updateMaterialMapping('zen', index, 'tuning', e.target.value)}
                            >
                              {tuningOptions.zen.map(tuning => (
                                <option key={`zen-tuning-${tuning}`} value={tuning}>{tuning}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={setting.bagSize}
                              onValueChange={(value) => updateMaterialMapping('zen', index, 'bagSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {bagSizes.map(size => (
                                  <SelectItem key={`bag-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={setting.boxSize}
                              onValueChange={(value) => updateMaterialMapping('zen', index, 'boxSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {boxSizes.map(size => (
                                  <SelectItem key={`box-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeMaterialRule('zen', index)}
                              disabled={materialSettings.zen.length <= 1}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addMaterialRule('zen')}
                    className="mt-2"
                  >
                    Add ZEN Rule
                  </Button>
                </div>

                {/* DOUBLE Flutes */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-md font-semibold bg-purple-100 text-purple-800 px-3 py-1 rounded-md inline-block">
                    DOUBLE Flutes
                  </h4>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[30%]">Tuning/Note</TableHead>
                        <TableHead className="w-[30%]">Bag Size</TableHead>
                        <TableHead className="w-[30%]">Box Size</TableHead>
                        <TableHead className="w-[10%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialSettings.double.map((setting, index) => (
                        <TableRow key={`double-${index}`}>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              value={setting.tuning}
                              onChange={(e) => updateMaterialMapping('double', index, 'tuning', e.target.value)}
                            >
                              {tuningOptions.double.map(tuning => (
                                <option key={`double-tuning-${tuning}`} value={tuning}>{tuning}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={setting.bagSize}
                              onValueChange={(value) => updateMaterialMapping('double', index, 'bagSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {bagSizes.map(size => (
                                  <SelectItem key={`bag-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={setting.boxSize}
                              onValueChange={(value) => updateMaterialMapping('double', index, 'boxSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {boxSizes.map(size => (
                                  <SelectItem key={`box-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeMaterialRule('double', index)}
                              disabled={materialSettings.double.length <= 1}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addMaterialRule('double')}
                    className="mt-2"
                  >
                    Add DOUBLE Rule
                  </Button>
                </div>

                {/* OvA Flutes */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-md font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md inline-block">
                    OvA Flutes
                  </h4>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[30%]">Tuning/Note</TableHead>
                        <TableHead className="w-[30%]">Bag Size</TableHead>
                        <TableHead className="w-[30%]">Box Size</TableHead>
                        <TableHead className="w-[10%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialSettings.ova.map((setting, index) => (
                        <TableRow key={`ova-${index}`}>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              value={setting.tuning}
                              onChange={(e) => updateMaterialMapping('ova', index, 'tuning', e.target.value)}
                            >
                              {tuningOptions.ova.map(tuning => (
                                <option key={`ova-tuning-${tuning}`} value={tuning}>{tuning}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={setting.bagSize}
                              onValueChange={(value) => updateMaterialMapping('ova', index, 'bagSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {bagSizes.map(size => (
                                  <SelectItem key={`bag-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={setting.boxSize}
                              onValueChange={(value) => updateMaterialMapping('ova', index, 'boxSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {boxSizes.map(size => (
                                  <SelectItem key={`box-${size}`} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeMaterialRule('ova', index)}
                              disabled={materialSettings.ova.length <= 1}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addMaterialRule('ova')}
                    className="mt-2"
                  >
                    Add OvA Rule
                  </Button>
                </div>

                {/* CARDS */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-md font-semibold bg-rose-100 text-rose-800 px-3 py-1 rounded-md inline-block">
                    CARDS
                  </h4>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[30%]">Type</TableHead>
                        <TableHead className="w-[30%]">Bag Size</TableHead>
                        <TableHead className="w-[30%]">Box Size</TableHead>
                        <TableHead className="w-[10%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialSettings.cards.map((setting, index) => (
                        <TableRow key={`cards-${index}`}>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              value={setting.tuning}
                              onChange={(e) => updateMaterialMapping('cards', index, 'tuning', e.target.value)}
                            >
                              {tuningOptions.cards.map(tuning => (
                                <option key={`cards-option-${tuning}`} value={tuning}>{tuning}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              value={setting.bagSize}
                              onChange={(e) => updateMaterialMapping('cards', index, 'bagSize', e.target.value)}
                            >
                              {bagSizes.map(size => (
                                <option key={`bag-option-${size}`} value={size}>{size}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-yellow-50"
                              value={setting.boxSize}
                              onChange={(e) => updateMaterialMapping('cards', index, 'boxSize', e.target.value)}
                            >
                              {/* Explicitly show Envelope first for CARDS */}
                              <option key="envelope-explicit" value="Envelope" style={{fontWeight: 'bold', backgroundColor: '#fef9c3'}}>
                                Envelope (Recommended for CARDS)
                              </option>
                              
                              {/* Then all other box sizes */}
                              {boxSizes
                                .filter(size => size !== 'Envelope') // Skip Envelope since we added it manually above
                                .map(size => (
                                  <option key={`box-option-${size}`} value={size}>{size}</option>
                                ))
                              }
                            </select>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeMaterialRule('cards', index)}
                              disabled={materialSettings.cards.length <= 1}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addMaterialRule('cards')}
                    className="mt-2"
                  >
                    Add CARDS Rule
                  </Button>
                </div>
                
                <Button 
                  className="bg-primary hover:bg-primary/90 mt-4"
                  onClick={() => saveSettings('Materials')}
                >
                  Save Material Settings
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="molds" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mold Inventory Management */}
                <Card className="p-5 overflow-hidden">
                  <CardHeader className="px-0 pt-0 flex justify-between items-start">
                    <div>
                      <CardTitle>Mold Inventory</CardTitle>
                      <CardDescription>Manage your workshop molds</CardDescription>
                    </div>
                    <Button variant="destructive" size="sm" onClick={resetAllMolds} className="ml-auto shrink-0">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset All Molds
                    </Button>
                  </CardHeader>
                  
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingMolds ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              </TableCell>
                            </TableRow>
                          ) : molds.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                No molds found. Add your first mold below.
                              </TableCell>
                            </TableRow>
                          ) : (
                            molds.map((mold) => {
                              // Find mold mappings that use this mold
                              const usedInMappings = moldMappings.filter(mapping => 
                                mappingMolds.some(mm => mm.moldId === mold.id && mm.mappingId === mapping.id)
                              );
                              
                              // Get unique instrument types where this mold is used
                              const uniqueInstrumentTypes = usedInMappings
                                .map(m => m.instrumentType)
                                .filter((type, index, self) => self.indexOf(type) === index);
                              
                              // Check if mold is used in multiple instrument types
                              const isMultiTypeUsage = uniqueInstrumentTypes.length > 1;
                              
                              return (
                                <TableRow key={mold.id}>
                                  <TableCell>
                                    {mold.name}
                                    {isMultiTypeUsage && (
                                      <Badge variant="outline" className="ml-2 text-xs bg-amber-100 text-amber-800 border-amber-200">
                                        Multi-use
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{mold.instrumentType}</TableCell>
                                  <TableCell>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => deleteMold(mold.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="moldName">Mold Name</Label>
                        <Input 
                          id="moldName"
                          value={newMold.name}
                          onChange={(e) => setNewMold({...newMold, name: e.target.value})}
                          placeholder="Enter mold name"
                        />
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="moldType">Instrument Type</Label>
                        <Select 
                          value={newMold.instrumentType}
                          onValueChange={(value) => setNewMold({...newMold, instrumentType: value})}
                        >
                          <SelectTrigger id="moldType">
                            <SelectValue placeholder="Select instrument type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INNATO">INNATO</SelectItem>
                            <SelectItem value="NATEY">NATEY</SelectItem>
                            <SelectItem value="ZEN">ZEN</SelectItem>
                            <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                            <SelectItem value="OvA">OvA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="moldNotes">Notes</Label>
                        <Input 
                          id="moldNotes"
                          value={newMold.notes}
                          onChange={(e) => setNewMold({...newMold, notes: e.target.value})}
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-primary hover:bg-primary/90 w-full"
                      onClick={createMold}
                      disabled={!newMold.name}
                    >
                      Add New Mold
                    </Button>
                  </div>
                </Card>
                
                {/* Mold Mappings */}
                <div className="space-y-6">
                  <Card className="p-5">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle>Mold Mappings</CardTitle>
                      <CardDescription>Define which molds are used for specific instrument tunings</CardDescription>
                    </CardHeader>
                    
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Instrument</TableHead>
                              <TableHead>Tuning</TableHead>
                              <TableHead>Molds</TableHead>
                              <TableHead className="w-[120px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingMappings ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                              </TableRow>
                            ) : moldMappings.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                  No mappings found. Add your first mold mapping below.
                                </TableCell>
                              </TableRow>
                            ) : (
                              moldMappings.map((mapping) => (
                                <TableRow key={mapping.id}>
                                  <TableCell>{mapping.name}</TableCell>
                                  <TableCell>{mapping.instrumentType}</TableCell>
                                  <TableCell>{mapping.tuningNote}</TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="link" 
                                      size="sm"
                                      onClick={() => loadMappingMolds(mapping.id)}
                                      className="p-0 h-6"
                                    >
                                      View Molds
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => deleteMoldMapping(mapping.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="mappingInstrument">Instrument Type</Label>
                          <Select 
                            value={newMapping.instrumentType}
                            onValueChange={(value) => {
                              // Reset tuning when instrument type changes
                              setNewMapping({
                                ...newMapping, 
                                instrumentType: value,
                                tuningNote: '',
                                name: value // Initially set name to instrument type, will be updated when tuning is selected
                              });
                            }}
                          >
                            <SelectTrigger id="mappingInstrument">
                              <SelectValue placeholder="Select instrument type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INNATO">INNATO</SelectItem>
                              <SelectItem value="NATEY">NATEY</SelectItem>
                              <SelectItem value="ZEN">ZEN</SelectItem>
                              <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                              <SelectItem value="OvA">OvA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mappingTuning">Tuning Note</Label>
                          <Select 
                            value={newMapping.tuningNote}
                            onValueChange={(value) => {
                              // Auto-generate mapping name when tuning is selected
                              const generatedName = `${newMapping.instrumentType} ${value}`;
                              setNewMapping({
                                ...newMapping, 
                                tuningNote: value,
                                name: generatedName
                              });
                            }}
                          >
                            <SelectTrigger id="mappingTuning">
                              <SelectValue placeholder="Select tuning" />
                            </SelectTrigger>
                            <SelectContent>
                              {tuningOptions[newMapping.instrumentType.toLowerCase() as keyof typeof tuningOptions]?.map((tuning) => (
                                <SelectItem key={tuning} value={tuning}>{tuning}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        className="bg-primary hover:bg-primary/90 w-full"
                        onClick={createMoldMapping}
                        disabled={!newMapping.tuningNote}
                      >
                        Create New Mapping
                      </Button>
                    </div>
                  </Card>
                  
                  {selectedMappingId && (
                    <Card className="p-5">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle>Mapping Molds</CardTitle>
                        <CardDescription>
                          {moldMappings.find(m => m.id === selectedMappingId)?.name || 'Selected Mapping'}
                        </CardDescription>
                      </CardHeader>
                      
                      <div className="space-y-4">
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Mold Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead className="w-[80px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mappingMolds.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                    No molds assigned to this mapping yet. Add molds below.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                mappingMolds.map((item, index) => {
                                  // Log de mapping mold item voor debugging
                                  console.log(`Rendering mapping mold item:`, item);
                                  
                                  return (
                                    <TableRow key={item.id || `temp-${index}`}>
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell>
                                        {item.name}
                                        {item.instrumentType !== selectedMapping?.instrumentType && (
                                          <span className="ml-1 text-xs text-muted-foreground">
                                            ({item.instrumentType})
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>{item.size}</TableCell>
                                      <TableCell>
                                        <Button 
                                          size="icon" 
                                          variant="ghost"
                                          onClick={() => {
                                            // Voeg extra logging toe
                                            console.log(`Attempting to remove mold mapping item with ID: ${item.id}`);
                                            // Zorg ervoor dat we item.id alleen gebruiken als het een getal is en > 0
                                            if (item.id && typeof item.id === 'number' && item.id > 0) {
                                              removeMoldFromMapping(item.id);
                                            } else {
                                              console.error('Invalid mold mapping item ID:', item.id);
                                              toast({
                                                title: 'Error Removing Mold',
                                                description: 'Invalid mapping item ID',
                                                variant: 'destructive'
                                              });
                                            }
                                          }}
                                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t">
                          <Label>Add Mold to Mapping</Label>
                          <div className="flex space-x-2">
                            <Select onValueChange={(value) => {
                              const moldId = parseInt(value);
                              if (moldId && selectedMappingId) {
                                addMoldToMapping(selectedMappingId, moldId);
                              }
                            }}>
                              <SelectTrigger className="flex-grow">
                                <SelectValue placeholder="Select a mold to add" />
                              </SelectTrigger>
                              <SelectContent>
                                {molds
                                  // Only filter out molds already in THIS mapping
                                  // Allow molds to be reused across different instrument types
                                  .filter(mold => !mappingMolds.some(mm => mm.moldId === mold.id))
                                  .map(mold => (
                                    <SelectItem key={mold.id} value={mold.id.toString()}>
                                      {mold.name} ({mold.instrumentType})
                                      {mold.instrumentType !== selectedMapping?.instrumentType && 
                                        " - Reuse from different type"}
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="themes" className="mt-6 space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Interface Theme</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose a theme that works best for your workshop environment. Different themes affect colors, contrast, spacing, and font size.
                  </p>
                  
                  <ThemeSwitcher />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="user" className="mt-6 space-y-4">
              <div className="max-w-md mx-auto">
                <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Current User</h3>
                    <p className="text-sm text-gray-500">Username: Reiger65</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Update your password to maintain secure access to the workshop system.
                    </p>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordFormSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Change Password
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reference" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Instrument Reference Guide</CardTitle>
                  <CardDescription>
                    Comprehensive note reference and tuning adjustments for all Stonewhistle instruments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      <div className="w-full md:w-1/3">
                        <Label htmlFor="referenceInstrumentType">Instrument Type</Label>
                        <Select 
                          value={referenceInstrumentType}
                          onValueChange={(value) => setReferenceInstrumentType(value)}
                        >
                          <SelectTrigger id="referenceInstrumentType">
                            <SelectValue placeholder="Select Instrument Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="innato">Innato</SelectItem>
                            <SelectItem value="natey">Natey</SelectItem>
                            <SelectItem value="double">Double</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-full md:w-1/3">
                        <Label htmlFor="referenceKey">Tuning Key</Label>
                        <Select 
                          value={referenceKey}
                          onValueChange={(value) => setReferenceKey(value)}
                        >
                          <SelectTrigger id="referenceKey">
                            <SelectValue placeholder="Select Tuning Key" />
                          </SelectTrigger>
                          <SelectContent>
                            {tuningOptions[referenceInstrumentType as keyof typeof tuningOptions]?.map(key => (
                              <SelectItem key={key} value={key}>{key}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Innato Reference */}
                    {referenceInstrumentType === 'innato' && (
                      <div className="space-y-6">
                        <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                          <h3 className="text-lg font-semibold mb-2">INNATO {referenceKey}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            The Innato has three vessels with different notes. On all Innato flutes, 
                            the minor third (Eb), fourth (F), minor seventh (Bb), and Bb3 notes require +10 cents adjustment.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Left Vessel */}
                            <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
                              <h4 className="font-medium border-b pb-1 mb-2">Left Vessel</h4>
                              <div className="space-y-2">
                                {referenceKey === 'Cm4' ? (
                                  // Hardcoded notes for Cm4
                                  <>
                                    {['G3', 'Bb3', 'C4', 'D4'].map(note => {
                                      const adjustmentKey = `innato.Cm4.${note}`;
                                      const defaultAdjustment = noteTuningAdjustments.innato.Cm4[note] || 0;
                                      return (
                                        <div key={note} className="flex items-center justify-between">
                                          <span className="font-mono">{note}</span>
                                          <div className="flex items-center space-x-2">
                                            <input 
                                              type="number" 
                                              className="w-16 p-1 text-xs border rounded"
                                              value={defaultAdjustment}
                                              onChange={(e) => updateNoteAdjustment('innato', 'Cm4', note, parseInt(e.target.value, 10))}
                                              min="-50"
                                              max="50"
                                              step="1"
                                            />
                                            <span className="text-xs text-slate-500">cents</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </>
                                ) : (
                                  <p className="text-sm text-slate-500">Please select Cm4 to see specific note adjustments for this example</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Right Vessel */}
                            <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
                              <h4 className="font-medium border-b pb-1 mb-2">Right Vessel</h4>
                              <div className="space-y-2">
                                {referenceKey === 'Cm4' ? (
                                  // Hardcoded notes for Cm4
                                  <>
                                    {['C4', 'D#4', 'F4', 'G4'].map(note => {
                                      const noteKey = note === 'C4' ? 'C4_right' : note;
                                      const defaultAdjustment = noteTuningAdjustments.innato.Cm4[noteKey] || 0;
                                      return (
                                        <div key={note} className="flex items-center justify-between">
                                          <span className="font-mono">{note}</span>
                                          <div className="flex items-center space-x-2">
                                            <input 
                                              type="number" 
                                              className="w-16 p-1 text-xs border rounded"
                                              value={defaultAdjustment}
                                              onChange={(e) => updateNoteAdjustment('innato', 'Cm4', noteKey, parseInt(e.target.value, 10))}
                                              min="-50"
                                              max="50"
                                              step="1"
                                            />
                                            <span className="text-xs text-slate-500">cents</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </>
                                ) : (
                                  <p className="text-sm text-slate-500">Please select Cm4 to see specific note adjustments for this example</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Front Vessel */}
                            <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
                              <h4 className="font-medium border-b pb-1 mb-2">Front Vessel</h4>
                              <div className="space-y-2">
                                {referenceKey === 'Cm4' ? (
                                  // Hardcoded notes for Cm4
                                  <>
                                    {['G4', 'Bb4', 'C5', 'D5'].map(note => {
                                      const noteKey = note === 'G4' ? 'G4_front' : note;
                                      const defaultAdjustment = noteTuningAdjustments.innato.Cm4[noteKey] || 0;
                                      return (
                                        <div key={note} className="flex items-center justify-between">
                                          <span className="font-mono">{note}</span>
                                          <div className="flex items-center space-x-2">
                                            <input 
                                              type="number" 
                                              className="w-16 p-1 text-xs border rounded"
                                              value={defaultAdjustment}
                                              onChange={(e) => updateNoteAdjustment('innato', 'Cm4', noteKey, parseInt(e.target.value, 10))}
                                              min="-50"
                                              max="50"
                                              step="1"
                                            />
                                            <span className="text-xs text-slate-500">cents</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </>
                                ) : (
                                  <p className="text-sm text-slate-500">Please select Cm4 to see specific note adjustments for this example</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 border rounded bg-yellow-50 dark:bg-yellow-900/30">
                            <h4 className="font-medium mb-1">Important Tuning Rules:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>The minor third and fourth intervals need +10 cents adjustment</li>
                              <li>The minor seventh interval needs +10 cents adjustment</li>
                              <li>The Bb3 note (or equivalent in other keys) on left vessel needs +10 cents adjustment</li>
                              <li>These adjustments apply to all Innato flutes, and are consistent across different keys</li>
                              <li>The only difference between flutes of the same type is their key</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Natey Reference */}
                    {referenceInstrumentType === 'natey' && (
                      <div className="space-y-6">
                        <div className="p-4 border rounded-md bg-teal-50 dark:bg-teal-900/30">
                          <h3 className="text-lg font-semibold mb-2">NATEY {referenceKey}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            The Natey has a single vessel with 8 available notes. The tuning principles remain consistent across all Natey flutes regardless of key.
                          </p>
                          
                          <div className="mb-4 p-3 border rounded bg-yellow-50 dark:bg-yellow-900/30">
                            <h4 className="font-medium mb-1">Natey Flute Tuning Rules:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>The Natey follows the same tuning principles in all keys</li>
                              <li>The note pattern shown here applies consistently across all Natey flutes</li>
                              <li>Only the key (tonal center) changes between different Natey flutes</li>
                            </ul>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {/* Single Vessel */}
                            <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
                              <h4 className="font-medium border-b pb-1 mb-2">8 Notes - Single Vessel</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {(() => {
                                  // Define standard Natey notes based on key
                                  const nateyNotes = {
                                    'Am4': ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'B5', 'C6'],
                                    'G#m4': ['G#4', 'B4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5', 'B5'],
                                    'Gm4': ['G4', 'Bb4', 'C5', 'D5', 'F5', 'G5', 'A5', 'Bb5'],
                                    'F#m4': ['F#4', 'A4', 'B4', 'C#5', 'E5', 'F#5', 'G#5', 'A5'],
                                    'Fm4': ['F4', 'G#4', 'Bb4', 'C5', 'D#5', 'F5', 'G5', 'G#5'],
                                    'Em4': ['E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'G5'],
                                    'D#m4': ['D#4', 'F#4', 'G#4', 'Bb4', 'C#5', 'D#5', 'F5', 'F#5'],
                                    'Dm4': ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'E5', 'F5'],
                                    'C#m4': ['C#4', 'E4', 'F#4', 'G#4', 'B4', 'C#5', 'D#5', 'E5'],
                                    'Cm4': ['C4', 'D#4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'D#5'],
                                    'Bm3': ['B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'C#5', 'D5'],
                                    'Bbm3': ['Bb3', 'C#4', 'D#4', 'F4', 'G#4', 'Bb4', 'C5', 'C#5'],
                                    'Am3': ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'B4', 'C5'],
                                    'G#m3': ['G#3', 'B3', 'C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'B4'],
                                    'Gm3': ['G3', 'Bb3', 'C4', 'D4', 'F4', 'G4', 'A4', 'Bb4']
                                  };
                                  
                                  // Get notes for current key, or use a default pattern
                                  const notes = nateyNotes[referenceKey as keyof typeof nateyNotes] || 
                                    ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
                                  
                                  return notes.map((note, index) => {
                                    // Construct lookup key
                                    const adjustKey = `natey.${referenceKey}.${note}`;
                                    // Get adjustment value with a default of 0
                                    const noteAdjustment = 
                                      noteTuningAdjustments.natey[referenceKey as keyof typeof noteTuningAdjustments.natey]?.[note] || 
                                      0;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between p-2 border rounded bg-teal-50">
                                        <span className="font-mono">{note}</span>
                                        <div className="flex items-center space-x-2">
                                          <input 
                                            type="number" 
                                            className="w-16 p-1 text-xs border rounded"
                                            value={noteAdjustment}
                                            onChange={(e) => updateNoteAdjustment('natey', referenceKey, note, parseInt(e.target.value, 10))}
                                            min="-50"
                                            max="50"
                                            step="1"
                                          />
                                          <span className="text-xs text-slate-500">cents</span>
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Double Flute Reference */}
                    {referenceInstrumentType === 'double' && (
                      <div className="space-y-6">
                        <div className="p-4 border rounded-md bg-purple-50 dark:bg-purple-900/30">
                          <h3 className="text-lg font-semibold mb-2">DOUBLE {referenceKey}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            The Double flute has two equal chambers, each with 6 notes. For example, in Cm4 tuning, both chambers have (C, D#, F, G, Bb, C). This note pattern is consistent across all Double flutes, with only the key changing.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Chamber 1 */}
                            <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
                              <h4 className="font-medium border-b pb-1 mb-2">Chamber 1</h4>
                              <div className="space-y-2">
                                {referenceKey === 'Cm4' ? (
                                  // Hardcoded notes for Cm4
                                  <>
                                    {['C4', 'D#4', 'F4', 'G4', 'Bb4', 'C5'].map(note => {
                                      const defaultAdjustment = noteTuningAdjustments.double.Cm4[note] || 0;
                                      return (
                                        <div key={note} className="flex items-center justify-between">
                                          <span className="font-mono">{note}</span>
                                          <div className="flex items-center space-x-2">
                                            <input 
                                              type="number" 
                                              className="w-16 p-1 text-xs border rounded"
                                              value={defaultAdjustment}
                                              onChange={(e) => updateNoteAdjustment('double', 'Cm4', note, parseInt(e.target.value, 10))}
                                              min="-50"
                                              max="50"
                                              step="1"
                                            />
                                            <span className="text-xs text-slate-500">cents</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </>
                                ) : (
                                  <p className="text-sm text-slate-500">Please select Cm4 to see specific note adjustments for this example</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Chamber 2 - Same notes as Chamber 1 */}
                            <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
                              <h4 className="font-medium border-b pb-1 mb-2">Chamber 2</h4>
                              <div className="space-y-2">
                                {referenceKey === 'Cm4' ? (
                                  <p className="text-sm">Same notes and adjustments as Chamber 1</p>
                                ) : (
                                  <p className="text-sm text-slate-500">Please select Cm4 to see specific note adjustments for this example</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 border rounded bg-yellow-50 dark:bg-yellow-900/30">
                            <h4 className="font-medium mb-1">Double Flute Tuning Rules:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>Similar to Innato, the minor third and fourth intervals need +10 cents adjustment in all keys</li>
                              <li>The minor seventh interval needs +10 cents adjustment in all keys</li>
                              <li>The tuning principles are consistent across all Double flutes regardless of key</li>
                              <li>Both chambers have identical notes and require the same adjustments</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
