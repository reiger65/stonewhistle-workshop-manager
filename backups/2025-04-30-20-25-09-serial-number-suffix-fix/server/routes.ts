import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  orderStatusEnum, insertOrderSchema, insertOrderItemSchema, 
  insertProductionNoteSchema, insertMaterialInventorySchema, 
  insertMaterialMappingRuleSchema, insertInstrumentInventorySchema,
  insertMoldInventorySchema, insertMoldMappingSchema, insertMoldMappingItemSchema,
  OrderStatus, OrderItem, MoldInventory, MoldMapping, MoldMappingItem,
  moldInventory, moldMappingItems, Order, productionNotes, ProductionNote
} from "@shared/schema";
import { getTrackingInfoByOrderNumber, batchGetTrackingInfo, getOrderStatusByOrderNumber } from "./parcelparcels";
import { format } from "date-fns";
import { syncShopifyOrders, fetchFulfillmentData, fetchShopifyOrders, extractSpecifications, loadShopifyLineItemMappings } from "./shopify";
import { registerSpecialRoutes } from './special-routes';
import { setupAuth } from "./auth";
import fs from 'fs';
import path from 'path';
import { eq, sql } from 'drizzle-orm';
import { checkSerialNumberInDatabase, getSpecificationsFromDatabase, SERIAL_NUMBER_DATABASE } from '../shared/serial-number-database';
import { db } from './db';
import backupRoutes from './backup-routes.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // Laad alle Shopify line item -> serienummer mappings uit de database
  // zodat serienummers consistent blijven tussen server herstarts
  await loadShopifyLineItemMappings();

  // Set up authentication routes
  setupAuth(app);
  
  // Registreer backup routes
  app.use('/api/backup', backupRoutes);
  
  // Registreer speciale routes voor order synchronisatie
  registerSpecialRoutes(app);
  
  const httpServer = createServer(app);

  // Helper function to generate serial numbers
  function generateSerialNumber(orderNumber: string, itemIndex: number): string {
    return `${orderNumber}-${itemIndex + 1}`;
  }
  
  // Authentication middleware to protect routes
  function isAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  }

  // Get all orders (beperkt tot afgelopen 6 maanden voor betere prestaties)
  app.get("/api/orders", async (req, res) => {
    try {
      // Default beperking tot de afgelopen 6 maanden
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Alleen recente orders ophalen, tenzij anders aangegeven met een query parameter
      const showAll = req.query.all === 'true';
      
      console.log(`Fetching orders ${showAll ? 'without' : 'with'} 6-month time limit`);
      
      const orders = showAll 
        ? await storage.getOrders() 
        : await storage.getOrdersSince(sixMonthsAgo);
      
      res.json(orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get orders by status
  app.get("/api/orders/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      
      // Validate status
      const parsedStatus = orderStatusEnum.safeParse(status);
      if (!parsedStatus.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const orders = await storage.getOrdersByStatus(parsedStatus.data);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders by status" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Create new order
  app.post("/api/orders", async (req, res) => {
    try {
      const parsedData = insertOrderSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: parsedData.error.format() 
        });
      }
      
      const order = await storage.createOrder(parsedData.data);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Update order
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Validate the update data
      const updateData = req.body;
      const updatedOrder = await storage.updateOrder(id, updateData);
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const statusSchema = z.object({ status: orderStatusEnum });
      const parsedData = statusSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid status", 
          errors: parsedData.error.format() 
        });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, parsedData.data.status);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  
  // Update order status flag (for spreadsheet-like view)
  app.patch("/api/orders/:id/status-flag", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const statusSchema = z.object({ 
        status: z.string(), 
        checked: z.boolean() 
      });
      const parsedData = statusSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid status flag data", 
          errors: parsedData.error.format() 
        });
      }
      
      const { status, checked } = parsedData.data;
      
      // Get the current order
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Create or update the statusChangeDates object
      const updatedDates = { ...(order.statusChangeDates || {}) };
      const updateData: any = {};
      
      if (checked) {
        // If checkbox is checked, add date to statusChangeDates
        const currentDate = new Date();
        const isoString = currentDate.toISOString();
        updatedDates[status] = isoString;
        
        // For BUILD checkbox, also update the buildDate field
        if (status === 'building') {
          console.log(`Setting buildDate to ISO string: ${isoString}`);
          // Store as ISO string to avoid Date serialization issues
          updateData.buildDate = isoString;
        }
      } else {
        // If checkbox is unchecked, remove date from statusChangeDates
        delete updatedDates[status];
        
        // For BUILD checkbox, also clear the buildDate field
        if (status === 'building') {
          console.log(`Clearing buildDate field`);
          updateData.buildDate = null;
        }
      }
      
      // Update statusChangeDates
      updateData.statusChangeDates = updatedDates;
      
      // Update the order with modified statusChangeDates and possibly buildDate
      const updatedOrder = await storage.updateOrder(id, updateData);
      
      // Return the updated order or the original order if update failed
      return res.json(updatedOrder || order);
    } catch (error) {
      console.error("Error updating status flag:", error);
      res.status(500).json({ message: "Failed to update order status flag" });
    }
  });

  // Get all order items (for the worksheet view) (beperkt tot afgelopen 6 maanden voor betere prestaties)
  app.get("/api/order-items", async (req, res) => {
    try {
      console.log(`\n‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒‒`);
      console.log(`📋 SERIENUMMERS: Fetching order items`);
      console.log(`🔑 SERIENUMMER DATABASE: ${Object.keys(SERIAL_NUMBER_DATABASE).length} vaste serienummers in database`);
      
      // Speciale debug voor SW-1542-2 - BELANGRIJK
      const sw1542_2 = SERIAL_NUMBER_DATABASE['SW-1542-2'];
      if (sw1542_2) {
        console.log(`🔍 SW-1542-2 in database? JA! Type=${sw1542_2.type} Tuning=${sw1542_2.tuning}`);
        // Extra check om zeker te weten dat dit correct is
        console.log(`📋 SERIENUMMER SPECS SW-1542-2: ${JSON.stringify(sw1542_2)}`);
      } else {
        console.log(`🔍 SW-1542-2 in database? NEE!`);
      }
      
      console.log(`✅ SERIENUMMERS worden nu gecontroleerd tegen database voor permanente toewijzingen`);
      
      // Tijdelijk: gebruik gewoon alle orders zonder filtering
      // We zullen de 6-maanden filtering weer inschakelen zodra de SQL-problemen zijn opgelost
      
      // Get all orders without filtering for now
      const allOrders = await storage.getOrders();
      
      // Gebruik de serienummerdatabase om waardes consistent te houden voor serienummers
      // Dit zorgt ervoor dat dezelfde fluit ALTIJD dezelfde gegevens toont ongeacht filterinstellingen
      
      // Als dit nog steeds nodig is, kunnen we javascript-side filteren
      // Dit is een tijdelijke noodoplossing om de app werkend te houden
      
      // Gebruik een Set om unieke item ids bij te houden, dit helpt dubbele invoegingen te voorkomen
      const processedItemIds = new Set<number>();
      const allItems: OrderItem[] = [];
      
      console.log(`Fetching items for ${allOrders.length} orders`);
      
      // SPECIALE BILLY-ORDER FIX: Na grondig database-onderzoek en het controleren van de Shopify screenshots,
      // weten we dat er in database per Billy order 4 items staan, terwijl er in Shopify maar 2 
      // zichtbare items per order zijn. De andere 2 items zijn gemarkeerd als "Removed" in Shopify.
      // We moeten dus alleen de actieve/geldige items tonen.
      
      // Deze filter bepaalt welke items we voor de Billy orders willen tonen
      // Volgens de screenshots: 
      // For each order, get its items and add to our array in chronological order
      for (const order of allOrders) {
        
        const items = await storage.getOrderItems(order.id);
        
        // Normaliseer orderId naar nummer voordat het naar de client wordt gestuurd
        const normalizedItems = items.map(item => {
          const normalizedItem = { ...item };
          normalizedItem.orderId = Number(normalizedItem.orderId);
          return normalizedItem;
        });
        
        // VERBETERDE DIAGNOSTISCHE LOGGING - controleer statusChangeDates per item
        for (const item of normalizedItems) {
          if (item.statusChangeDates) {
            // Log items met BUILD checkbox
            if (typeof item.statusChangeDates === 'object' && 'building' in item.statusChangeDates) {
              console.log(`ORDER ITEM [${item.serialNumber || item.id}] heeft BUILD checkbox aangevinkt op ${item.statusChangeDates.building}`);
            }
            
            // Log ook andere checkboxes
            if (typeof item.statusChangeDates === 'object') {
              const statusKeys = Object.keys(item.statusChangeDates);
              if (statusKeys.length > 0) {
                console.log(`ORDER ITEM [${item.serialNumber || item.id}] heeft deze checkboxes: ${statusKeys.join(', ')}`);
              }
            }
          }
        }
        
        // DUPLICATE CHECK & BILLY-ORDER FIX: Filter items op basis van ons inzicht van de Shopify screenshots
        for (const item of normalizedItems) {
          // Skip als we dit item-id al hebben verwerkt
          if (processedItemIds.has(item.id)) {
            console.log(`[DEDUPLICATIE SERVER] Vermijden dubbele toevoeging van item ${item.id} (${item.serialNumber}) voor order ${item.orderId}`);
            continue;
          }
          
          // We gebruiken nu de generieke Shopify synchronisatie om verwijderde items bij te houden
          // Deze automatische synchronisatie verwijdert items die in Shopify als "removed" zijn gemarkeerd (fulfillable_quantity = 0)
          
          // NIEUWE STAP: Controleer serienummer in de database en pas specificaties aan indien nodig
          if (item.serialNumber && checkSerialNumberInDatabase(item.serialNumber)) {
            // Haal specificaties op uit de database
            const dbSpecs = getSpecificationsFromDatabase(item.serialNumber);
            
            if (dbSpecs) {
              console.log(`✅ SERIENUMMER DATABASE: ${item.serialNumber} gevonden, vaste waardes toepassen`);
              
              // Speciale debug voor SW-1542-2
              if (item.serialNumber === 'SW-1542-2') {
                console.log(`📋 SERIENUMMER SPECS SW-1542-2: ${JSON.stringify(dbSpecs)}`);
                console.log(`🔄 SERIENUMMER VOORHEEN: itemType=${item.itemType}, tuningType=${item.tuningType}`);
              }
              
              // Update item met definitieve database-specificaties
              item.itemType = `${dbSpecs.type} ${dbSpecs.tuning}`;  // VERBETERD: Combineer type en tuning in het itemType veld
              item.tuningType = dbSpecs.tuning;
              
              // Update frequency
              if (dbSpecs.frequency) {
                // Zorg ervoor dat specifications object bestaat
                if (!item.specifications) {
                  item.specifications = {};
                } else if (typeof item.specifications === 'string') {
                  try {
                    item.specifications = JSON.parse(item.specifications);
                  } catch (e) {
                    item.specifications = {};
                  }
                }
                
                // Update item specificaties voor volledige consistentie
                item.specifications.fluteType = dbSpecs.type;
                item.specifications.type = dbSpecs.type;
                item.specifications.model = dbSpecs.type;
                item.specifications.tuning = dbSpecs.tuning;
                
                // Update frequency in specifications
                item.specifications.frequency = dbSpecs.frequency;
                item.specifications.tuningFrequency = dbSpecs.frequency;
              }
              
              // Update kleur als deze bestaat
              if (dbSpecs.color) {
                item.color = dbSpecs.color;
                
                if (typeof item.specifications === 'object') {
                  item.specifications.color = dbSpecs.color;
                }
              }
              
              // Speciale debug voor SW-1542-2 na update
              if (item.serialNumber === 'SW-1542-2') {
                console.log(`🔄 SERIENUMMER NADERHAND: itemType=${item.itemType}, tuningType=${item.tuningType}`);
                console.log(`🔍 VERRIJKTE SPECS: ${JSON.stringify(item.specifications)}`);
              }
            }
          }
          
          // Voeg item toe aan allItems en markeer als verwerkt
          allItems.push(item);
          processedItemIds.add(item.id);
        }
      }
      
      // Debug log voor totaal aantal items
      
      console.log(`Totaal aantal items: ${allItems.length}`);
      
      // Stuur geen 304 maar dwing een nieuwe respons af
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(allItems);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch all order items" });
    }
  });
  
  // Get order items for a specific order
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const items = await storage.getOrderItems(orderId);
      
      // NORMALISEER ALLE ORDER ID'S VOOR CONSISTENTIE EN CONTROLEER SERIENUMMERS
      const normalizedItems = items.map(item => {
        const normalizedItem = { ...item };
        normalizedItem.orderId = Number(normalizedItem.orderId);
        
        // Normale controle serienummer in database
        if (normalizedItem.serialNumber && checkSerialNumberInDatabase(normalizedItem.serialNumber)) {
          // Haal specificaties op uit de database
          const dbSpecs = getSpecificationsFromDatabase(normalizedItem.serialNumber);
          
          if (dbSpecs) {
            console.log(`✅ DETAIL VIEW - SERIENUMMER DATABASE: ${normalizedItem.serialNumber} gevonden, vaste waardes toepassen`);
            
            // Update item met definitieve database-specificaties 
            normalizedItem.itemType = `${dbSpecs.type} ${dbSpecs.tuning}`;  // VERBETERD: Combineer type en tuning in het itemType veld
            normalizedItem.tuningType = dbSpecs.tuning;
            
            // Update frequency
            if (dbSpecs.frequency) {
              // Zorg ervoor dat specifications object bestaat
              if (!normalizedItem.specifications) {
                normalizedItem.specifications = {};
              } else if (typeof normalizedItem.specifications === 'string') {
                try {
                  normalizedItem.specifications = JSON.parse(normalizedItem.specifications);
                } catch (e) {
                  normalizedItem.specifications = {};
                }
              }
              
              // Update frequency in specifications
              normalizedItem.specifications.frequency = dbSpecs.frequency;
              normalizedItem.specifications.tuningFrequency = dbSpecs.frequency;
            }
            
            // Update kleur als deze bestaat
            if (dbSpecs.color) {
              normalizedItem.color = dbSpecs.color;
              
              if (typeof normalizedItem.specifications === 'object') {
                normalizedItem.specifications.color = dbSpecs.color;
              }
            }
          }
        }
        
        return normalizedItem;
      });
      
      res.json(normalizedItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  // Create order item
  app.post("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const parsedData = insertOrderItemSchema.safeParse({
        ...req.body,
        orderId
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid item data", 
          errors: parsedData.error.format() 
        });
      }
      
      // Auto-generate serial number if not provided
      if (!parsedData.data.serialNumber) {
        const existingItems = await storage.getOrderItems(orderId);
        parsedData.data.serialNumber = generateSerialNumber(
          order.orderNumber, 
          existingItems.length
        );
      }
      
      // Apply material settings based on instrument type and tuning
      try {
        console.log('Applying material settings to new item');
        
        if (parsedData.data.itemType && parsedData.data.tuningType) {
          // Get current settings
          if (fs.existsSync(SETTINGS_FILE)) {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
            
            if (settings && settings.materialSettings) {
              const itemType = parsedData.data.itemType;
              const tuningType = parsedData.data.tuningType;
              
              // Normalize the instrument type to match the settings keys
              const normalizedType = itemType.toLowerCase().replace('_', '');
              
              // Get settings for this instrument type
              const typeSettings = settings.materialSettings[normalizedType];
              if (typeSettings && typeSettings.length) {
                // Find a setting that matches the tuning
                let matchedSetting = typeSettings.find((setting: any) => 
                  setting.tuning === tuningType || 
                  setting.tuning.includes(tuningType)
                );
                
                // If no match found, use the default setting
                if (!matchedSetting) {
                  matchedSetting = typeSettings.find((setting: any) => setting.tuning === 'default');
                }
                
                if (matchedSetting) {
                  console.log(`Found material setting for ${normalizedType} - ${tuningType}:`, matchedSetting);
                  
                  // Apply the material settings
                  parsedData.data.boxSize = matchedSetting.boxSize;
                  parsedData.data.bagSize = matchedSetting.bagSize;
                  
                  // Update specifications
                  if (!parsedData.data.specifications) {
                    parsedData.data.specifications = {};
                  }
                  
                  // Ensure specifications is an object
                  let specs = parsedData.data.specifications;
                  if (typeof specs === 'string') {
                    try {
                      specs = JSON.parse(specs);
                    } catch (e) {
                      specs = {};
                    }
                  }
                  
                  specs = {
                    ...specs,
                    'Box Size': matchedSetting.boxSize,
                    'Bag Size': matchedSetting.bagSize
                  };
                  
                  parsedData.data.specifications = specs;
                  
                  console.log('Applied material settings to new item:', {
                    boxSize: parsedData.data.boxSize,
                    bagSize: parsedData.data.bagSize,
                    specifications: parsedData.data.specifications
                  });
                } else {
                  console.warn(`No material setting found for ${normalizedType} with tuning ${tuningType}`);
                }
              } else {
                console.warn(`No material settings for instrument type: ${normalizedType}`);
              }
            } else {
              console.warn('No material settings found in settings file');
            }
          } else {
            console.warn('Settings file not found, using default settings');
          }
        } else {
          console.warn('Cannot apply material settings: item is missing itemType or tuningType');
        }
      } catch (settingsError) {
        console.error('Error applying material settings to new item:', settingsError);
      }
      
      const item = await storage.createOrderItem(parsedData.data);
      console.log(`Successfully created order item with ID ${item.id}`);
      res.status(201).json(item);
    } catch (error: any) {
      console.error('Failed to create order item:', error);
      res.status(500).json({ 
        message: "Failed to create order item",
        details: error.message || String(error)
      });
    }
  });

  // Update order item
  app.patch("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const item = await storage.getOrderItemById(id);
      if (!item) {
        return res.status(404).json({ message: "Order item not found" });
      }
      
      // KRITISCHE FIX: Forceer orderId naar een nummer
      if (item && typeof item.orderId === 'string') {
        item.orderId = Number(item.orderId);
        console.log(`[SERVER PATCH BILLY FIX] Normaliseer item ${item.serialNumber} orderId naar nummer: ${item.orderId}`);
      }
      
      // Log the update operation
      console.log(`Updating order item ${id}:`, JSON.stringify(req.body));
      
      // Clean up the request body to remove any undefined or null values
      const cleanData = Object.entries(req.body).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // We no longer convert string dates to Date objects, as Drizzle expects string dates
      // This ensures consistency from client through server to database
      if (cleanData.buildDate) {
        console.log(`Received buildDate value (type: ${typeof cleanData.buildDate}):`, cleanData.buildDate);
        
        // Ensure buildDate is a valid ISO string if it's not null
        if (typeof cleanData.buildDate === 'string') {
          try {
            // Validate the date string by creating a date object and checking it
            const testDate = new Date(cleanData.buildDate);
            if (isNaN(testDate.getTime())) {
              console.error('Invalid buildDate format:', cleanData.buildDate);
              cleanData.buildDate = null;
            } else {
              // Keep as string but ensure it's a proper ISO format
              console.log(`Valid date string received: ${cleanData.buildDate}`);
            }
          } catch (e) {
            console.error('Error validating buildDate:', e);
            cleanData.buildDate = null;
          }
        } else if (typeof cleanData.buildDate === 'object' && cleanData.buildDate instanceof Date) {
          // If we somehow get a Date object, convert it to ISO string for consistency
          cleanData.buildDate = cleanData.buildDate.toISOString();
          console.log(`Converted Date object to ISO string: ${cleanData.buildDate}`);
        }
      } else if (cleanData.buildDate === null) {
        console.log('Explicitly setting buildDate to null');
      }
      
      // Convert specifications to proper format if needed
      if (typeof cleanData.specifications === 'string') {
        try {
          cleanData.specifications = JSON.parse(cleanData.specifications);
        } catch (e) {
          console.warn(`Failed to parse specifications JSON: ${cleanData.specifications}`);
        }
      }
      
      // Apply material settings if item type or tuning is being updated
      if (cleanData.itemType || cleanData.tuningType) {
        try {
          console.log('Item type or tuning changed, updating material settings');
          
          // Get current settings
          if (!fs.existsSync(SETTINGS_FILE)) {
            console.warn('Settings file not found, using default settings');
          } else {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
            
            if (settings && settings.materialSettings) {
              const itemType = cleanData.itemType || item.itemType;
              const tuningType = cleanData.tuningType || item.tuningType;
              
              // Normalize the instrument type to match the settings keys
              const normalizedType = itemType.toLowerCase().replace('_', '');
              
              // Get settings for this instrument type
              const typeSettings = settings.materialSettings[normalizedType];
              if (typeSettings && typeSettings.length) {
                // Find a setting that matches the tuning
                let matchedSetting = typeSettings.find((setting: any) => 
                  setting.tuning === tuningType || 
                  setting.tuning.includes(tuningType)
                );
                
                // If no match found, use the default setting
                if (!matchedSetting) {
                  matchedSetting = typeSettings.find((setting: any) => setting.tuning === 'default');
                }
                
                if (matchedSetting) {
                  console.log(`Found material setting for ${normalizedType} - ${tuningType}:`, matchedSetting);
                  
                  // Apply the material settings
                  cleanData.boxSize = matchedSetting.boxSize;
                  
                  // Update specifications if they exist
                  if (cleanData.specifications) {
                    cleanData.specifications = {
                      ...cleanData.specifications,
                      'Box Size': matchedSetting.boxSize,
                      'Bag Size': matchedSetting.bagSize
                    };
                  }
                  
                  console.log('Applied material settings to item update:', {
                    boxSize: cleanData.boxSize,
                    specifications: cleanData.specifications
                  });
                } else {
                  console.warn(`No material setting found for ${normalizedType} with tuning ${tuningType}`);
                }
              } else {
                console.warn(`No material settings for instrument type: ${normalizedType}`);
              }
            } else {
              console.warn('No material settings found in settings file');
            }
          }
        } catch (settingsError) {
          console.error('Error applying material settings:', settingsError);
        }
      }
      
      const updatedItem = await storage.updateOrderItem(id, cleanData);
      if (!updatedItem) {
        console.error(`Failed to update item ${id} - no item returned from storage`);
        return res.status(500).json({ 
          message: "Failed to update order item - no item returned" 
        });
      }
      
      console.log(`Successfully updated order item ${id}`);
      res.json(updatedItem);
    } catch (error: any) {
      console.error(`Error updating order item ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to update order item", 
        details: error.message || String(error)
      });
    }
  });

  // Update order item status - simplified to just track checkbox state
  app.patch("/api/order-items/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      // Validate input
      const statusSchema = z.object({ 
        status: orderStatusEnum,
        checked: z.boolean()
      });
      
      console.log("Received status update request for item", id, "with body:", JSON.stringify(req.body));
      const parsedData = statusSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        console.error("Failed to parse status data:", parsedData.error.format());
        return res.status(400).json({ 
          message: "Invalid status data", 
          errors: parsedData.error.format() 
        });
      }
      
      const { status, checked } = parsedData.data;
      console.log(`Updating status for item ${id}: ${status} to ${checked ? 'checked' : 'unchecked'}`);
      
      // Check if the item exists
      const [itemExists] = await db.execute(sql.raw(`
        SELECT EXISTS(SELECT 1 FROM order_items WHERE id = ${id})
      `));
      
      if (!itemExists?.rows?.[0]?.exists) {
        return res.status(404).json({ message: "Order item not found" });
      }
      
      // Simpler approach - just update what we need, rely on client for additional logic
      if (checked) {
        // When checkbox is checked
        if (status === 'building') {
          // For BUILD checkbox, we need to do two important things:
          // 1. Set the build date to now
          // 2. Register the serial number and specifications in the database
          console.log(`Setting buildDate for item ${id}`);
          
          // Eerst het item ophalen om de specificaties en serienummer te krijgen
          const item = await db.query.orderItems.findFirst({
            where: eq(orderItems.id, id)
          });
          
          if (item && item.serialNumber && item.specifications) {
            try {
              // Importeer de functie om het serienummer te registreren
              const { addSerialNumberToDatabase } = require('../shared/serial-number-database');
              
              // Serienummer permanent registreren voor toekomstige consistentie
              // Gebruik ook het Shopify line item ID voor permanente koppeling als het beschikbaar is
              const shopifyLineItemId = item.shopifyLineItemId || item.specifications?.shopifyLineItemId;
              
              const success = addSerialNumberToDatabase(
                item.serialNumber, 
                item.specifications, 
                shopifyLineItemId
              );
              
              if (success) {
                if (shopifyLineItemId) {
                  console.log(`✅ Serienummer ${item.serialNumber} permanent gekoppeld aan Shopify line item ID: ${shopifyLineItemId}`);
                } else {
                  console.log(`✅ Serienummer ${item.serialNumber} permanent geregistreerd in database bij start productie (geen Shopify ID)`);
                }
              } else {
                console.log(`ℹ️ Serienummer ${item.serialNumber} was al geregistreerd in database`);
              }
            } catch (error) {
              console.error(`⚠️ Fout bij registreren van serienummer ${item.serialNumber}:`, error);
            }
          } else {
            console.log(`⚠️ Kan item ${id} niet vinden of heeft geen serienummer of specificaties`);
          }
          
          // Database updaten met de nieuwe status
          await db.execute(sql.raw(`
            UPDATE order_items 
            SET build_date = CURRENT_TIMESTAMP,
                status_change_dates = COALESCE(status_change_dates, '{}'::jsonb) || 
                  jsonb_build_object('${status}', to_jsonb(CURRENT_TIMESTAMP::text))
            WHERE id = ${id}
          `));
        } else {
          // For other checkboxes, just record the status change date
          console.log(`Recording ${status} status for item ${id}`);
          await db.execute(sql.raw(`
            UPDATE order_items 
            SET status_change_dates = COALESCE(status_change_dates, '{}'::jsonb) || 
                jsonb_build_object('${status}', to_jsonb(CURRENT_TIMESTAMP::text))
            WHERE id = ${id}
          `));
        }
      } else {
        // When checkbox is unchecked
        if (status === 'building') {
          // For BUILD checkbox, clear the build date
          console.log(`Clearing buildDate for item ${id}`);
          await db.execute(sql.raw(`
            UPDATE order_items 
            SET build_date = NULL,
                status_change_dates = status_change_dates::jsonb - '${status}'
            WHERE id = ${id}
          `));
        } else {
          // For other checkboxes, just remove the status date
          console.log(`Removing ${status} status for item ${id}`);
          await db.execute(sql.raw(`
            UPDATE order_items 
            SET status_change_dates = status_change_dates::jsonb - '${status}'
            WHERE id = ${id}
          `));
        }
      }
      
      // Get the updated item using raw SQL to ensure consistent format with other parts
      const result = await db.execute(sql.raw(`
        SELECT * FROM order_items WHERE id = ${id}
      `));
      
      if (!result || !result.rows || !result.rows[0]) {
        console.error(`Failed to retrieve updated item ${id}`);
        return res.status(500).json({ message: "Failed to retrieve updated item" });
      }
      
      // Format the retrieved item
      const updatedItem = result.rows[0];
      
      // Format the item for response - MET EXPLICIETE TYPE CONVERSIE VOOR BILLY FIX
      const formattedItem = {
        id: updatedItem.id,
        // KRITISCHE FIX: Forceer orderId naar een nummer bij formattering
        orderId: Number(updatedItem.order_id),
        serialNumber: updatedItem.serial_number,
        itemType: updatedItem.item_type,
        itemSize: updatedItem.item_size,
        tuningType: updatedItem.tuning_type,
        color: updatedItem.color,
        weight: updatedItem.weight,
        craftsperson: updatedItem.craftsperson,
        buildDate: updatedItem.build_date,
        bagSize: updatedItem.bag_size,
        boxSize: updatedItem.box_size,
        shopifyLineItemId: updatedItem.shopify_line_item_id, // Voeg de Shopify line item ID toe voor permanente koppeling
        specifications: typeof updatedItem.specifications === 'string' 
          ? JSON.parse(updatedItem.specifications) 
          : updatedItem.specifications,
        status: updatedItem.status,
        progress: updatedItem.progress,
        statusChangeDates: typeof updatedItem.status_change_dates === 'string' 
          ? JSON.parse(updatedItem.status_change_dates) 
          : updatedItem.status_change_dates,
        createdAt: updatedItem.created_at,
        updatedAt: updatedItem.updated_at
      };
      
      console.log(`Successfully updated status for item ${id}`);
      return res.json(formattedItem);
      
    } catch (error: any) {
      console.error(`Error updating item ${req.params.id} status:`, error);
      return res.status(500).json({ 
        message: "Failed to update order item status", 
        error: error.message || String(error)
      });
    }
  });

  // Get production notes for an order
  app.get("/api/orders/:orderId/notes", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const notes = await storage.getProductionNotes(orderId);
      
      // Normaliseer de notes om ervoor te zorgen dat alle opmerkingen een 'source' veld hebben
      const normalizedNotes = notes.map(note => {
        if (note.source === undefined) {
          return { ...note, source: 'internal' }; // Standaard zijn opmerkingen intern
        }
        return note;
      });
      
      res.json(normalizedNotes);
    } catch (error) {
      console.error("Error fetching production notes:", error);
      res.status(500).json({ message: "Failed to fetch production notes" });
    }
  });

  // Add production note
  app.post("/api/orders/:orderId/notes", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const parsedData = insertProductionNoteSchema.safeParse({
        ...req.body,
        orderId
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid note data", 
          errors: parsedData.error.format() 
        });
      }
      
      const note = await storage.createProductionNote(parsedData.data);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to create production note" });
    }
  });

  // Endpoint to create missing orders with placeholder data
  app.post("/api/create-missing-orders", async (req, res) => {
    try {
      const existingOrders = await storage.getOrders();
      const existingOrderNumbers = new Set();
      
      // Populate the set with existing order numbers
      for (const order of existingOrders) {
        existingOrderNumbers.add(order.orderNumber);
      }
      
      // Get the order numbers to create from the request body, or use defaults
      const orderNumbers = req.body.orderNumbers || [];
      const createdOrders = [];
      
      for (const orderNumber of orderNumbers) {
        if (existingOrderNumbers.has(orderNumber)) {
          console.log(`Order ${orderNumber} already exists, skipping`);
          continue;
        }
        
        console.log(`Creating placeholder order ${orderNumber}`);
        
        // Create a basic order with minimal data
        const newOrder = await storage.createOrder({
          orderNumber,
          shopifyOrderId: `pending-${orderNumber}`, // Use a prefix to indicate it's a placeholder
          customerName: "Placeholder Customer",
          orderType: 'retail',
          status: 'ordered',
          orderDate: new Date(),
          specifications: {},
          statusChangeDates: {},
        });
        
        // Create a single item for this order
        const serialNumber = `${orderNumber}-1`;
        
        await storage.createOrderItem({
          orderId: newOrder.id,
          serialNumber,
          itemType: 'Ceramic Flute',
          status: 'ordered',
          specifications: {},
          statusChangeDates: {},
          isArchived: false, // Nieuwe items zijn niet gearchiveerd
          archivedReason: null
        });
        
        createdOrders.push(newOrder);
      }
      
      res.json({
        success: true,
        message: `Created ${createdOrders.length} placeholder orders`,
        createdOrders
      });
    } catch (error) {
      console.error("Error creating placeholder orders:", error);
      res.status(500).json({
        success: false,
        message: `Failed to create placeholder orders: ${(error as Error).message}`
      });
    }
  });
  
  // Special endpoint to check missing orders in a specific range
  // Create missing orders in a specific range automatically
  app.post("/api/create-missing-range", async (req, res) => {
    try {
      const existingOrders = await storage.getOrders();
      const existingOrderNumbers = new Set();
      
      // Populate the set with existing order numbers
      for (const order of existingOrders) {
        existingOrderNumbers.add(order.orderNumber);
      }
      
      // Define the ranges to create - either from request body or default
      const ranges = req.body.ranges || [
        { start: 1542, end: 1554 },
        { start: 1556, end: 1569 },
        { start: 1, end: 1541 }
      ];
      
      const createdOrders = [];
      
      // Process each range
      for (const range of ranges) {
        for (let i = range.start; i <= range.end; i++) {
          // Format with leading zeros to match SW-0001 format
          const orderNumber = `SW-${String(i).padStart(4, '0')}`;
          
          if (existingOrderNumbers.has(orderNumber)) {
            console.log(`Order ${orderNumber} already exists, skipping`);
            continue;
          }
          
          console.log(`Creating placeholder order ${orderNumber}`);
          
          // Create a basic order with minimal data
          const newOrder = await storage.createOrder({
            orderNumber,
            shopifyOrderId: `pending-${orderNumber}`, // Use a prefix to indicate it's a placeholder
            customerName: "Placeholder Customer",
            orderType: 'retail',
            status: 'ordered',
            orderDate: new Date(),
            specifications: {},
            statusChangeDates: {},
          });
          
          // Create a single item for this order
          const serialNumber = `${orderNumber}-1`;
          
          await storage.createOrderItem({
            orderId: newOrder.id,
            serialNumber,
            itemType: 'Ceramic Flute',
            status: 'ordered',
            specifications: {},
            statusChangeDates: {},
            isArchived: false,   // Nieuwe items zijn niet gearchiveerd
            archivedReason: null
          });
          
          createdOrders.push(newOrder);
        }
      }
      
      res.json({
        success: true,
        message: `Created ${createdOrders.length} placeholder orders`,
        createdOrders
      });
    } catch (error) {
      console.error("Error creating placeholder orders:", error);
      res.status(500).json({
        success: false,
        message: `Failed to create placeholder orders: ${(error as Error).message}`
      });
    }
  });

  app.get("/api/check-missing-orders", async (req, res) => {
    try {
      const existingOrders = await storage.getOrders();
      const existingOrderNumbers = new Set();
      
      // Populate the set with existing order numbers
      for (const order of existingOrders) {
        existingOrderNumbers.add(order.orderNumber);
      }
      
      // Define the ranges to check
      const ranges = [
        { start: 1542, end: 1554 },
        { start: 1556, end: 1569 },
        { start: 1, end: 1542 }
      ];
      
      const missingOrders = [];
      
      // Check each range
      for (const range of ranges) {
        for (let i = range.start; i <= range.end; i++) {
          // Format with leading zeros to match SW-0001 format
          const orderNumber = `SW-${String(i).padStart(4, '0')}`;
          if (!existingOrderNumbers.has(orderNumber)) {
            missingOrders.push(orderNumber);
          }
        }
      }
      
      // Log and return the missing orders
      console.log(`Found ${missingOrders.length} missing orders:`, missingOrders);
      res.json({ 
        success: true, 
        missingOrders,
        count: missingOrders.length
      });
    } catch (error) {
      console.error("Error checking for missing orders:", error);
      res.status(500).json({ 
        success: false,
        message: `Failed to check missing orders: ${(error as Error).message}` 
      });
    }
  });

  // Real Shopify import endpoint
  app.post("/api/import-shopify", async (req, res) => {
    try {
      // Check if we have the required environment variables
      if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !process.env.SHOPIFY_SHOP_NAME) {
        return res.status(400).json({ 
          message: "Shopify API configuration is incomplete. Please set the SHOPIFY_API_KEY, SHOPIFY_API_SECRET, and SHOPIFY_SHOP_NAME environment variables." 
        });
      }
      
      // Haal de periode uit de request body (indien aanwezig)
      const { period } = req.body;
      
      // Call the syncShopifyOrders function with the specified period
      const result = await syncShopifyOrders(period);
      
      if (result.success) {
        return res.status(200).json({ 
          message: result.message,
          importedCount: result.importedOrders.length,
          importedOrders: result.importedOrders
        });
      } else {
        return res.status(500).json({ 
          message: result.message
        });
      }
    } catch (error) {
      console.error("Error syncing Shopify orders:", error);
      res.status(500).json({ 
        message: `Failed to import Shopify orders: ${(error as Error).message}` 
      });
    }
  });
  
  // Speciale endpoint om één specifieke order opnieuw te importeren
  app.get("/api/import-order/:orderNumber", async (req, res) => {
    try {
      const orderNumber = req.params.orderNumber;
      console.log(`Hersyncing order ${orderNumber} specifiek...`);
      
      // Fetch all orders from Shopify
      const shopifyOrders = await fetchShopifyOrders();
      
      // Find order by its last 4 digits
      const targetOrder = shopifyOrders.find(order => {
        return String(order.order_number).slice(-4) === orderNumber;
      });
      
      if (!targetOrder) {
        return res.status(404).json({ message: `Order #${orderNumber} niet gevonden in Shopify` });
      }
      
      // Filter active line items
      const activeLineItems = targetOrder.line_items.filter(item => item.fulfillable_quantity > 0);
      
      // Check if this is a partially fulfilled order - we need to check if there are any items with fulfillment_status
      // that is truthy (e.g. "fulfilled" or "partial") to determine if some items were actually shipped
      const inactiveLineItems = targetOrder.line_items.filter(item => item.fulfillable_quantity === 0);
      const anyItemFulfilled = targetOrder.line_items.some(item => item.fulfillment_status);
      const isPartiallyFulfilled = activeLineItems.length > 0 && inactiveLineItems.length > 0 && anyItemFulfilled;
      
      // Create workshop order number format (SW-1234)
      const workshopOrderNumber = `SW-${orderNumber}`;
      
      // Log info about the Shopify order
      console.log(`Gevonden Shopify order ${orderNumber}: totaal ${targetOrder.line_items.length} items, waarvan ${activeLineItems.length} actief`);
      if (isPartiallyFulfilled) {
        console.log(`DIT IS EEN GEDEELTELIJK GEFULFILDE ORDER! (${inactiveLineItems.length} items reeds gefulfild)`);
      }
      
      // List all active and inactive items
      targetOrder.line_items.forEach(item => {
        console.log(`- Item "${item.title}": ${item.fulfillable_quantity > 0 ? 'ACTIEF' : 'INACTIEF'} (fulfillable_quantity=${item.fulfillable_quantity})`);
      });
      
      // Check if order exists in our system
      const existingOrder = await storage.getOrderByOrderNumber(workshopOrderNumber);
      let result;
      
      if (existingOrder) {
        console.log(`Order ${workshopOrderNumber} bestaat al in ons systeem, bijwerken...`);
        
        // Get existing items
        const existingItems = await storage.getOrderItems(existingOrder.id);
        
        if (existingItems.length > 0) {
          console.log(`Order ${workshopOrderNumber} heeft ${existingItems.length} items in ons systeem`);
        } else {
          console.log(`Order ${workshopOrderNumber} heeft GEEN items in ons systeem!`);
        }
        
        // If no active items in Shopify, delete the order from our system
        if (activeLineItems.length === 0) {
          console.log(`Order ${workshopOrderNumber} heeft geen actieve items meer in Shopify - verwijderen uit ons systeem`);
          
          // Delete all items first
          for (const item of existingItems) {
            await storage.deleteOrderItem(item.id);
          }
          
          // Then delete the order
          await storage.deleteOrder(existingOrder.id);
          
          return res.json({
            message: `Order ${workshopOrderNumber} verwijderd omdat er geen actieve items meer zijn in Shopify`,
            order: existingOrder
          });
        }
        
        // If we get here, there are active items in Shopify
        // We want to make sure our database reflects the current state in Shopify
        
        // Update order notes to mention partial fulfillment if needed
        if (isPartiallyFulfilled) {
          const orderNote = existingOrder.notes || '';
          const partialFulfillmentNote = `GEDEELTELIJK GEFULFILD: ${inactiveLineItems.length} items reeds verzonden, ${activeLineItems.length} items nog actief.`;
          
          // Add note only if it doesn't already contain similar information
          if (!orderNote.includes('GEDEELTELIJK GEFULFILD')) {
            await storage.updateOrder(existingOrder.id, {
              notes: orderNote ? `${orderNote}\n\n${partialFulfillmentNote}` : partialFulfillmentNote
            });
            console.log(`Notitie toegevoegd aan order ${workshopOrderNumber}: ${partialFulfillmentNote}`);
          }
        }

        // 1. Delete all existing items first (clean slate approach)
        for (const item of existingItems) {
          console.log(`Verwijder bestaand item ${item.serialNumber} van order ${workshopOrderNumber}`);
          await storage.deleteOrderItem(item.id);
        }
        
        // 2. Create new items for all active line items in Shopify
        for (let i = 0; i < activeLineItems.length; i++) {
          const lineItem = activeLineItems[i];
          const serialNumber = `${workshopOrderNumber}-${i + 1}`;
          
          console.log(`Voeg nieuw item toe ${serialNumber} aan order ${workshopOrderNumber}: ${lineItem.title}`);
          
          await storage.createOrderItem({
            orderId: existingOrder.id,
            serialNumber,
            itemType: lineItem.title || 'Ceramic Flute',
            status: 'ordered',
            specifications: extractSpecifications(lineItem),
            statusChangeDates: {},
            isArchived: false,
            archivedReason: null
          });
        }
        
        // Fetch the updated order to return in the response
        const updatedOrder = await storage.getOrderById(existingOrder.id);
        
        result = {
          action: 'updated',
          order: updatedOrder || existingOrder,
          activeItemCount: activeLineItems.length,
          isPartiallyFulfilled
        };
      } else {
        // Order doesn't exist in our system, but there are active items
        // This would be unusual but we handle it by creating a new order
        console.log(`Order ${workshopOrderNumber} bestaat niet in ons systeem, maar heeft ${activeLineItems.length} actieve items in Shopify - maken...`);
        
        // Get customer details
        const customerName = `${targetOrder.customer?.first_name || ''} ${targetOrder.customer?.last_name || ''}`.trim() || 'Unknown Customer';
        const shippingAddress = targetOrder.shipping_address || targetOrder.billing_address;
        
        // Add a note about partial fulfillment if needed
        let orderNotes = targetOrder.note || '';
        if (isPartiallyFulfilled) {
          const partialFulfillmentNote = `GEDEELTELIJK GEFULFILD: ${inactiveLineItems.length} items reeds verzonden, ${activeLineItems.length} items nog actief.`;
          orderNotes = orderNotes ? `${orderNotes}\n\n${partialFulfillmentNote}` : partialFulfillmentNote;
          console.log(`Notitie toegevoegd aan nieuwe order ${workshopOrderNumber}: ${partialFulfillmentNote}`);
        }
        
        // Create new order
        const newOrder = await storage.createOrder({
          orderNumber: workshopOrderNumber,
          shopifyOrderId: targetOrder.id,
          customerName,
          customerEmail: targetOrder.customer?.email || null,
          customerPhone: targetOrder.customer?.phone || shippingAddress?.phone || null,
          customerAddress: shippingAddress ? 
            `${shippingAddress.address1}${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}` : null,
          customerCity: shippingAddress?.city || null,
          customerState: shippingAddress?.province || null,
          customerZip: shippingAddress?.zip || null,
          customerCountry: shippingAddress?.country || null,
          orderType: 'retail',
          status: 'ordered',
          orderDate: new Date(targetOrder.processed_at || targetOrder.created_at),
          deadline: null,
          notes: orderNotes,
          specifications: {},
          statusChangeDates: {},
        });
        
        // Create items for the new order
        for (let i = 0; i < activeLineItems.length; i++) {
          const lineItem = activeLineItems[i];
          const serialNumber = `${workshopOrderNumber}-${i + 1}`;
          
          console.log(`Voeg item toe ${serialNumber} aan nieuwe order ${workshopOrderNumber}: ${lineItem.title}`);
          
          await storage.createOrderItem({
            orderId: newOrder.id,
            serialNumber,
            itemType: lineItem.title || 'Ceramic Flute',
            status: 'ordered',
            specifications: extractSpecifications(lineItem),
            statusChangeDates: {},
            isArchived: false,
            archivedReason: null
          });
        }
        
        result = {
          action: 'created',
          order: newOrder,
          activeItemCount: activeLineItems.length
        };
      }
      
      return res.json({
        success: true,
        message: `Order ${workshopOrderNumber} succesvol gesynchroniseerd van Shopify`,
        result
      });
      
    } catch (error) {
      console.error("Fout bij het synchroniseren van specifieke order:", error);
      res.status(500).json({ 
        message: "Fout bij het synchroniseren van specifieke order", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Endpoint to update tracking information using ParcelParcels API (no auth check for now)
  app.post("/api/update-tracking", async (req, res) => {
    try {
      // Use Shopify function directly from the shopify import at the top
      
      // Verify API credentials
      if (!process.env.PARCELPARCELS_API_KEY || !process.env.PARCELPARCELS_SECRET_KEY) {
        console.error("Missing ParcelParcels API credentials");
        return res.status(400).json({
          error: "ParcelParcels API configuration is incomplete. Please set the PARCELPARCELS_API_KEY and PARCELPARCELS_SECRET_KEY environment variables."
        });
      }

      // We only need to check shipping and delivered orders that don't already have tracking
      console.log("Fetching orders with status: shipping, delivered");
      const shippedOrders = await storage.getOrdersByStatus('shipping');
      const deliveredOrders = await storage.getOrdersByStatus('delivered');
      
      console.log(`Found orders: ${shippedOrders.length} shipping, ${deliveredOrders.length} delivered`);
      
      // Combine shipping and delivered orders
      const allOrders = [...shippedOrders, ...deliveredOrders];

      // Get Shopify data for any fulfilled orders that might have tracking info
      console.log("Looking for tracking data in Shopify for fulfilled orders");
      
      // Check for tracking data in Shopify orders
      let updatedWithShopifyData = 0;
      for (const order of allOrders) {
        if (!order.trackingNumber && order.shopifyOrderId) {
          try {
            // Try to get fulfillment data from Shopify
            console.log(`Checking Shopify for fulfillment data for order ${order.orderNumber}`);
            // Use the imported fetchFulfillmentData function
            const fulfillmentData = await fetchFulfillmentData(order.shopifyOrderId);
            
            if (fulfillmentData && fulfillmentData.length > 0) {
              const latestFulfillment = fulfillmentData[0]; // Get the most recent fulfillment
              
              if (latestFulfillment.tracking_number) {
                console.log(`Found tracking data in Shopify for order ${order.orderNumber}:`, {
                  tracking_number: latestFulfillment.tracking_number,
                  carrier: latestFulfillment.tracking_company
                });
                
                // Update the order with tracking data from Shopify
                await storage.updateOrder(order.id, {
                  trackingNumber: latestFulfillment.tracking_number,
                  trackingCompany: latestFulfillment.tracking_company || "Shopify Shipping",
                  trackingUrl: latestFulfillment.tracking_url || null,
                  deliveryStatus: 'in_transit',
                  status: order.status === 'ordered' ? 'shipping' : order.status,
                  shippedDate: new Date(latestFulfillment.created_at)
                });
                
                updatedWithShopifyData++;
              } else {
                console.log(`No tracking number found for order ${order.orderNumber} in Shopify - skipping update`);
              }
            }
          } catch (shopifyError) {
            console.error(`Error getting fulfillment data from Shopify for order ${order.orderNumber}:`, shopifyError);
          }
        }
      }
      
      if (updatedWithShopifyData > 0) {
        console.log(`Updated ${updatedWithShopifyData} orders with tracking data from Shopify`);
      }
      
      // We only need to check orders that are in shipping or delivered status for tracking updates
      // No need to refresh all orders; we'll just work with what we already have
      const ordersWithTracking = allOrders.filter(order => order.trackingNumber);
      console.log(`Orders with tracking numbers: ${ordersWithTracking.length}`);
      
      // Orders without tracking are higher priority for checking
      const ordersWithoutTracking = allOrders.filter(order => !order.trackingNumber);
      console.log(`Orders without tracking numbers: ${ordersWithoutTracking.length}`);
      
      // Optimize by checking orders without tracking first, then those with tracking
      const allOrdersToCheck = [...ordersWithoutTracking, ...ordersWithTracking];
      
      if (allOrdersToCheck.length === 0) {
        console.log("No orders found to update tracking information");
        return res.json({ message: "No orders found to update", updatedCount: 0 });
      }
      
      // Extract just the numeric part of order numbers (remove "SW-" prefix) for ParcelParcels API
      // Process all orders in batches for better performance
      const batchSize = 50; // Increased from 10 to 50 for much faster processing
      const totalOrders = allOrdersToCheck.length;
      const totalBatches = Math.ceil(totalOrders / batchSize);
      
      console.log(`Processing ${totalOrders} orders in ${totalBatches} batches of ${batchSize}`);
      
      // Create an array of order numbers to check
      const orderNumbers = allOrdersToCheck.map(order => {
        // Extract just the number part of the order number (e.g., "1589" from "SW-1589")
        return order.orderNumber.replace("SW-", "");
      });
      
      console.log(`Requesting tracking info from ParcelParcels API for ${orderNumbers.length} orders`);
      
      try {
        // Use the imported tracking function, not require()
        const trackingResults = await batchGetTrackingInfo(orderNumbers);
        
        if (!trackingResults) {
          throw new Error("Failed to get tracking results from ParcelParcels API");
        }
        
        console.log(`Received tracking results for ${trackingResults.size} orders`);
        
        let updatedCount = 0;
        let notFoundCount = 0;
        let errorCount = 0;
        
        // Process all orders in batches to ensure complete tracking data
        // We'll process them sequentially to avoid overwhelming the database
        const processAllBatches = async () => {
          let totalUpdated = 0;
          let totalNotFound = 0;
          let totalErrors = 0;
          
          // Process batches one at a time
          for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * batchSize;
            const end = Math.min(start + batchSize, totalOrders);
            const batchOrders = allOrdersToCheck.slice(start, end);
            
            console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (orders ${start+1}-${end})`);
            
            // Process each order in the current batch
            for (const order of batchOrders) {
              try {
                // Get just the number part for lookup
                const orderNumberWithoutPrefix = order.orderNumber.replace("SW-", "");
                const orderNumberWithPrefix = `SW-${orderNumberWithoutPrefix}`;
                
                // First try with the full order number (with prefix)
                let trackingInfo = trackingResults.get(orderNumberWithPrefix);
                
                // If not found, try without the prefix
                if (!trackingInfo) {
                  trackingInfo = trackingResults.get(orderNumberWithoutPrefix);
                }
            
                // Log the search process for debugging
                console.log(`Looking up tracking for ${order.orderNumber}: ${trackingInfo ? 'FOUND' : 'NOT FOUND'}`);
                
                if (!trackingInfo) {
                  console.log(`No tracking info found for order ${order.orderNumber}`);
                  notFoundCount++;
                  continue;
                }
            
                const { 
                  trackingNumber, 
                  trackingCompany, 
                  trackingUrl, 
                  deliveryStatus, 
                  estimatedDeliveryDate, 
                  deliveredDate 
                } = trackingInfo;
            
                // Create an update object with the tracking information
                const updateData: Partial<Order> = {
                  deliveryStatus,
                  estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
                  deliveredDate: deliveredDate ? new Date(deliveredDate) : null
                };
            
                // If the order doesn't have a tracking number yet but we got one from the API, add it
                if (!order.trackingNumber && trackingNumber) {
                  updateData.trackingNumber = trackingNumber;
                  updateData.trackingCompany = trackingCompany || null;
                  updateData.trackingUrl = trackingUrl || null;
                  
                  // If we've got tracking info but the order is still in ordered status, update it to shipping
                  if (order.status === 'ordered') {
                    updateData.status = 'shipping';
                    updateData.shippedDate = new Date(); // Set shipped date to today
                    console.log(`Updating order ${order.orderNumber} from 'ordered' to 'shipping'`);
                  }
                  
                  // If order is already marked as shipping and we have no delivery status, 
                  // set a default in_transit status when we have tracking
                  if (order.status === 'shipping' && !order.deliveryStatus) {
                    updateData.deliveryStatus = 'in_transit';
                  }
                }
            
                if (Object.keys(updateData).length > 0) {
                  console.log(`Updating order ${order.orderNumber} with new tracking data`);
                  const updatedOrder = await storage.updateOrder(order.id, updateData);
                  
                  if (updatedOrder) {
                    updatedCount++;
                    console.log(`Successfully updated order ${order.orderNumber}`);
                  } else {
                    console.error(`Failed to update order ${order.orderNumber} in database`);
                    errorCount++;
                  }
                } else {
                  console.log(`No changes needed for order ${order.orderNumber}`);
                }
          } catch (orderError) {
            console.error(`Error updating tracking for order ${order.orderNumber}:`, orderError);
            errorCount++;
            totalErrors++;
          }
        }
            
            // Add a small delay between batches
            if (batchIndex < totalBatches - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Accumulate batch stats
            totalUpdated += updatedCount;
            totalNotFound += notFoundCount;
            totalErrors += errorCount;
            
            // Reset batch counters for next batch
            updatedCount = 0;
            notFoundCount = 0;
            errorCount = 0;
          }
          
          return { totalUpdated, totalNotFound, totalErrors };
        };
        
        // Execute the batch processing
        const { totalUpdated, totalNotFound, totalErrors } = await processAllBatches();
        
        console.log(`Tracking update complete: ${totalUpdated} updated, ${totalErrors} errors, ${totalNotFound} not found`);
        
        res.json({ 
          message: `Updated tracking info for ${totalUpdated} orders. ${totalErrors} errors. ${totalNotFound} orders without tracking info.`,
          updatedCount: totalUpdated,
          errorCount: totalErrors,
          notFoundCount: totalNotFound
        });
      } catch (trackingError) {
        console.error("Error fetching tracking information from ParcelParcels API:", trackingError);
        return res.status(500).json({ 
          error: "Failed to fetch tracking data from ParcelParcels API", 
          message: trackingError instanceof Error ? trackingError.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error('Error updating tracking info:', error);
      res.status(500).json({ 
        error: 'Error updating tracking info',
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined
      });
    }
  });
  
  // Direct tracking update endpoint (bypasses offline storage entirely)
  app.post("/api/direct-tracking-update", async (req, res) => {
    try {
      // Verify API credentials
      if (!process.env.PARCELPARCELS_API_KEY || !process.env.PARCELPARCELS_SECRET_KEY) {
        console.error("Missing ParcelParcels API credentials");
        return res.status(400).json({
          error: "ParcelParcels API configuration is incomplete. Please set the PARCELPARCELS_API_KEY and PARCELPARCELS_SECRET_KEY environment variables."
        });
      }

      // We only need to check shipping and delivered orders
      console.log("Fetching orders with status: shipping, delivered");
      const shippedOrders = await storage.getOrdersByStatus('shipping');
      const deliveredOrders = await storage.getOrdersByStatus('delivered');
      
      console.log(`Found orders: ${shippedOrders.length} shipping, ${deliveredOrders.length} delivered`);
      
      // Combine shipping and delivered orders
      const allOrders = [...shippedOrders, ...deliveredOrders];
      
      // Extract just the numeric part of order numbers (remove "SW-" prefix) for ParcelParcels API
      const orderNumbers = allOrders.map(order => {
        return order.orderNumber.replace("SW-", "");
      });
      
      console.log(`Requesting tracking info from ParcelParcels API for ${orderNumbers.length} orders`);
      
      // Use the imported tracking function
      const trackingResults = await batchGetTrackingInfo(orderNumbers);
      
      if (!trackingResults) {
        throw new Error("Failed to get tracking results from ParcelParcels API");
      }
      
      console.log(`Received tracking results for ${trackingResults.size} orders`);
      
      let updatedCount = 0;
      let notFoundCount = 0;
      let errorCount = 0;
      
      // Process all orders sequentially for simplicity
      for (const order of allOrders) {
        try {
          // Get just the number part for lookup
          const orderNumberWithoutPrefix = order.orderNumber.replace("SW-", "");
          const orderNumberWithPrefix = `SW-${orderNumberWithoutPrefix}`;
          
          // Try both variants of the order number
          let trackingInfo = trackingResults.get(orderNumberWithPrefix) || trackingResults.get(orderNumberWithoutPrefix);
          
          console.log(`Looking up tracking for ${order.orderNumber}: ${trackingInfo ? 'FOUND' : 'NOT FOUND'}`);
          
          if (!trackingInfo) {
            notFoundCount++;
            continue;
          }
          
          const { 
            trackingNumber, 
            trackingCompany, 
            trackingUrl, 
            deliveryStatus, 
            estimatedDeliveryDate, 
            deliveredDate 
          } = trackingInfo;
          
          // Create an update object with the tracking information
          const updateData: Partial<Order> = {
            deliveryStatus,
            estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
            deliveredDate: deliveredDate ? new Date(deliveredDate) : null
          };
          
          // If the order doesn't have a tracking number yet but we got one from the API, add it
          if (!order.trackingNumber && trackingNumber) {
            updateData.trackingNumber = trackingNumber;
            updateData.trackingCompany = trackingCompany || null;
            updateData.trackingUrl = trackingUrl || null;
            
            // If we've got tracking info but the order is still in ordered status, update it to shipping
            if (order.status === 'ordered') {
              updateData.status = 'shipping';
              updateData.shippedDate = new Date();
            }
            
            // If order is already marked as shipping and we have no delivery status, 
            // set a default in_transit status when we have tracking
            if (order.status === 'shipping' && !order.deliveryStatus) {
              updateData.deliveryStatus = 'in_transit';
            }
          }
          
          if (Object.keys(updateData).length > 0) {
            console.log(`Updating order ${order.orderNumber} with new tracking data`);
            const updatedOrder = await storage.updateOrder(order.id, updateData);
            
            if (updatedOrder) {
              updatedCount++;
            } else {
              errorCount++;
            }
          }
        } catch (orderError) {
          console.error(`Error updating tracking for order ${order.orderNumber}:`, orderError);
          errorCount++;
        }
      }
      
      console.log(`Direct tracking update complete: ${updatedCount} updated, ${errorCount} errors, ${notFoundCount} not found`);
      
      return res.json({ 
        message: `Updated tracking info for ${updatedCount} orders. ${errorCount} errors. ${notFoundCount} orders without tracking info.`,
        updatedCount,
        errorCount,
        notFoundCount
      });
    } catch (error) {
      console.error('Error in direct tracking update:', error);
      return res.status(500).json({ 
        error: 'Error updating tracking info',
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Helper endpoint to update shipped orders to delivered status after a certain time
  app.post("/api/update-delivery-status", async (req, res) => {
    try {
      // Get all orders in shipping status
      const shippedOrders = await storage.getOrdersByStatus('shipping');
      const updatedOrders = [];
      const cutoffDays = parseInt(req.query.days as string) || 14; // Default to 14 days

      for (const order of shippedOrders) {
        // Skip orders without a shipped date
        if (!order.shippedDate) continue;

        // Calculate days since shipping
        const shippedDate = new Date(order.shippedDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - shippedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Log all shipped orders and days for debugging
        console.log(`Checking order ${order.orderNumber}: shipped ${diffDays} days ago`);

        // If shipped more than X days ago, mark as delivered
        if (diffDays > cutoffDays) {
          console.log(`Marking order ${order.orderNumber} as delivered (shipped ${diffDays} days ago)`);
          
          const updatedOrder = await storage.updateOrder(order.id, {
            status: 'delivered',
            deliveryStatus: 'delivered',
            deliveredDate: new Date() // Set delivered date to today
          });
          
          if (updatedOrder) {
            updatedOrders.push(updatedOrder);
          }
        }
      }

      res.json({ 
        success: true, 
        message: `Updated ${updatedOrders.length} orders to delivered status`, 
        updatedOrders 
      });
    } catch (error) {
      console.error('Error updating delivered orders:', error);
      res.status(500).json({ 
        success: false,
        message: `Failed to update delivered orders: ${(error as Error).message}` 
      });
    }
  });
  
  // Material Mappings configuration
  // Save material mapping configuration
  app.post("/api/material-mappings", async (req, res) => {
    try {
      // In a real implementation, this would save to the database
      // For now, we just echo back the data
      const mappings = req.body;
      res.json({ 
        success: true, 
        message: "Material mappings saved successfully",
        data: mappings 
      });
    } catch (error) {
      console.error("Failed to save material mappings:", error);
      res.status(500).json({ message: "Failed to save material mappings" });
    }
  });
  
  // Get material mapping configuration
  app.get("/api/material-mappings", async (req, res) => {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we just return a default configuration
      const defaultMappings = {
        innato: [
          { tuning: 'A3, B3', bagSize: 'XXL', boxSize: '35x35x35' },
          { tuning: 'C3', bagSize: 'XL', boxSize: '35x35x35' },
          { tuning: 'F3, E3', bagSize: 'L', boxSize: '30x30x30' },
          { tuning: 'default', bagSize: 'L', boxSize: '30x30x30' }
        ],
        natey: [
          { tuning: 'A4, F#4, G#4', bagSize: 'S', boxSize: '15x15x15' },
          { tuning: 'G3', bagSize: 'L', boxSize: '30x30x30' },
          { tuning: 'C4', bagSize: 'M', boxSize: '20x20x20' },
          { tuning: 'default', bagSize: 'M', boxSize: '20x20x20' }
        ],
        zen: [
          { tuning: 'L', bagSize: 'L', boxSize: '30x30x30' },
          { tuning: 'M', bagSize: 'M', boxSize: '30x12x12' },
          { tuning: 'default', bagSize: 'M', boxSize: '30x12x12' }
        ],
        double: [
          { tuning: 'C4', bagSize: 'M', boxSize: '30x12x12' },
          { tuning: 'default', bagSize: 'L', boxSize: '30x12x12' }
        ],
        ova: [
          { tuning: 'default', bagSize: 'Bagpack', boxSize: '40x40x40' }
        ],
        cards: [
          { tuning: 'default', bagSize: '-', boxSize: '15x15x15' }
        ]
      };
      
      res.json(defaultMappings);
    } catch (error) {
      console.error("Failed to fetch material mappings:", error);
      res.status(500).json({ message: "Failed to fetch material mappings" });
    }
  });

  // Materials Inventory API Routes
  
  // Get all materials
  app.get("/api/materials", async (req, res) => {
    try {
      const materials = await storage.getAllMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials inventory" });
    }
  });
  
  // Get materials by type (bag or box)
  app.get("/api/materials/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      if (type !== 'bag' && type !== 'box') {
        return res.status(400).json({ message: "Invalid material type. Must be 'bag' or 'box'" });
      }
      
      const materials = await storage.getMaterialsByType(type);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials by type" });
    }
  });
  
  // Get low stock materials
  app.get("/api/materials/low-stock", async (req, res) => {
    try {
      const lowStockMaterials = await storage.getLowStockMaterials();
      res.json(lowStockMaterials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock materials" });
    }
  });
  
  // Get material by ID
  app.get("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      const material = await storage.getMaterialById(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });
  
  // Create new material
  app.post("/api/materials", async (req, res) => {
    try {
      const parsedData = insertMaterialInventorySchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid material data", 
          errors: parsedData.error.format() 
        });
      }
      
      const material = await storage.createMaterial(parsedData.data);
      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to create material" });
    }
  });
  
  // Update material
  app.patch("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      const material = await storage.getMaterialById(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Clean and process the update data
      const updateData = { ...req.body };
      
      // Handle empty string dates by setting them to null
      if (updateData.expectedDelivery === "") {
        updateData.expectedDelivery = null;
      }
      
      if (updateData.orderDate === "") {
        updateData.orderDate = null;
      }
      
      // Convert date strings to Date objects if needed
      if (updateData.expectedDelivery && typeof updateData.expectedDelivery === 'string') {
        try {
          const date = new Date(updateData.expectedDelivery);
          if (!isNaN(date.getTime())) {
            updateData.expectedDelivery = date;
          } else {
            // In case of invalid date, set to null
            updateData.expectedDelivery = null;
          }
        } catch (e) {
          console.error('Invalid date format for expectedDelivery:', updateData.expectedDelivery);
          updateData.expectedDelivery = null;
        }
      }
      
      if (updateData.orderDate && typeof updateData.orderDate === 'string') {
        try {
          const date = new Date(updateData.orderDate);
          if (!isNaN(date.getTime())) {
            updateData.orderDate = date;
          } else {
            // In case of invalid date, set to null
            updateData.orderDate = null;
          }
        } catch (e) {
          console.error('Invalid date format for orderDate:', updateData.orderDate);
          updateData.orderDate = null;
        }
      }
      
      console.log('Updating material with data:', JSON.stringify(updateData, (key, value) => {
        // Handle Date objects for logging
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }));
      
      const updatedMaterial = await storage.updateMaterial(id, updateData);
      
      if (!updatedMaterial) {
        return res.status(500).json({ message: "Failed to update material - no rows returned" });
      }
      
      res.json(updatedMaterial);
    } catch (error) {
      console.error('Error updating material:', error);
      res.status(500).json({ 
        message: "Failed to update material", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete material
  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      const success = await storage.deleteMaterial(id);
      if (!success) {
        return res.status(404).json({ message: "Material not found or could not be deleted" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete material" });
    }
  });
  
  // Instrument Inventory API Routes
  
  // Get all instruments
  app.get("/api/instruments", async (req, res) => {
    try {
      const instruments = await storage.getAllInstruments();
      res.json(instruments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instruments" });
    }
  });
  
  // Get instruments by type
  app.get("/api/instruments/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const instruments = await storage.getInstrumentsByType(type);
      res.json(instruments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instruments by type" });
    }
  });
  
  // Get instruments by status
  app.get("/api/instruments/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const instruments = await storage.getInstrumentsByStatus(status);
      res.json(instruments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instruments by status" });
    }
  });
  
  // Get instrument by serial number
  app.get("/api/instruments/serial/:serialNumber", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      
      const instrument = await storage.getInstrumentBySerialNumber(serialNumber);
      if (!instrument) {
        return res.status(404).json({ message: "Instrument not found" });
      }
      
      res.json(instrument);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instrument by serial number" });
    }
  });
  
  // Get instrument by ID
  app.get("/api/instruments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid instrument ID" });
      }
      
      const instrument = await storage.getInstrumentById(id);
      if (!instrument) {
        return res.status(404).json({ message: "Instrument not found" });
      }
      
      res.json(instrument);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instrument" });
    }
  });
  
  // Create new instrument
  app.post("/api/instruments", async (req, res) => {
    try {
      const parsedData = insertInstrumentInventorySchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid instrument data", 
          errors: parsedData.error.format() 
        });
      }
      
      const instrument = await storage.createInstrument(parsedData.data);
      res.status(201).json(instrument);
    } catch (error) {
      res.status(500).json({ message: "Failed to create instrument" });
    }
  });
  
  // Update instrument
  app.patch("/api/instruments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid instrument ID" });
      }
      
      const instrument = await storage.getInstrumentById(id);
      if (!instrument) {
        return res.status(404).json({ message: "Instrument not found" });
      }
      
      // Clean and process the update data
      const updateData = { ...req.body };
      
      // Handle empty string dates by setting them to null
      if (updateData.dateProduced === "") {
        updateData.dateProduced = null;
      }
      
      // Convert date strings to Date objects if needed
      if (updateData.dateProduced && typeof updateData.dateProduced === 'string') {
        try {
          const date = new Date(updateData.dateProduced);
          if (!isNaN(date.getTime())) {
            updateData.dateProduced = date;
          } else {
            // In case of invalid date, set to null
            updateData.dateProduced = null;
          }
        } catch (e) {
          console.error('Invalid date format for dateProduced:', updateData.dateProduced);
          updateData.dateProduced = null;
        }
      }
      
      console.log('Updating instrument with data:', JSON.stringify(updateData, (key, value) => {
        // Handle Date objects for logging
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }));
      
      const updatedInstrument = await storage.updateInstrument(id, updateData);
      
      if (!updatedInstrument) {
        return res.status(500).json({ message: "Failed to update instrument - no rows returned" });
      }
      
      res.json(updatedInstrument);
    } catch (error) {
      console.error('Error updating instrument:', error);
      res.status(500).json({ 
        message: "Failed to update instrument", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Delete instrument
  app.delete("/api/instruments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid instrument ID" });
      }
      
      const success = await storage.deleteInstrument(id);
      if (!success) {
        return res.status(404).json({ message: "Instrument not found or could not be deleted" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete instrument" });
    }
  });

  // Path to store the workshop settings
  const SETTINGS_FILE = path.join(process.cwd(), 'workshop-settings.json');
  
  // Initialize settings file if it doesn't exist
  if (!fs.existsSync(SETTINGS_FILE)) {
    // Default workshop settings
    const defaultSettings = {
      materialSettings: {
        innato: [
          { tuning: 'A3, B3', bagSize: 'XXL', boxSize: '35x35x35' },
          { tuning: 'C3', bagSize: 'XL', boxSize: '35x35x35' },
          { tuning: 'F3, E3', bagSize: 'L', boxSize: '30x30x30' },
          { tuning: 'default', bagSize: 'L', boxSize: '30x30x30' }
        ],
        natey: [
          { tuning: 'A4, F#4, G#4', bagSize: 'S', boxSize: '15x15x15' },
          { tuning: 'G3', bagSize: 'L', boxSize: '30x30x30' },
          { tuning: 'C4', bagSize: 'M', boxSize: '20x20x20' },
          { tuning: 'default', bagSize: 'M', boxSize: '20x20x20' }
        ],
        zen: [
          { tuning: 'L', bagSize: 'L', boxSize: '30x30x30' },
          { tuning: 'M', bagSize: 'M', boxSize: '30x12x12' },
          { tuning: 'default', bagSize: 'M', boxSize: '30x12x12' }
        ],
        double: [
          { tuning: 'C4', bagSize: 'M', boxSize: '30x12x12' },
          { tuning: 'default', bagSize: 'L', boxSize: '30x12x12' }
        ],
        ova: [
          { tuning: 'default', bagSize: 'Bagpack', boxSize: '40x40x40' }
        ],
        cards: [
          { tuning: 'default', bagSize: '-', boxSize: '15x15x15' }
        ]
      },
      shopifySettings: {
        apiKey: '',
        apiSecret: '',
        storeUrl: '',
        autoSync: true,
        syncInterval: '15'
      },
      serialNumberSettings: {
        prefix: 'SW',
        separator: '-',
        yearDigits: '4',
        includeMonth: true,
        resetCounter: false
      },
      interfaceSettings: {
        defaultView: 'production',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        itemsPerPage: '10'
      }
    };
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
  
  // Get all workshop settings
  app.get("/api/settings", isAuthenticated, (req, res) => {
    try {
      if (!fs.existsSync(SETTINGS_FILE)) {
        console.warn("Settings file not found, creating default");
        // Create with default settings
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      }
      
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      
      // Log available settings keys
      console.log("Available settings:", Object.keys(settings));
      if (settings.materialSettings) {
        console.log("Material settings categories:", Object.keys(settings.materialSettings));
        
        // Verify CARDS settings include Envelope option
        const cardsSettings = settings.materialSettings.cards || [];
        const hasEnvelope = cardsSettings.some(item => item.tuning === 'Envelope');
        console.log("CARDS settings has Envelope option:", hasEnvelope);
        
        if (!hasEnvelope) {
          console.log("Adding Envelope option to CARDS settings");
          if (!settings.materialSettings.cards) {
            settings.materialSettings.cards = [];
          }
          settings.materialSettings.cards.push({
            tuning: 'Envelope',
            bagSize: '-',
            boxSize: 'Envelope'
          });
          
          // Save updated settings
          fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        }
      } else {
        console.warn("No material settings found in settings file");
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error reading settings:", error);
      res.status(500).json({ 
        message: "Failed to read settings",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Save workshop settings
  app.post("/api/settings", isAuthenticated, (req, res) => {
    try {
      // Get the current settings if they exist
      let currentSettings = {};
      if (fs.existsSync(SETTINGS_FILE)) {
        currentSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      }
      
      // Merge with new settings - only updating what was provided
      const newSettings = {
        ...currentSettings,
        ...req.body
      };
      
      // Write the merged settings back to file
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
      
      res.json({ 
        message: "Settings saved successfully",
        settings: newSettings
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });
  
  // Save specific setting category
  app.post("/api/settings/:category", isAuthenticated, (req, res) => {
    try {
      const category = req.params.category;
      
      // Valid categories
      const validCategories = [
        'materialSettings', 
        'shopifySettings', 
        'serialNumberSettings', 
        'interfaceSettings'
      ];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "Invalid settings category" });
      }
      
      // Get the current settings if they exist
      let currentSettings = {};
      if (fs.existsSync(SETTINGS_FILE)) {
        currentSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      }
      
      // Update only the specified category
      const newSettings = {
        ...currentSettings,
        [category]: req.body
      };
      
      // Write the updated settings back to file
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
      
      res.json({ 
        message: `${category} saved successfully`,
        settings: newSettings
      });
    } catch (error) {
      console.error("Error saving settings category:", error);
      res.status(500).json({ message: "Failed to save settings category" });
    }
  });

  // Mold Management API Routes
  
  // Get all molds
  app.get("/api/molds", async (req, res) => {
    try {
      const molds = await storage.getAllMolds();
      res.json(molds);
    } catch (error) {
      console.error("Failed to fetch molds:", error);
      res.status(500).json({ message: "Failed to fetch molds" });
    }
  });
  
  // Get mold by ID
  app.get("/api/molds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mold ID" });
      }
      
      const mold = await storage.getMoldById(id);
      if (!mold) {
        return res.status(404).json({ message: "Mold not found" });
      }
      
      res.json(mold);
    } catch (error) {
      console.error("Failed to fetch mold:", error);
      res.status(500).json({ message: "Failed to fetch mold" });
    }
  });
  
  // Get molds by instrument type
  app.get("/api/molds/instrument/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const molds = await storage.getMoldsByInstrumentType(type);
      res.json(molds);
    } catch (error) {
      console.error("Failed to fetch molds by instrument type:", error);
      res.status(500).json({ message: "Failed to fetch molds by instrument type" });
    }
  });
  
  // Create new mold
  app.post("/api/molds", async (req, res) => {
    try {
      const parsedData = insertMoldInventorySchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid mold data", 
          errors: parsedData.error.format() 
        });
      }
      
      const mold = await storage.createMold(parsedData.data);
      res.status(201).json(mold);
    } catch (error) {
      console.error("Failed to create mold:", error);
      res.status(500).json({ message: "Failed to create mold" });
    }
  });
  
  // Update mold
  app.patch("/api/molds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mold ID" });
      }
      
      const mold = await storage.getMoldById(id);
      if (!mold) {
        return res.status(404).json({ message: "Mold not found" });
      }
      
      const updatedMold = await storage.updateMold(id, req.body);
      res.json(updatedMold);
    } catch (error) {
      console.error("Failed to update mold:", error);
      res.status(500).json({ message: "Failed to update mold" });
    }
  });
  
  // Delete mold
  app.delete("/api/molds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mold ID" });
      }
      
      // Check if the force parameter is set
      const force = req.query.force === 'true';
      
      // Use the updated storage method that supports force parameter
      const result = await storage.deleteMold(id, force);
      
      if (!result) {
        if (force) {
          // If force=true was used but deletion still failed, it might be that the mold doesn't exist
          return res.status(404).json({ message: "Mold not found" });
        } else {
          // Standard failure response (likely due to mapping associations)
          return res.status(400).json({ 
            message: "Cannot delete mold - it may be used in mold mappings. Use force=true parameter to delete anyway." 
          });
        }
      }
      
      // Success - mold was deleted
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete mold:", error);
      res.status(500).json({ message: "Failed to delete mold" });
    }
  });
  
  // Utility endpoint to reset all molds and mappings
  app.delete("/api/molds/reset/all", async (req, res) => {
    try {
      console.log("Attempting to delete all mold mappings and molds");
      
      // First get all mold mapping IDs
      const mappings = await storage.getAllMoldMappings();
      console.log(`Found ${mappings.length} mappings to delete`);
      
      // Delete all mappings
      for (const mapping of mappings) {
        await storage.deleteMoldMapping(mapping.id);
      }
      
      // Then get all molds
      const molds = await storage.getAllMolds();
      console.log(`Found ${molds.length} molds to delete`);
      
      // Delete all molds
      for (const mold of molds) {
        await storage.deleteMold(mold.id, true); // Use force=true to ensure deletion
      }
      
      res.status(200).json({ 
        success: true, 
        message: `Successfully deleted ${mappings.length} mappings and ${molds.length} molds` 
      });
    } catch (error) {
      console.error("Failed to reset molds:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to reset molds and mappings",
        error: (error as Error).message 
      });
    }
  });
  
  // Mold Mappings API
  
  // Get all mold mappings
  app.get("/api/mold-mappings", async (req, res) => {
    try {
      const mappings = await storage.getAllMoldMappings();
      res.json(mappings);
    } catch (error) {
      console.error("Failed to fetch mold mappings:", error);
      res.status(500).json({ message: "Failed to fetch mold mappings" });
    }
  });
  
  // Get mold mapping by ID
  app.get("/api/mold-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }
      
      const mapping = await storage.getMoldMappingById(id);
      if (!mapping) {
        return res.status(404).json({ message: "Mold mapping not found" });
      }
      
      res.json(mapping);
    } catch (error) {
      console.error("Failed to fetch mold mapping:", error);
      res.status(500).json({ message: "Failed to fetch mold mapping" });
    }
  });
  
  // Get mold mappings by instrument type
  app.get("/api/mold-mappings/instrument/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const mappings = await storage.getMoldMappingsByInstrumentType(type);
      res.json(mappings);
    } catch (error) {
      console.error("Failed to fetch mold mappings by instrument type:", error);
      res.status(500).json({ message: "Failed to fetch mold mappings by instrument type" });
    }
  });
  
  // Get mold mapping by instrument type and tuning
  app.get("/api/mold-mappings/tuning/:instrumentType/:tuningNote", async (req, res) => {
    try {
      const { instrumentType, tuningNote } = req.params;
      const mapping = await storage.getMoldMappingByTuning(instrumentType, tuningNote);
      
      if (!mapping) {
        return res.status(404).json({ 
          message: `No mold mapping found for ${instrumentType} with tuning ${tuningNote}` 
        });
      }
      
      res.json(mapping);
    } catch (error) {
      console.error("Failed to fetch mold mapping by tuning:", error);
      res.status(500).json({ message: "Failed to fetch mold mapping by tuning" });
    }
  });
  
  // Create new mold mapping
  app.post("/api/mold-mappings", async (req, res) => {
    try {
      const parsedData = insertMoldMappingSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid mold mapping data", 
          errors: parsedData.error.format() 
        });
      }
      
      const mapping = await storage.createMoldMapping(parsedData.data);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Failed to create mold mapping:", error);
      res.status(500).json({ message: "Failed to create mold mapping" });
    }
  });
  
  // Update mold mapping
  app.patch("/api/mold-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }
      
      const mapping = await storage.getMoldMappingById(id);
      if (!mapping) {
        return res.status(404).json({ message: "Mold mapping not found" });
      }
      
      const updatedMapping = await storage.updateMoldMapping(id, req.body);
      res.json(updatedMapping);
    } catch (error) {
      console.error("Failed to update mold mapping:", error);
      res.status(500).json({ message: "Failed to update mold mapping" });
    }
  });
  
  // Delete mold mapping
  app.delete("/api/mold-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }
      
      const result = await storage.deleteMoldMapping(id);
      if (!result) {
        return res.status(400).json({ message: "Failed to delete mold mapping" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete mold mapping:", error);
      res.status(500).json({ message: "Failed to delete mold mapping" });
    }
  });
  
  // Mold Mapping Items API
  
  // Get molds for a specific mapping
  app.get("/api/mold-mappings/:mappingId/molds", async (req, res) => {
    try {
      const mappingId = parseInt(req.params.mappingId);
      if (isNaN(mappingId)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }
      
      const molds = await storage.getMappingMolds(mappingId);
      res.json(molds);
    } catch (error) {
      console.error("Failed to fetch molds for mapping:", error);
      res.status(500).json({ message: "Failed to fetch molds for mapping" });
    }
  });
  
  // Add mold to mapping
  app.post("/api/mold-mappings/:mappingId/molds", async (req, res) => {
    try {
      const mappingId = parseInt(req.params.mappingId);
      if (isNaN(mappingId)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }
      
      const schema = z.object({
        moldId: z.number(),
        orderIndex: z.number().optional(),
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: parsedData.error.format() 
        });
      }
      
      const { moldId, orderIndex } = parsedData.data;
      
      const mappingItem = await storage.addMoldToMapping(mappingId, moldId, orderIndex);
      res.status(201).json(mappingItem);
    } catch (error) {
      console.error("Failed to add mold to mapping:", error);
      res.status(500).json({ 
        message: "Failed to add mold to mapping", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Remove mold from mapping
  app.delete("/api/mold-mappings/items/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid mapping item ID" });
      }
      
      // Log for debugging
      console.log(`Attempting to remove mold mapping item with ID: ${itemId}`);
      
      const result = await storage.removeMoldFromMapping(itemId);
      if (!result) {
        console.log(`Mold mapping item with ID ${itemId} not found`);
        return res.status(404).json({ message: "Mapping item not found" });
      }
      
      console.log(`Successfully removed mold mapping item with ID: ${itemId}`);
      res.status(204).end();
    } catch (error) {
      console.error("Failed to remove mold from mapping:", error);
      res.status(500).json({ message: "Failed to remove mold from mapping" });
    }
  });
  
  // Update mold order in mapping
  app.patch("/api/mold-mappings/items/:itemId/order", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid mapping item ID" });
      }
      
      const schema = z.object({
        orderIndex: z.number(),
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: parsedData.error.format() 
        });
      }
      
      const updatedItem = await storage.updateMoldMappingOrder(
        itemId, 
        parsedData.data.orderIndex
      );
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Mapping item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Failed to update mold order:", error);
      res.status(500).json({ message: "Failed to update mold order" });
    }
  });
  
  // Utility endpoint: Get molds for a specific instrument and tuning
  app.get("/api/instrument-molds/:instrumentType/:tuningNote", async (req, res) => {
    try {
      const { instrumentType, tuningNote } = req.params;
      
      // Ensure URL-encoded parameters are properly decoded
      const decodedTuningNote = decodeURIComponent(tuningNote);
      
      console.log(`API REQUEST: Looking for molds for ${instrumentType} with tuning note ${decodedTuningNote} (decoded from ${tuningNote})`);
      
      const molds = await storage.getMoldsForInstrument(instrumentType, decodedTuningNote);
      
      if (!molds || molds.length === 0) {
        console.log(`API RESPONSE: No molds found for ${instrumentType} with tuning ${decodedTuningNote}`);
        return res.status(404).json({ 
          message: `No molds found for ${instrumentType} with tuning ${decodedTuningNote}` 
        });
      }
      
      console.log(`API RESPONSE: Found ${molds.length} molds for ${instrumentType} ${decodedTuningNote}`);
      res.json(molds);
    } catch (error) {
      console.error("Failed to fetch molds for instrument:", error);
      res.status(500).json({ 
        message: "Failed to fetch molds for instrument",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.use('/api/resellers', (await import('./routes/resellers')).default);

  return httpServer;
}
