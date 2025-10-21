import { 
  orders, orderItems, productionNotes, users, resellers,
  materialsInventory, materialMappingRules, instrumentInventory,
  moldInventory, moldMappings, moldMappingItems,
  shopifyItemTracking, timesheets,
  type Order, type InsertOrder, 
  type OrderItem, type InsertOrderItem, 
  type ProductionNote, type InsertProductionNote, 
  type MaterialInventory, type InsertMaterialInventory,
  type MaterialMappingRule, type InsertMaterialMappingRule,
  type InstrumentInventory, type InsertInstrumentInventory,
  type MoldInventory, type InsertMoldInventory,
  type MoldMapping, type InsertMoldMapping,
  type MoldMappingItem, type InsertMoldMappingItem,
  type Reseller, type InsertReseller,
  type User, type InsertUser,
  type ShopifyItemTracking, type InsertShopifyItemTracking,
  type Timesheet, type InsertTimesheet,
  OrderStatus 
} from "@shared/schema";

export interface IStorage {
  // User Authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session store for authentication
  sessionStore: any; // This will be a session store compatible with express-session

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersSince(date: Date): Promise<Order[]>; // 6-maanden filter
  getOrdersByStatus(status: OrderStatus): Promise<Order[]>;
  getOrdersByCustomerEmail(email: string): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderByShopifyId(shopifyId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined>;
  
  // Order Items
  getAllOrderItems(includeArchived?: boolean): Promise<OrderItem[]>; // Get all items across all orders
  getOrderItems(orderId: number, includeArchived?: boolean): Promise<OrderItem[]>; // Items for specific order
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>; // Added to fix Shopify sync
  getAllOrderItemsByOrderId(orderId: number, includeArchived?: boolean): Promise<OrderItem[]>; // With archive option
  getOrderItemById(id: number): Promise<OrderItem | undefined>;
  getOrderItemBySerialNumber(serialNumber: string): Promise<OrderItem | undefined>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, item: Partial<OrderItem>): Promise<OrderItem | undefined>;
  updateOrderItemStatus(id: number, status: OrderStatus): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;
  
  // Reseller Detection
  getResellerByEmail(email: string): Promise<Reseller | undefined>;
  detectResellerFromEmail(email: string): Promise<{isReseller: boolean, resellerNickname: string | null}>;
  
  // Production Notes
  getProductionNotes(orderId: number): Promise<ProductionNote[]>;
  getItemProductionNotes(itemId: number): Promise<ProductionNote[]>;
  createProductionNote(note: InsertProductionNote): Promise<ProductionNote>;
  
  // Materials Inventory
  getAllMaterials(): Promise<MaterialInventory[]>;
  getMaterialById(id: number): Promise<MaterialInventory | undefined>;
  getMaterialsByType(type: 'bag' | 'box'): Promise<MaterialInventory[]>;
  getLowStockMaterials(): Promise<MaterialInventory[]>;
  createMaterial(material: InsertMaterialInventory): Promise<MaterialInventory>;
  updateMaterial(id: number, material: Partial<MaterialInventory>): Promise<MaterialInventory | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  
  // Material Mapping Rules
  getAllMaterialRules(): Promise<MaterialMappingRule[]>;
  getMaterialRuleById(id: number): Promise<MaterialMappingRule | undefined>;
  getMaterialRulesByInstrumentType(type: string): Promise<MaterialMappingRule[]>;
  createMaterialRule(rule: InsertMaterialMappingRule): Promise<MaterialMappingRule>;
  updateMaterialRule(id: number, rule: Partial<MaterialMappingRule>): Promise<MaterialMappingRule | undefined>;
  deleteMaterialRule(id: number): Promise<boolean>;
  
  // Instrument Inventory
  getAllInstruments(): Promise<InstrumentInventory[]>;
  getInstrumentById(id: number): Promise<InstrumentInventory | undefined>;
  getInstrumentBySerialNumber(serialNumber: string): Promise<InstrumentInventory | undefined>;
  getInstrumentsByType(type: string): Promise<InstrumentInventory[]>;
  getInstrumentsByStatus(status: string): Promise<InstrumentInventory[]>;
  createInstrument(instrument: InsertInstrumentInventory): Promise<InstrumentInventory>;
  updateInstrument(id: number, instrument: Partial<InstrumentInventory>): Promise<InstrumentInventory | undefined>;
  deleteInstrument(id: number): Promise<boolean>;
  
  // Mold Inventory
  getAllMolds(): Promise<MoldInventory[]>;
  getMoldById(id: number): Promise<MoldInventory | undefined>;
  getMoldsByInstrumentType(type: string): Promise<MoldInventory[]>;
  createMold(mold: InsertMoldInventory): Promise<MoldInventory>;
  updateMold(id: number, mold: Partial<MoldInventory>): Promise<MoldInventory | undefined>;
  deleteMold(id: number): Promise<boolean>;
  
  // Mold Mappings (groups of molds for a specific instrument tuning)
  getAllMoldMappings(): Promise<MoldMapping[]>;
  getMoldMappingById(id: number): Promise<MoldMapping | undefined>;
  getMoldMappingsByInstrumentType(type: string): Promise<MoldMapping[]>;
  getMoldMappingByTuning(instrumentType: string, tuningNote: string): Promise<MoldMapping | undefined>;
  createMoldMapping(mapping: InsertMoldMapping): Promise<MoldMapping>;
  updateMoldMapping(id: number, mapping: Partial<MoldMapping>): Promise<MoldMapping | undefined>;
  deleteMoldMapping(id: number): Promise<boolean>;
  
