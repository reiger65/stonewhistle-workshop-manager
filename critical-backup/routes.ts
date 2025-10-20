import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  orderStatusEnum, insertOrderSchema, insertOrderItemSchema, 
  insertProductionNoteSchema, insertMaterialInventorySchema, 
  insertMaterialMappingRuleSchema, insertInstrumentInventorySchema,
  insertMoldInventorySchema, insertMoldMappingSchema, insertMoldMappingItemSchema,
  insertFluteSettingsSchema,
  OrderStatus, OrderItem, MoldInventory, MoldMapping, MoldMappingItem,
  moldInventory, moldMappingItems, Order, fluteSettings
} from "@shared/schema";
import { getTrackingInfoByOrderNumber, batchGetTrackingInfo, getOrderStatusByOrderNumber } from "./parcelparcels";
import { format } from "date-fns";
import { syncShopifyOrders, fetchFulfillmentData } from "./shopify";
import { setupAuth } from "./auth";
import fs from 'fs';
import path from 'path';
import { eq, sql } from 'drizzle-orm';
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
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

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
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
        updatedDates[status] = currentDate.toISOString();
        
        // For BUILD checkbox, also update the buildDate field
        if (status === 'building') {
          // Make sure to use ISO string format for buildDate too
          updateData.buildDate = currentDate.toISOString();
        }
      } else {
        // If checkbox is unchecked, remove date from statusChangeDates
        delete updatedDates[status];
        
        // For BUILD checkbox, also clear the buildDate field
        if (status === 'building') {
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

  // Get all order items (for the worksheet view)
  app.get("/api/order-items", async (req, res) => {
    try {
      const allOrders = await storage.getOrders();
      const allItems: OrderItem[] = [];
      
      // For each order, get its items
      for (const order of allOrders) {
        const items = await storage.getOrderItems(order.id);
        allItems.push(...items);
      }
      
      res.json(allItems);
    } catch (error) {
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
      res.json(items);
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
      
      // Log the update operation
      console.log(`Updating order item ${id}:`, JSON.stringify(req.body));
      
      // Clean up the request body to remove any undefined or null values
      const cleanData = Object.entries(req.body).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
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

  // Update order item status
  app.patch("/api/order-items/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
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
      
      // Get the item
      const item = await storage.getOrderItemById(id);
      if (!item) {
        return res.status(404).json({ message: "Order item not found" });
      }
      
      // Create or update the statusChangeDates object
      const updatedDates = { ...(item.statusChangeDates || {}) };
      const updateData: any = {};
      
      if (checked) {
        // If checkbox is checked, add date to statusChangeDates
        const currentDate = new Date();
        const isoString = currentDate.toISOString();
        console.log(`Setting date for ${status} to ISO string: ${isoString}`);
        updatedDates[status] = isoString;
        
        // For BUILD checkbox, also update the buildDate field
        if (status === 'building') {
          console.log(`Setting buildDate to ISO string: ${isoString}`);
          updateData.buildDate = isoString;
        }
      } else {
        // If checkbox is unchecked, remove date from statusChangeDates
        delete updatedDates[status];
        
        // For BUILD checkbox, also clear the buildDate field
        if (status === 'building') {
          updateData.buildDate = null;
        }
      }
      
      // Update statusChangeDates
      updateData.statusChangeDates = updatedDates;
      
      console.log(`Updating item ${id} with data:`, JSON.stringify(updateData));
      
      // Update the item with modified statusChangeDates and possibly buildDate
      const updatedItem = await storage.updateOrderItem(id, updateData);
      
      if (!updatedItem) {
        console.error(`Failed to update status for item ${id} - no item returned from storage`);
        return res.status(500).json({ 
          message: "Failed to update order item status - no item returned" 
        });
      }
      
      console.log(`Successfully updated status for item ${id}`);
      
      // Return the updated item
      return res.json(updatedItem);
    } catch (error: any) {
      console.error(`Error updating item ${req.params.id} status flag:`, error);
      res.status(500).json({ 
        message: "Failed to update order item status", 
        details: error.message || String(error)
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
      res.json(notes);
    } catch (error) {
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
      
      // Call the syncShopifyOrders function
      const result = await syncShopifyOrders();
      
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
      
      const result = await storage.removeMoldFromMapping(itemId);
      if (!result) {
        return res.status(404).json({ message: "Mapping item not found" });
      }
      
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

  
  // Flute Settings API Routes
  
  // Get all flute settings
  app.get("/api/flute-settings", async (_req, res) => {
    try {
      const settings = await db.select().from(fluteSettings);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching flute settings:", error);
      res.status(500).json({ message: "Failed to fetch flute settings" });
    }
  });
  
  // Get flute setting by ID
  app.get("/api/flute-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid setting ID" });
      }
      
      const [setting] = await db.select().from(fluteSettings).where(eq(fluteSettings.id, id));
      
      if (!setting) {
        return res.status(404).json({ message: "Flute setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching flute setting:", error);
      res.status(500).json({ message: "Failed to fetch flute setting" });
    }
  });
  
  // Get flute settings by instrument type
  app.get("/api/flute-settings/instrument/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const settings = await db.select().from(fluteSettings).where(eq(fluteSettings.instrumentType, type));
      res.json(settings);
    } catch (error) {
      console.error("Error fetching flute settings by type:", error);
      res.status(500).json({ message: "Failed to fetch flute settings by type" });
    }
  });
  
  // Get flute setting by instrument type and tuning note
  app.get("/api/flute-settings/instrument/:type/tuning/:note", async (req, res) => {
    try {
      const type = req.params.type;
      const note = decodeURIComponent(req.params.note);
      
      console.log(`API REQUEST: Looking for flute settings for ${type} with tuning note ${note}`);
      
      const [setting] = await db.select().from(fluteSettings)
        .where(eq(fluteSettings.instrumentType, type))
        .where(eq(fluteSettings.tuningNote, note));
      
      if (!setting) {
        console.log(`API RESPONSE: No flute setting found for ${type} with tuning ${note}`);
        return res.status(404).json({ message: "Flute setting not found" });
      }
      
      console.log(`API RESPONSE: Found flute setting ID ${setting.id} for ${type} ${note}`);
      res.json(setting);
    } catch (error) {
      console.error("Error fetching flute setting by type and note:", error);
      res.status(500).json({ message: "Failed to fetch flute setting by type and note" });
    }
  });
  
  // Create new flute setting
  app.post("/api/flute-settings", async (req, res) => {
    try {
      const parsedData = insertFluteSettingsSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid flute setting data", 
          errors: parsedData.error.format() 
        });
      }
      
      // Check if setting with same instrument type and tuning already exists
      const [existing] = await db.select().from(fluteSettings)
        .where(eq(fluteSettings.instrumentType, parsedData.data.instrumentType))
        .where(eq(fluteSettings.tuningNote, parsedData.data.tuningNote));
      
      if (existing) {
        return res.status(409).json({ 
          message: "A setting for this instrument type and tuning already exists" 
        });
      }
      
      const [newSetting] = await db.insert(fluteSettings).values(parsedData.data).returning();
      res.status(201).json(newSetting);
    } catch (error) {
      console.error("Error creating flute setting:", error);
      res.status(500).json({ message: "Failed to create flute setting" });
    }
  });
  
  // Update existing flute setting
  app.patch("/api/flute-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid setting ID" });
      }
      
      // Validate the update data
      const parsedData = insertFluteSettingsSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid flute setting data", 
          errors: parsedData.error.format() 
        });
      }
      
      // Check if setting exists
      const [existing] = await db.select().from(fluteSettings).where(eq(fluteSettings.id, id));
      if (!existing) {
        return res.status(404).json({ message: "Flute setting not found" });
      }
      
      // If changing instrumentType and tuningNote, check for duplicates
      if (parsedData.data.instrumentType && parsedData.data.tuningNote) {
        const [duplicate] = await db.select().from(fluteSettings)
          .where(eq(fluteSettings.instrumentType, parsedData.data.instrumentType))
          .where(eq(fluteSettings.tuningNote, parsedData.data.tuningNote))
          .where(sql`${fluteSettings.id} <> ${id}`);
        
        if (duplicate) {
          return res.status(409).json({ 
            message: "A setting for this instrument type and tuning already exists" 
          });
        }
      }
      
      // Include update timestamp
      const updateData = {
        ...parsedData.data,
        updatedAt: new Date()
      };
      
      const [updated] = await db.update(fluteSettings)
        .set(updateData)
        .where(eq(fluteSettings.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating flute setting:", error);
      res.status(500).json({ message: "Failed to update flute setting" });
    }
  });
  
  // Delete flute setting
  app.delete("/api/flute-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid setting ID" });
      }
      
      const [existing] = await db.select().from(fluteSettings).where(eq(fluteSettings.id, id));
      if (!existing) {
        return res.status(404).json({ message: "Flute setting not found" });
      }
      
      await db.delete(fluteSettings).where(eq(fluteSettings.id, id));
      
      res.json({ message: "Flute setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting flute setting:", error);
      res.status(500).json({ message: "Failed to delete flute setting" });
    }
  });

  return httpServer;
}