  // Mold Mapping Items (many-to-many relationship between molds and mappings)
  getMappingMolds(mappingId: number): Promise<(MoldMappingItem & MoldInventory)[]>;
  addMoldToMapping(mappingId: number, moldId: number, orderIndex?: number): Promise<MoldMappingItem>;
  removeMoldFromMapping(mappingItemId: number): Promise<boolean>;
  updateMoldMappingOrder(mappingItemId: number, newOrderIndex: number): Promise<MoldMappingItem | undefined>;
  
  // Resellers
  getAllResellers(): Promise<Reseller[]>;
  getResellerById(id: number): Promise<Reseller | undefined>;
  getResellerByNickname(nickname: string): Promise<Reseller | undefined>;
  getActiveResellers(): Promise<Reseller[]>;
  createReseller(reseller: InsertReseller): Promise<Reseller>;
  updateReseller(id: number, reseller: Partial<Reseller>): Promise<Reseller | undefined>;
  deleteReseller(id: number): Promise<boolean>;
  
  // Helper methods
  getMoldsForInstrument(instrumentType: string, tuningNote: string): Promise<MoldInventory[]>;
  
  // Shopify item tracking - voor bijhouden van suffixen en mappings
  getShopifyTracking(orderId: number): Promise<ShopifyItemTracking | undefined>;
  createShopifyTracking(tracking: InsertShopifyItemTracking): Promise<ShopifyItemTracking>;
  updateShopifyTracking(orderId: number, tracking: Partial<ShopifyItemTracking>): Promise<ShopifyItemTracking | undefined>;
  
  // Timesheet management
  getAllTimesheets(): Promise<Timesheet[]>;
  getTimesheetById(id: number): Promise<Timesheet | undefined>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: number, timesheet: Partial<Timesheet>): Promise<Timesheet | undefined>;
  deleteTimesheet(id: number): Promise<boolean>;
  getActiveTimers(): Promise<Timesheet[]>;
  getPausedTimer(employeeName: string): Promise<Timesheet | undefined>;
  getTimesheetEntries(): Promise<Timesheet[]>;
  getTimesheetSummary(employeeName: string, startDate?: string, endDate?: string): Promise<{
    totalHours: number;
    totalEarnings: number;
    totalEntries: number;
    paidHours: number;
    unpaidHours: number;
    paidEarnings: number;
    unpaidEarnings: number;
  }>;
}

import createMemoryStore from "memorystore";
import session from "express-session";

// Gebruik alleen DatabaseStorage; MemStorage is verouderd
export class MemStorage implements IStorage {
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private productionNotes: Map<number, ProductionNote>;
  private materialInventory: Map<number, MaterialInventory>;
  private materialRules: Map<number, MaterialMappingRule>;
  private instrumentInventory: Map<number, InstrumentInventory>;
  private moldInventory: Map<number, MoldInventory>;
  private moldMappings: Map<number, MoldMapping>;
  private moldMappingItems: Map<number, MoldMappingItem>;
  private resellers: Map<number, Reseller>;
  private users: Map<number, User>;
  private orderIdCounter: number;
  private itemIdCounter: number;
  private noteIdCounter: number;
  private materialIdCounter: number;
  private ruleIdCounter: number;
  private instrumentIdCounter: number;
  private moldIdCounter: number;
  private moldMappingIdCounter: number;
  private moldMappingItemIdCounter: number;
  private resellerIdCounter: number;
  private userIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.orders = new Map();
    this.orderItems = new Map();
    this.productionNotes = new Map();
    this.materialInventory = new Map();
    this.materialRules = new Map();
    this.instrumentInventory = new Map();
    this.moldInventory = new Map();
    this.moldMappings = new Map();
    this.moldMappingItems = new Map();
    this.resellers = new Map();
    this.users = new Map();
    this.orderIdCounter = 1;
    this.itemIdCounter = 1;
    this.noteIdCounter = 1;
    this.materialIdCounter = 1;
    this.ruleIdCounter = 1;
    this.instrumentIdCounter = 1;
    this.moldIdCounter = 1;
    this.moldMappingIdCounter = 1;
    this.moldMappingItemIdCounter = 1;
    this.resellerIdCounter = 1;
    this.userIdCounter = 1;
    
    // Initialize memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Add a default admin user for testing
    this.createUser({
      username: "admin",
      // This is a hashed version of "password123" - in production, password would be hashed when registering
      password: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92.81dc9bdb52d04dc20036dbd8313ed055",
    });
  }
  
  // User authentication methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    
    const user: User = {
      id,
      ...userData,
    };
    
    this.users.set(id, user);
    return user;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === status
    );
  }
  
  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.customerEmail === email
    );
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.orderNumber === orderNumber
    );
  }

  async getOrderByShopifyId(shopifyId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.shopifyOrderId === shopifyId
    );
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    
    const order: Order = {
      id,
      ...orderData,
      orderDate: orderData.orderDate ? new Date(orderData.orderDate) : now,
      deadline: orderData.deadline ? new Date(orderData.deadline) : null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, updateData: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = {
      ...order,
      ...updateData,
      updatedAt: new Date(),
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    // Record the date of this status change
    const statusChangeDates = order.statusChangeDates || {};
    
    // Update with current date
    statusChangeDates[status] = new Date();
    
    return this.updateOrder(id, { 
      status, 
      statusChangeDates 
    });
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }
  
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    // Return all items for the order, including archived ones
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  // Add missing methods for HybridStorage compatibility
  async getAllOrderItems(includeArchived?: boolean): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values());
  }

  async getAllOrderItemsByOrderId(orderId: number, includeArchived?: boolean): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  async getOrdersSince(date: Date): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.orderDate >= date
    );
  }

  async getOrdersWithoutTimeLimit(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  // Add more missing methods for HybridStorage compatibility
  async getResellerByEmail(email: string): Promise<any> {
    return undefined; // Not implemented in memory storage
  }

  async detectResellerFromEmail(email: string): Promise<any> {
    return undefined; // Not implemented in memory storage
  }

  async archiveOrderItem(id: number): Promise<boolean> {
    // In memory storage, we don't have archiving, so just return true
    return true;
  }

  async unarchiveOrderItem(id: number): Promise<boolean> {
    // In memory storage, we don't have archiving, so just return true
    return true;
  }

  async getOrderItemById(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async getOrderItemBySerialNumber(serialNumber: string): Promise<OrderItem | undefined> {
    return Array.from(this.orderItems.values()).find(
      (item) => item.serialNumber === serialNumber
    );
  }

  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const id = this.itemIdCounter++;
    const now = new Date();
    
    const item: OrderItem = {
      id,
      ...itemData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.orderItems.set(id, item);
    return item;
  }

  async updateOrderItem(id: number, updateData: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const item = this.orderItems.get(id);
    if (!item) return undefined;

    const updatedItem: OrderItem = {
      ...item,
      ...updateData,
      updatedAt: new Date(),
    };

    this.orderItems.set(id, updatedItem);
    return updatedItem;
  }

  async updateOrderItemStatus(id: number, status: OrderStatus): Promise<OrderItem | undefined> {
    return this.updateOrderItem(id, { status });
  }

  // Production Notes
  async getProductionNotes(orderId: number): Promise<ProductionNote[]> {
    return Array.from(this.productionNotes.values()).filter(
      (note) => note.orderId === orderId
    );
  }

  async getItemProductionNotes(itemId: number): Promise<ProductionNote[]> {
    return Array.from(this.productionNotes.values()).filter(
      (note) => note.itemId === itemId
    );
  }

  async createProductionNote(noteData: InsertProductionNote): Promise<ProductionNote> {
    const id = this.noteIdCounter++;
    const now = new Date();
    
    const note: ProductionNote = {
      id,
      ...noteData,
      createdAt: now,
    };
    
    this.productionNotes.set(id, note);
    return note;
  }

  // Materials Inventory
  async getAllMaterials(): Promise<MaterialInventory[]> {
    return Array.from(this.materialInventory.values());
  }
  
  async getMaterialById(id: number): Promise<MaterialInventory | undefined> {
    return this.materialInventory.get(id);
  }
  
  async getMaterialsByType(type: 'bag' | 'box'): Promise<MaterialInventory[]> {
    return Array.from(this.materialInventory.values()).filter(
      (material) => material.materialType === type
    );
  }
  
  async getLowStockMaterials(): Promise<MaterialInventory[]> {
    return Array.from(this.materialInventory.values()).filter(
      (material) => material.quantity <= material.reorderPoint
    );
  }
  
  async createMaterial(materialData: InsertMaterialInventory): Promise<MaterialInventory> {
    const id = this.materialIdCounter++;
    const now = new Date();
    
    const material: MaterialInventory = {
      id,
      ...materialData,
      lastUpdated: now,
    };
    
    this.materialInventory.set(id, material);
    return material;
  }
  
  async updateMaterial(id: number, updateData: Partial<MaterialInventory>): Promise<MaterialInventory | undefined> {
    const material = this.materialInventory.get(id);
    if (!material) return undefined;
    
    const updatedMaterial: MaterialInventory = {
      ...material,
      ...updateData,
      lastUpdated: new Date(),
    };
    
    this.materialInventory.set(id, updatedMaterial);
    return updatedMaterial;
  }
  
  async deleteMaterial(id: number): Promise<boolean> {
    return this.materialInventory.delete(id);
  }
  
  // Material Mapping Rules
  async getAllMaterialRules(): Promise<MaterialMappingRule[]> {
    return Array.from(this.materialRules.values());
  }
  
  async getMaterialRuleById(id: number): Promise<MaterialMappingRule | undefined> {
    return this.materialRules.get(id);
  }
  
  async getMaterialRulesByInstrumentType(type: string): Promise<MaterialMappingRule[]> {
    return Array.from(this.materialRules.values()).filter(
      (rule) => rule.instrumentType === type && rule.isActive
    );
  }
  
  async createMaterialRule(ruleData: InsertMaterialMappingRule): Promise<MaterialMappingRule> {
    const id = this.ruleIdCounter++;
    const now = new Date();
    
    const rule: MaterialMappingRule = {
      id,
      ...ruleData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.materialRules.set(id, rule);
    return rule;
  }
  
  async updateMaterialRule(id: number, updateData: Partial<MaterialMappingRule>): Promise<MaterialMappingRule | undefined> {
    const rule = this.materialRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule: MaterialMappingRule = {
      ...rule,
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.materialRules.set(id, updatedRule);
    return updatedRule;
  }
  
  async deleteMaterialRule(id: number): Promise<boolean> {
    return this.materialRules.delete(id);
  }
  
  // Instrument Inventory
  async getAllInstruments(): Promise<InstrumentInventory[]> {
    return Array.from(this.instrumentInventory.values());
  }
  
  async getInstrumentById(id: number): Promise<InstrumentInventory | undefined> {
    return this.instrumentInventory.get(id);
  }
  
  async getInstrumentBySerialNumber(serialNumber: string): Promise<InstrumentInventory | undefined> {
    return Array.from(this.instrumentInventory.values()).find(
      (instrument) => instrument.serialNumber === serialNumber
    );
  }
  
  async getInstrumentsByType(type: string): Promise<InstrumentInventory[]> {
    return Array.from(this.instrumentInventory.values()).filter(
      (instrument) => instrument.instrumentType === type
    );
  }
  
  async getInstrumentsByStatus(status: string): Promise<InstrumentInventory[]> {
    return Array.from(this.instrumentInventory.values()).filter(
      (instrument) => instrument.status === status
    );
  }
  
  async createInstrument(instrumentData: InsertInstrumentInventory): Promise<InstrumentInventory> {
    const id = this.instrumentIdCounter++;
    const now = new Date();
    
    const instrument: InstrumentInventory = {
      id,
      ...instrumentData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.instrumentInventory.set(id, instrument);
    return instrument;
  }
  
  async updateInstrument(id: number, updateData: Partial<InstrumentInventory>): Promise<InstrumentInventory | undefined> {
    const instrument = this.instrumentInventory.get(id);
    if (!instrument) return undefined;
    
    const updatedInstrument: InstrumentInventory = {
      ...instrument,
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.instrumentInventory.set(id, updatedInstrument);
    return updatedInstrument;
  }
  
  async deleteInstrument(id: number): Promise<boolean> {
    return this.instrumentInventory.delete(id);
  }

  // Mold Inventory
  async getAllMolds(): Promise<MoldInventory[]> {
    return Array.from(this.moldInventory.values());
  }

  async getMoldById(id: number): Promise<MoldInventory | undefined> {
    return this.moldInventory.get(id);
  }

  async getMoldsByInstrumentType(type: string): Promise<MoldInventory[]> {
    return Array.from(this.moldInventory.values()).filter(
      (mold) => mold.instrumentType === type
    );
  }

  async createMold(moldData: InsertMoldInventory): Promise<MoldInventory> {
    const id = this.moldIdCounter++;
    const now = new Date();
    
    const mold: MoldInventory = {
      id,
      ...moldData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.moldInventory.set(id, mold);
    return mold;
  }

  async updateMold(id: number, updateData: Partial<MoldInventory>): Promise<MoldInventory | undefined> {
    const mold = this.moldInventory.get(id);
    if (!mold) return undefined;
    
    const updatedMold: MoldInventory = {
      ...mold,
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.moldInventory.set(id, updatedMold);
    return updatedMold;
  }

  async deleteMold(id: number): Promise<boolean> {
    // First check if this mold is used in any mappings
    const usedInMappings = Array.from(this.moldMappingItems.values()).some(
      (item) => item.moldId === id
    );
    
    if (usedInMappings) {
      // Cannot delete a mold that is being used
      return false;
    }
    
    return this.moldInventory.delete(id);
  }

  // Mold Mappings
  async getAllMoldMappings(): Promise<MoldMapping[]> {
    return Array.from(this.moldMappings.values());
  }

  async getMoldMappingById(id: number): Promise<MoldMapping | undefined> {
    return this.moldMappings.get(id);
  }

  async getMoldMappingsByInstrumentType(type: string): Promise<MoldMapping[]> {
    return Array.from(this.moldMappings.values()).filter(
      (mapping) => mapping.instrumentType === type
    );
  }

  async getMoldMappingByTuning(instrumentType: string, tuningNote: string): Promise<MoldMapping | undefined> {
    return Array.from(this.moldMappings.values()).find(
      (mapping) => mapping.instrumentType === instrumentType && mapping.tuningNote === tuningNote
    );
  }

  async createMoldMapping(mappingData: InsertMoldMapping): Promise<MoldMapping> {
    const id = this.moldMappingIdCounter++;
    const now = new Date();
    
    const mapping: MoldMapping = {
      id,
      ...mappingData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.moldMappings.set(id, mapping);
    return mapping;
  }

  async updateMoldMapping(id: number, updateData: Partial<MoldMapping>): Promise<MoldMapping | undefined> {
    const mapping = this.moldMappings.get(id);
    if (!mapping) return undefined;
    
    const updatedMapping: MoldMapping = {
      ...mapping,
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.moldMappings.set(id, updatedMapping);
    return updatedMapping;
  }

  async deleteMoldMapping(id: number): Promise<boolean> {
    // First delete all mapping items
    Array.from(this.moldMappingItems.values())
      .filter((item) => item.mappingId === id)
      .forEach((item) => this.moldMappingItems.delete(item.id));
      
    return this.moldMappings.delete(id);
  }

  // Mold Mapping Items
  async getMappingMolds(mappingId: number): Promise<(MoldMappingItem & MoldInventory)[]> {
    // Get all mapping items for this mapping
    const mappingItems = Array.from(this.moldMappingItems.values()).filter(
      (item) => item.mappingId === mappingId
    );
    
    // Join with mold inventory
    return mappingItems.map((item) => {
      const mold = this.moldInventory.get(item.moldId);
      if (!mold) {
        throw new Error(`Mold with ID ${item.moldId} not found`);
      }
      
      return {
        ...item,
        ...mold,
      };
    }).sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async addMoldToMapping(mappingId: number, moldId: number, orderIndex?: number): Promise<MoldMappingItem> {
    // Check if mapping exists
    const mapping = this.moldMappings.get(mappingId);
    if (!mapping) {
      throw new Error(`Mapping with ID ${mappingId} not found`);
    }
    
    // Check if mold exists
    const mold = this.moldInventory.get(moldId);
    if (!mold) {
      throw new Error(`Mold with ID ${moldId} not found`);
    }
    
    // Determine order index
    let nextIndex = 0;
    if (orderIndex === undefined) {
      const items = Array.from(this.moldMappingItems.values())
        .filter((item) => item.mappingId === mappingId);
      
      if (items.length > 0) {
        nextIndex = Math.max(...items.map((item) => item.orderIndex)) + 1;
      }
    } else {
      nextIndex = orderIndex;
    }
    
    // Create and store new mapping item
    const id = this.moldMappingItemIdCounter++;
    const mappingItem: MoldMappingItem = {
      id,
      mappingId,
      moldId,
      orderIndex: nextIndex,
    };
    
    this.moldMappingItems.set(id, mappingItem);
    return mappingItem;
  }

  async removeMoldFromMapping(mappingItemId: number): Promise<boolean> {
    return this.moldMappingItems.delete(mappingItemId);
  }

  async updateMoldMappingOrder(mappingItemId: number, newOrderIndex: number): Promise<MoldMappingItem | undefined> {
    const item = this.moldMappingItems.get(mappingItemId);
    if (!item) return undefined;
    
    const updatedItem = { ...item, orderIndex: newOrderIndex };
    this.moldMappingItems.set(mappingItemId, updatedItem);
    return updatedItem;
  }

  // Helper method
  async getMoldsForInstrument(instrumentType: string, tuningNote: string): Promise<MoldInventory[]> {
    // Find the mapping for this instrument type and tuning
    const mapping = await this.getMoldMappingByTuning(instrumentType, tuningNote);
    if (!mapping) return [];
    
    // Get all molds in this mapping
    const mappingItems = await this.getMappingMolds(mapping.id);
    
    // Return just the mold data
    return mappingItems.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      side: item.side,
      instrumentType: item.instrumentType,
      isActive: item.isActive,
      notes: item.notes,
      lastUsed: item.lastUsed,
      location: item.location,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  }
  
  // Reseller methods
  async getAllResellers(): Promise<Reseller[]> {
    return Array.from(this.resellers.values());
  }
  
  async getResellerById(id: number): Promise<Reseller | undefined> {
    return this.resellers.get(id);
  }
  
  async getResellerByNickname(nickname: string): Promise<Reseller | undefined> {
    return Array.from(this.resellers.values()).find(
      (reseller) => reseller.nickname === nickname
    );
  }
  
  async getActiveResellers(): Promise<Reseller[]> {
    return Array.from(this.resellers.values()).filter(
      (reseller) => reseller.isActive
    );
  }
  
  async createReseller(resellerData: InsertReseller): Promise<Reseller> {
    const id = this.resellerIdCounter++;
    const now = new Date();
    
    const reseller: Reseller = {
      id,
      ...resellerData,
      createdAt: now,
      updatedAt: now
    };
    
    this.resellers.set(id, reseller);
    return reseller;
  }
  
  async updateReseller(id: number, updateData: Partial<Reseller>): Promise<Reseller | undefined> {
    const reseller = this.resellers.get(id);
    if (!reseller) return undefined;
    
    const updatedReseller: Reseller = {
      ...reseller,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.resellers.set(id, updatedReseller);
    return updatedReseller;
  }
  
  async deleteReseller(id: number): Promise<boolean> {
    return this.resellers.delete(id);
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from "./database-storage";

// Create a hybrid storage that can work with or without database
class HybridStorage implements IStorage {
  private databaseStorage: DatabaseStorage;
  private memStorage: MemStorage;
  private useDatabase: boolean = false;

  constructor() {
    this.databaseStorage = new DatabaseStorage();
    this.memStorage = new MemStorage();
    
    // Check if we should use database
    this.initializeDatabase().catch(error => {
      console.error("Failed to initialize database:", error);
    });
  }

  private async initializeDatabase() {
    try {
      console.log("🔍 Initializing database connection...");
      console.log("🔗 DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
      console.log("🔗 RAILWAY_ENVIRONMENT:", process.env.RAILWAY_ENVIRONMENT ? "YES" : "NO");
      
      // For Railway, always try to use database if DATABASE_URL is set
      if (process.env.RAILWAY_ENVIRONMENT && process.env.DATABASE_URL) {
        console.log("🚂 Railway environment detected - forcing database usage");
        this.useDatabase = true;
        return;
      }
      
      // Check if DATABASE_URL is set and not pointing to localhost
      if (!process.env.DATABASE_URL) {
        console.warn("⚠️  DATABASE_URL not set, using memory storage");
        this.useDatabase = false;
        return;
      }
      
      // Check if DATABASE_URL points to localhost (not suitable for Railway)
      if (process.env.DATABASE_URL.includes('localhost') || 
          process.env.DATABASE_URL.includes('127.0.0.1') ||
          process.env.DATABASE_URL.includes('::1')) {
        console.warn("⚠️  DATABASE_URL points to localhost, using memory storage");
        console.log("🔗 DATABASE_URL contains localhost:", process.env.DATABASE_URL);
        this.useDatabase = false;
        return;
      }

      console.log("🔗 Testing database connection...");
      // Test database connection
      const isConnected = await this.databaseStorage.checkDatabaseConnection();
      if (isConnected) {
        this.useDatabase = true;
        console.log("✅ Using database storage");
      } else {
        this.useDatabase = false;
        console.log("⚠️  Database not available, using memory storage");
      }
    } catch (error) {
      console.warn("⚠️  Database initialization failed, using memory storage:", error.message);
      console.error("❌ Full error:", error);
      this.useDatabase = false;
    }
  }

  // Session store - always use database storage (it has fallback)
  get sessionStore() {
    return this.databaseStorage.sessionStore;
  }

  // Helper method to delegate to appropriate storage
  private async delegate<T>(databaseMethod: () => Promise<T>, memoryMethod: () => Promise<T>): Promise<T> {
    if (this.useDatabase) {
      try {
        return await databaseMethod();
      } catch (error) {
        console.warn("⚠️  Database operation failed, falling back to memory storage:", error.message);
        this.useDatabase = false;
      }
    }
    return memoryMethod();
  }

  // User Authentication
  async getUser(id: number): Promise<User | undefined> {
    return this.delegate(
      () => this.databaseStorage.getUser(id),
      () => this.memStorage.getUser(id)
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.delegate(
      () => this.databaseStorage.getUserByUsername(username),
      () => this.memStorage.getUserByUsername(username)
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.delegate(
      () => this.databaseStorage.createUser(userData),
      () => this.memStorage.createUser(userData)
    );
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.delegate(
      () => this.databaseStorage.getOrders(),
      () => this.memStorage.getOrders()
    );
  }

  async getOrdersSince(date: Date): Promise<Order[]> {
    return this.delegate(
      () => this.databaseStorage.getOrdersSince(date),
      () => this.memStorage.getOrdersSince(date)
    );
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.delegate(
      () => this.databaseStorage.getOrdersByStatus(status),
      () => this.memStorage.getOrdersByStatus(status)
    );
  }

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return this.delegate(
      () => this.databaseStorage.getOrdersByCustomerEmail(email),
      () => this.memStorage.getOrdersByCustomerEmail(email)
    );
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.delegate(
      () => this.databaseStorage.getOrderById(id),
      () => this.memStorage.getOrderById(id)
    );
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    return this.delegate(
      () => this.databaseStorage.getOrderByOrderNumber(orderNumber),
      () => this.memStorage.getOrderByOrderNumber(orderNumber)
    );
  }

  async getOrderByShopifyId(shopifyId: string): Promise<Order | undefined> {
    return this.delegate(
      () => this.databaseStorage.getOrderByShopifyId(shopifyId),
      () => this.memStorage.getOrderByShopifyId(shopifyId)
    );
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    return this.delegate(
      () => this.databaseStorage.createOrder(order),
      () => this.memStorage.createOrder(order)
    );
  }

  async updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateOrder(id, order),
      () => this.memStorage.updateOrder(id, order)
    );
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateOrderStatus(id, status),
      () => this.memStorage.updateOrderStatus(id, status)
    );
  }

  // Order Items
  async getAllOrderItems(includeArchived?: boolean): Promise<OrderItem[]> {
    return this.delegate(
      () => this.databaseStorage.getAllOrderItems(includeArchived),
      () => this.memStorage.getAllOrderItems(includeArchived)
    );
  }

  async getOrderItems(orderId: number, includeArchived?: boolean): Promise<OrderItem[]> {
    return this.delegate(
      () => this.databaseStorage.getOrderItems(orderId, includeArchived),
      () => this.memStorage.getOrderItems(orderId, includeArchived)
    );
  }

  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return this.delegate(
      () => this.databaseStorage.getOrderItemsByOrderId(orderId),
      () => this.memStorage.getOrderItemsByOrderId(orderId)
    );
  }

  async getAllOrderItemsByOrderId(orderId: number, includeArchived?: boolean): Promise<OrderItem[]> {
    return this.delegate(
      () => this.databaseStorage.getAllOrderItemsByOrderId(orderId, includeArchived),
      () => this.memStorage.getAllOrderItemsByOrderId(orderId, includeArchived)
    );
  }

  async getOrderItemById(id: number): Promise<OrderItem | undefined> {
    return this.delegate(
      () => this.databaseStorage.getOrderItemById(id),
      () => this.memStorage.getOrderItemById(id)
    );
  }

  async getOrderItemBySerialNumber(serialNumber: string): Promise<OrderItem | undefined> {
    return this.delegate(
      () => this.databaseStorage.getOrderItemBySerialNumber(serialNumber),
      () => this.memStorage.getOrderItemBySerialNumber(serialNumber)
    );
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    return this.delegate(
      () => this.databaseStorage.createOrderItem(item),
      () => this.memStorage.createOrderItem(item)
    );
  }

  async updateOrderItem(id: number, item: Partial<OrderItem>): Promise<OrderItem | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateOrderItem(id, item),
      () => this.memStorage.updateOrderItem(id, item)
    );
  }

  async updateOrderItemStatus(id: number, status: OrderStatus): Promise<OrderItem | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateOrderItemStatus(id, status),
      () => this.memStorage.updateOrderItemStatus(id, status)
    );
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.deleteOrderItem(id),
      () => this.memStorage.deleteOrderItem(id)
    );
  }

  async archiveOrderItem(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.archiveOrderItem(id),
      () => this.memStorage.archiveOrderItem(id)
    );
  }

  async unarchiveOrderItem(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.unarchiveOrderItem(id),
      () => this.memStorage.unarchiveOrderItem(id)
    );
  }

  // Reseller Detection
  async getResellerByEmail(email: string): Promise<Reseller | undefined> {
    return this.delegate(
      () => this.databaseStorage.getResellerByEmail(email),
      () => this.memStorage.getResellerByEmail(email)
    );
  }

  async detectResellerFromEmail(email: string): Promise<{isReseller: boolean, resellerNickname: string | null}> {
    return this.delegate(
      () => this.databaseStorage.detectResellerFromEmail(email),
      () => this.memStorage.detectResellerFromEmail(email)
    );
  }

  // Production Notes
  async getProductionNotes(orderId: number): Promise<ProductionNote[]> {
    return this.delegate(
      () => this.databaseStorage.getProductionNotes(orderId),
      () => this.memStorage.getProductionNotes(orderId)
    );
  }

  async getItemProductionNotes(itemId: number): Promise<ProductionNote[]> {
    return this.delegate(
      () => this.databaseStorage.getItemProductionNotes(itemId),
      () => this.memStorage.getItemProductionNotes(itemId)
    );
  }

  async createProductionNote(note: InsertProductionNote): Promise<ProductionNote> {
    return this.delegate(
      () => this.databaseStorage.createProductionNote(note),
      () => this.memStorage.createProductionNote(note)
    );
  }

  // Materials Inventory
  async getAllMaterials(): Promise<MaterialInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getAllMaterials(),
      () => this.memStorage.getAllMaterials()
    );
  }

  async getMaterialById(id: number): Promise<MaterialInventory | undefined> {
    return this.delegate(
      () => this.databaseStorage.getMaterialById(id),
      () => this.memStorage.getMaterialById(id)
    );
  }

  async getMaterialsByType(type: 'bag' | 'box'): Promise<MaterialInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getMaterialsByType(type),
      () => this.memStorage.getMaterialsByType(type)
    );
  }

  async getLowStockMaterials(): Promise<MaterialInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getLowStockMaterials(),
      () => this.memStorage.getLowStockMaterials()
    );
  }

  async createMaterial(material: InsertMaterialInventory): Promise<MaterialInventory> {
    return this.delegate(
      () => this.databaseStorage.createMaterial(material),
      () => this.memStorage.createMaterial(material)
    );
  }

  async updateMaterial(id: number, material: Partial<MaterialInventory>): Promise<MaterialInventory | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateMaterial(id, material),
      () => this.memStorage.updateMaterial(id, material)
    );
  }

  async deleteMaterial(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.deleteMaterial(id),
      () => this.memStorage.deleteMaterial(id)
    );
  }

  // Material Mapping Rules
  async getAllMaterialRules(): Promise<MaterialMappingRule[]> {
    return this.delegate(
      () => this.databaseStorage.getAllMaterialRules(),
      () => this.memStorage.getAllMaterialRules()
    );
  }

  async getMaterialRuleById(id: number): Promise<MaterialMappingRule | undefined> {
    return this.delegate(
      () => this.databaseStorage.getMaterialRuleById(id),
      () => this.memStorage.getMaterialRuleById(id)
    );
  }

  async getMaterialRulesByInstrumentType(type: string): Promise<MaterialMappingRule[]> {
    return this.delegate(
      () => this.databaseStorage.getMaterialRulesByInstrumentType(type),
      () => this.memStorage.getMaterialRulesByInstrumentType(type)
    );
  }

  async createMaterialRule(rule: InsertMaterialMappingRule): Promise<MaterialMappingRule> {
    return this.delegate(
      () => this.databaseStorage.createMaterialRule(rule),
      () => this.memStorage.createMaterialRule(rule)
    );
  }

  async updateMaterialRule(id: number, rule: Partial<MaterialMappingRule>): Promise<MaterialMappingRule | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateMaterialRule(id, rule),
      () => this.memStorage.updateMaterialRule(id, rule)
    );
  }

  async deleteMaterialRule(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.deleteMaterialRule(id),
      () => this.memStorage.deleteMaterialRule(id)
    );
  }

  // Instrument Inventory
  async getAllInstruments(): Promise<InstrumentInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getAllInstruments(),
      () => this.memStorage.getAllInstruments()
    );
  }

  async getInstrumentById(id: number): Promise<InstrumentInventory | undefined> {
    return this.delegate(
      () => this.databaseStorage.getInstrumentById(id),
      () => this.memStorage.getInstrumentById(id)
    );
  }

  async getInstrumentBySerialNumber(serialNumber: string): Promise<InstrumentInventory | undefined> {
    return this.delegate(
      () => this.databaseStorage.getInstrumentBySerialNumber(serialNumber),
      () => this.memStorage.getInstrumentBySerialNumber(serialNumber)
    );
  }

  async getInstrumentsByType(type: string): Promise<InstrumentInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getInstrumentsByType(type),
      () => this.memStorage.getInstrumentsByType(type)
    );
  }

  async getInstrumentsByStatus(status: string): Promise<InstrumentInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getInstrumentsByStatus(status),
      () => this.memStorage.getInstrumentsByStatus(status)
    );
  }

  async createInstrument(instrument: InsertInstrumentInventory): Promise<InstrumentInventory> {
    return this.delegate(
      () => this.databaseStorage.createInstrument(instrument),
      () => this.memStorage.createInstrument(instrument)
    );
  }

  async updateInstrument(id: number, instrument: Partial<InstrumentInventory>): Promise<InstrumentInventory | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateInstrument(id, instrument),
      () => this.memStorage.updateInstrument(id, instrument)
    );
  }

  async deleteInstrument(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.deleteInstrument(id),
      () => this.memStorage.deleteInstrument(id)
    );
  }

  // Mold Inventory
  async getAllMolds(): Promise<MoldInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getAllMolds(),
      () => this.memStorage.getAllMolds()
    );
  }

  async getMoldById(id: number): Promise<MoldInventory | undefined> {
    return this.delegate(
      () => this.databaseStorage.getMoldById(id),
      () => this.memStorage.getMoldById(id)
    );
  }

  async getMoldsByInstrumentType(type: string): Promise<MoldInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getMoldsByInstrumentType(type),
      () => this.memStorage.getMoldsByInstrumentType(type)
    );
  }

  async createMold(mold: InsertMoldInventory): Promise<MoldInventory> {
    return this.delegate(
      () => this.databaseStorage.createMold(mold),
      () => this.memStorage.createMold(mold)
    );
  }

  async updateMold(id: number, mold: Partial<MoldInventory>): Promise<MoldInventory | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateMold(id, mold),
      () => this.memStorage.updateMold(id, mold)
    );
  }

  async deleteMold(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.deleteMold(id),
      () => this.memStorage.deleteMold(id)
    );
  }

  // Mold Mappings
  async getAllMoldMappings(): Promise<MoldMapping[]> {
    return this.delegate(
      () => this.databaseStorage.getAllMoldMappings(),
      () => this.memStorage.getAllMoldMappings()
    );
  }

  async getMoldMappingById(id: number): Promise<MoldMapping | undefined> {
    return this.delegate(
      () => this.databaseStorage.getMoldMappingById(id),
      () => this.memStorage.getMoldMappingById(id)
    );
  }

  async getMoldMappingsByInstrumentType(type: string): Promise<MoldMapping[]> {
    return this.delegate(
      () => this.databaseStorage.getMoldMappingsByInstrumentType(type),
      () => this.memStorage.getMoldMappingsByInstrumentType(type)
    );
  }

  async getMoldMappingByTuning(instrumentType: string, tuningNote: string): Promise<MoldMapping | undefined> {
    return this.delegate(
      () => this.databaseStorage.getMoldMappingByTuning(instrumentType, tuningNote),
      () => this.memStorage.getMoldMappingByTuning(instrumentType, tuningNote)
    );
  }

  async createMoldMapping(mapping: InsertMoldMapping): Promise<MoldMapping> {
    return this.delegate(
      () => this.databaseStorage.createMoldMapping(mapping),
      () => this.memStorage.createMoldMapping(mapping)
    );
  }

  async updateMoldMapping(id: number, mapping: Partial<MoldMapping>): Promise<MoldMapping | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateMoldMapping(id, mapping),
      () => this.memStorage.updateMoldMapping(id, mapping)
    );
  }

  async deleteMoldMapping(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.deleteMoldMapping(id),
      () => this.memStorage.deleteMoldMapping(id)
    );
  }

  // Mold Mapping Items
  async getMappingMolds(mappingId: number): Promise<(MoldMappingItem & MoldInventory)[]> {
    return this.delegate(
      () => this.databaseStorage.getMappingMolds(mappingId),
      () => this.memStorage.getMappingMolds(mappingId)
    );
  }

  async addMoldToMapping(mappingId: number, moldId: number, orderIndex?: number): Promise<MoldMappingItem> {
    return this.delegate(
      () => this.databaseStorage.addMoldToMapping(mappingId, moldId, orderIndex),
      () => this.memStorage.addMoldToMapping(mappingId, moldId, orderIndex)
    );
  }

  async removeMoldFromMapping(mappingItemId: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.removeMoldFromMapping(mappingItemId),
      () => this.memStorage.removeMoldFromMapping(mappingItemId)
    );
  }

  async updateMoldMappingOrder(mappingItemId: number, newOrderIndex: number): Promise<MoldMappingItem | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateMoldMappingOrder(mappingItemId, newOrderIndex),
      () => this.memStorage.updateMoldMappingOrder(mappingItemId, newOrderIndex)
    );
  }

  // Resellers
  async getAllResellers(): Promise<Reseller[]> {
    return this.delegate(
      () => this.databaseStorage.getAllResellers(),
      () => this.memStorage.getAllResellers()
    );
  }

  async getResellerById(id: number): Promise<Reseller | undefined> {
    return this.delegate(
      () => this.databaseStorage.getResellerById(id),
      () => this.memStorage.getResellerById(id)
    );
  }

  async getResellerByNickname(nickname: string): Promise<Reseller | undefined> {
    return this.delegate(
      () => this.databaseStorage.getResellerByNickname(nickname),
      () => this.memStorage.getResellerByNickname(nickname)
    );
  }

  async getActiveResellers(): Promise<Reseller[]> {
    return this.delegate(
      () => this.databaseStorage.getActiveResellers(),
      () => this.memStorage.getActiveResellers()
    );
  }

  async createReseller(reseller: InsertReseller): Promise<Reseller> {
    return this.delegate(
      () => this.databaseStorage.createReseller(reseller),
      () => this.memStorage.createReseller(reseller)
    );
  }

  async updateReseller(id: number, reseller: Partial<Reseller>): Promise<Reseller | undefined> {
    return this.delegate(
      () => this.databaseStorage.updateReseller(id, reseller),
      () => this.memStorage.updateReseller(id, reseller)
    );
  }

  async deleteReseller(id: number): Promise<boolean> {
    return this.delegate(
      () => this.databaseStorage.deleteReseller(id),
      () => this.memStorage.deleteReseller(id)
    );
  }

  // Helper method for getting molds for instrument
  async getMoldsForInstrument(instrumentType: string, tuningNote: string): Promise<MoldInventory[]> {
    return this.delegate(
      () => this.databaseStorage.getMoldsForInstrument(instrumentType, tuningNote),
      () => this.memStorage.getMoldsForInstrument(instrumentType, tuningNote)
    );
  }
}

export const storage = new HybridStorage();
