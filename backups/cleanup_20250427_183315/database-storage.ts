import { 
  orders, orderItems, productionNotes, users, resellers,
  materialsInventory, materialMappingRules, instrumentInventory,
  moldInventory, moldMappings, moldMappingItems,
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
  OrderStatus 
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, desc, asc, or, like, ilike, isNull, gte, lte } from "drizzle-orm";
import createMemoryStore from "memorystore";
import session from "express-session";
import pgSessionStore from "connect-pg-simple";
import { pool } from "./db";

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    const PgStore = pgSessionStore(session);
    this.sessionStore = new PgStore({
      pool: pool,
      tableName: 'session', // Default table name for connect-pg-simple
      createTableIfMissing: true
    });
  }

  // User Authentication
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    // Sort by order number ascending (oldest first) as requested by the user
    return await db.select().from(orders).orderBy(asc(orders.orderNumber));
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    // Also change the sort order here to match getOrders (oldest first by order number)
    return await db.select().from(orders).where(eq(orders.status, status)).orderBy(asc(orders.orderNumber));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async getOrderByShopifyId(shopifyId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.shopifyOrderId, shopifyId));
    return order;
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async updateOrder(id: number, updateData: Partial<Order>): Promise<Order | undefined> {
    // Check if this order update includes reseller information
    if (updateData.isReseller && updateData.resellerNickname) {
      // Check if this reseller nickname already exists in the database
      const existingReseller = await this.getResellerByNickname(updateData.resellerNickname);
      
      // If the reseller doesn't exist yet, create a new one
      if (!existingReseller) {
        console.log(`Creating new reseller with nickname: ${updateData.resellerNickname}`);
        await this.createReseller({
          nickname: updateData.resellerNickname,
          isActive: true,  // New resellers are active by default
          name: updateData.resellerNickname,  // Use nickname as name if none provided
          email: null,  // These can be updated later if needed
          phone: null,
          address: null,
          notes: `Auto-created from order ${id}`
        });
      }
    }
    
    // Update the order after potentially creating a reseller
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const order = await this.getOrderById(id);
    if (!order) return undefined;
    
    // Record the date of this status change
    const statusChangeDates = order.statusChangeDates || {};
    statusChangeDates[status] = new Date();
    
    return this.updateOrder(id, { 
      status, 
      statusChangeDates 
    });
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.serialNumber));
  }

  async getOrderItemById(id: number): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return item;
  }

  async getOrderItemBySerialNumber(serialNumber: string): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.serialNumber, serialNumber));
    return item;
  }

  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(itemData).returning();
    return item;
  }

  async updateOrderItem(id: number, updateData: Partial<OrderItem>): Promise<OrderItem | undefined> {
    // Create a copy of updateData so we don't modify the original
    const processedUpdateData = { ...updateData };
    
    // Log the state of buildDate for debugging
    if ('buildDate' in processedUpdateData) {
      console.log(`DatabaseStorage: Processing buildDate with type ${typeof processedUpdateData.buildDate}:`, processedUpdateData.buildDate);
      
      // Handle buildDate specifically to ensure it's a proper Date object
      // (the REST API can't properly serialize JS Date objects, so we might get a string)
      if (processedUpdateData.buildDate) {
        if (typeof processedUpdateData.buildDate === 'string') {
          try {
            // Convert ISO string to Date object
            const date = new Date(processedUpdateData.buildDate);
            if (!isNaN(date.getTime())) {
              console.log(`Converting buildDate string to Date object: ${date}`);
              processedUpdateData.buildDate = date;
            } else {
              console.error(`Invalid date string: ${processedUpdateData.buildDate}`);
              // If invalid date string, remove it to avoid errors
              delete processedUpdateData.buildDate;
            }
          } catch (e) {
            console.error(`Error parsing date string: ${e}`);
            // If date parsing fails, remove to avoid errors
            delete processedUpdateData.buildDate;
          }
        } 
        // If it's already a Date object, keep it
      }
    }
    
    // IMPORTANT: Drizzle ORM expects Date objects for date columns
    
    const [updatedItem] = await db
      .update(orderItems)
      .set({ ...processedUpdateData, updatedAt: new Date() })
      .where(eq(orderItems.id, id))
      .returning();
    
    return updatedItem;
  }

  async updateOrderItemStatus(id: number, status: OrderStatus): Promise<OrderItem | undefined> {
    const item = await this.getOrderItemById(id);
    if (!item) return undefined;
    
    // Record the date of this status change
    const statusChangeDates = item.statusChangeDates || {};
    statusChangeDates[status] = new Date();
    
    return this.updateOrderItem(id, { 
      status, 
      statusChangeDates 
    });
  }

  // Production Notes
  async getProductionNotes(orderId: number): Promise<ProductionNote[]> {
    return await db
      .select()
      .from(productionNotes)
      .where(eq(productionNotes.orderId, orderId))
      .orderBy(desc(productionNotes.createdAt));
  }

  async getItemProductionNotes(itemId: number): Promise<ProductionNote[]> {
    return await db
      .select()
      .from(productionNotes)
      .where(eq(productionNotes.itemId, itemId))
      .orderBy(desc(productionNotes.createdAt));
  }

  async createProductionNote(noteData: InsertProductionNote): Promise<ProductionNote> {
    const [note] = await db.insert(productionNotes).values(noteData).returning();
    return note;
  }

  // Materials Inventory
  async getAllMaterials(): Promise<MaterialInventory[]> {
    return await db
      .select()
      .from(materialsInventory)
      .orderBy(asc(materialsInventory.materialType), asc(materialsInventory.displayOrder));
  }
  
  async getMaterialById(id: number): Promise<MaterialInventory | undefined> {
    const [material] = await db.select().from(materialsInventory).where(eq(materialsInventory.id, id));
    return material;
  }
  
  async getMaterialsByType(type: 'bag' | 'box'): Promise<MaterialInventory[]> {
    return await db
      .select()
      .from(materialsInventory)
      .where(eq(materialsInventory.materialType, type))
      .orderBy(asc(materialsInventory.displayOrder));
  }
  
  async getLowStockMaterials(): Promise<MaterialInventory[]> {
    return await db
      .select()
      .from(materialsInventory)
      .where(
        and(
          gte(materialsInventory.reorderPoint, materialsInventory.quantity),
          gte(materialsInventory.reorderPoint, 0) // Only if a reorder point is set
        )
      )
      .orderBy(asc(materialsInventory.quantity));
  }
  
  async createMaterial(materialData: InsertMaterialInventory): Promise<MaterialInventory> {
    const [material] = await db
      .insert(materialsInventory)
      .values({
        ...materialData,
        lastUpdated: new Date()
      })
      .returning();
      
    return material;
  }
  
  async updateMaterial(id: number, updateData: Partial<MaterialInventory>): Promise<MaterialInventory | undefined> {
    const [updatedMaterial] = await db
      .update(materialsInventory)
      .set({ 
        ...updateData,
        lastUpdated: new Date()
      })
      .where(eq(materialsInventory.id, id))
      .returning();
    
    return updatedMaterial;
  }
  
  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db
      .delete(materialsInventory)
      .where(eq(materialsInventory.id, id))
      .returning({ id: materialsInventory.id });
      
    return result.length > 0;
  }
  
  // Material Mapping Rules
  async getAllMaterialRules(): Promise<MaterialMappingRule[]> {
    return await db
      .select()
      .from(materialMappingRules)
      .orderBy(desc(materialMappingRules.priority));
  }
  
  async getMaterialRuleById(id: number): Promise<MaterialMappingRule | undefined> {
    const [rule] = await db
      .select()
      .from(materialMappingRules)
      .where(eq(materialMappingRules.id, id));
      
    return rule;
  }
  
  async getMaterialRulesByInstrumentType(instrumentType: string): Promise<MaterialMappingRule[]> {
    return await db
      .select()
      .from(materialMappingRules)
      .where(
        and(
          eq(materialMappingRules.instrumentType, instrumentType),
          eq(materialMappingRules.isActive, true)
        )
      )
      .orderBy(desc(materialMappingRules.priority));
  }
  
  async createMaterialRule(ruleData: InsertMaterialMappingRule): Promise<MaterialMappingRule> {
    const [rule] = await db
      .insert(materialMappingRules)
      .values(ruleData)
      .returning();
      
    return rule;
  }
  
  async updateMaterialRule(id: number, updateData: Partial<MaterialMappingRule>): Promise<MaterialMappingRule | undefined> {
    const [updatedRule] = await db
      .update(materialMappingRules)
      .set({ 
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(materialMappingRules.id, id))
      .returning();
    
    return updatedRule;
  }
  
  async deleteMaterialRule(id: number): Promise<boolean> {
    const result = await db
      .delete(materialMappingRules)
      .where(eq(materialMappingRules.id, id))
      .returning({ id: materialMappingRules.id });
      
    return result.length > 0;
  }
  
  // Instrument Inventory
  async getAllInstruments(): Promise<InstrumentInventory[]> {
    return await db
      .select()
      .from(instrumentInventory)
      .orderBy(asc(instrumentInventory.serialNumber));
  }
  
  async getInstrumentById(id: number): Promise<InstrumentInventory | undefined> {
    const [instrument] = await db
      .select()
      .from(instrumentInventory)
      .where(eq(instrumentInventory.id, id));
      
    return instrument;
  }
  
  async getInstrumentBySerialNumber(serialNumber: string): Promise<InstrumentInventory | undefined> {
    const [instrument] = await db
      .select()
      .from(instrumentInventory)
      .where(eq(instrumentInventory.serialNumber, serialNumber));
      
    return instrument;
  }
  
  async getInstrumentsByType(type: string): Promise<InstrumentInventory[]> {
    return await db
      .select()
      .from(instrumentInventory)
      .where(eq(instrumentInventory.instrumentType, type))
      .orderBy(asc(instrumentInventory.serialNumber));
  }
  
  async getInstrumentsByStatus(status: string): Promise<InstrumentInventory[]> {
    return await db
      .select()
      .from(instrumentInventory)
      .where(eq(instrumentInventory.status, status))
      .orderBy(asc(instrumentInventory.serialNumber));
  }
  
  async createInstrument(instrumentData: InsertInstrumentInventory): Promise<InstrumentInventory> {
    // Ensure required fields
    const dataToInsert = {
      ...instrumentData,
      status: instrumentData.status || 'available'
    };
    
    const [instrument] = await db
      .insert(instrumentInventory)
      .values(dataToInsert)
      .returning();
      
    return instrument;
  }
  
  async updateInstrument(id: number, updateData: Partial<InstrumentInventory>): Promise<InstrumentInventory | undefined> {
    const [updatedInstrument] = await db
      .update(instrumentInventory)
      .set({ 
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(instrumentInventory.id, id))
      .returning();
    
    return updatedInstrument;
  }
  
  async deleteInstrument(id: number): Promise<boolean> {
    const result = await db
      .delete(instrumentInventory)
      .where(eq(instrumentInventory.id, id))
      .returning({ id: instrumentInventory.id });
      
    return result.length > 0;
  }
  
  // Mold Inventory
  async getAllMolds(): Promise<MoldInventory[]> {
    return await db
      .select()
      .from(moldInventory)
      .orderBy(asc(moldInventory.instrumentType), asc(moldInventory.name));
  }
  
  async getMoldById(id: number): Promise<MoldInventory | undefined> {
    const [mold] = await db
      .select()
      .from(moldInventory)
      .where(eq(moldInventory.id, id));
      
    return mold;
  }
  
  async getMoldsByInstrumentType(type: string): Promise<MoldInventory[]> {
    return await db
      .select()
      .from(moldInventory)
      .where(eq(moldInventory.instrumentType, type))
      .orderBy(asc(moldInventory.name));
  }
  
  async createMold(moldData: InsertMoldInventory): Promise<MoldInventory> {
    const [mold] = await db
      .insert(moldInventory)
      .values(moldData)
      .returning();
      
    return mold;
  }
  
  async updateMold(id: number, updateData: Partial<MoldInventory>): Promise<MoldInventory | undefined> {
    const [updatedMold] = await db
      .update(moldInventory)
      .set({ 
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(moldInventory.id, id))
      .returning();
    
    return updatedMold;
  }
  
  async deleteMold(id: number): Promise<boolean> {
    const result = await db
      .delete(moldInventory)
      .where(eq(moldInventory.id, id))
      .returning({ id: moldInventory.id });
      
    return result.length > 0;
  }
  
  // Mold Mappings
  async getAllMoldMappings(): Promise<MoldMapping[]> {
    return await db
      .select()
      .from(moldMappings)
      .orderBy(asc(moldMappings.instrumentType), asc(moldMappings.tuningNote));
  }
  
  async getMoldMappingById(id: number): Promise<MoldMapping | undefined> {
    const [mapping] = await db
      .select()
      .from(moldMappings)
      .where(eq(moldMappings.id, id));
      
    return mapping;
  }
  
  async getMoldMappingsByInstrumentType(type: string): Promise<MoldMapping[]> {
    return await db
      .select()
      .from(moldMappings)
      .where(eq(moldMappings.instrumentType, type))
      .orderBy(asc(moldMappings.tuningNote));
  }
  
  async getMoldMappingByTuning(instrumentType: string, tuningNote: string): Promise<MoldMapping | undefined> {
    try {
      console.log(`SEARCH: Looking for exact match: ${instrumentType}, ${tuningNote}`);
      
      // First try exact match
      let [mapping] = await db
        .select()
        .from(moldMappings)
        .where(
          and(
            eq(moldMappings.instrumentType, instrumentType),
            eq(moldMappings.tuningNote, tuningNote),
            eq(moldMappings.isActive, true)
          )
        );
      
      if (mapping) return mapping;
      
      // Try case-insensitive search if exact match fails
      console.log(`SEARCH: Trying case-insensitive search...`);
      [mapping] = await db
        .select()
        .from(moldMappings)
        .where(
          and(
            ilike(moldMappings.instrumentType, instrumentType),
            ilike(moldMappings.tuningNote, tuningNote),
            eq(moldMappings.isActive, true)
          )
        );
      
      return mapping;
    } catch (error) {
      console.error(`Error finding mold mapping for ${instrumentType} ${tuningNote}:`, error);
      return undefined;
    }
  }
  
  async createMoldMapping(mappingData: InsertMoldMapping): Promise<MoldMapping> {
    const [mapping] = await db
      .insert(moldMappings)
      .values(mappingData)
      .returning();
      
    return mapping;
  }
  
  async updateMoldMapping(id: number, updateData: Partial<MoldMapping>): Promise<MoldMapping | undefined> {
    const [updatedMapping] = await db
      .update(moldMappings)
      .set({ 
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(moldMappings.id, id))
      .returning();
    
    return updatedMapping;
  }
  
  async deleteMoldMapping(id: number): Promise<boolean> {
    // First delete all mapping items
    await db
      .delete(moldMappingItems)
      .where(eq(moldMappingItems.mappingId, id));
    
    // Then delete the mapping itself
    const result = await db
      .delete(moldMappings)
      .where(eq(moldMappings.id, id))
      .returning({ id: moldMappings.id });
      
    return result.length > 0;
  }
  
  // Mold Mapping Items
  async getMappingMolds(mappingId: number): Promise<(MoldMappingItem & MoldInventory)[]> {
    // Log voor debugging
    console.log(`Fetching molds for mapping ID ${mappingId}`);
    
    const results = await db
      .select()
      .from(moldMappingItems)
      .innerJoin(moldInventory, eq(moldMappingItems.moldId, moldInventory.id))
      .where(eq(moldMappingItems.mappingId, mappingId))
      .orderBy(asc(moldMappingItems.orderIndex));
    
    // Verwijder dubbele ID's en zorg ervoor dat de mapping item ID correct is
    const convertedResults = results.map(row => {
      const mappingItem = { ...row.mold_mapping_items };
      const mold = { ...row.mold_inventory };
      
      // Gebruik expliciet het mold_mapping_items.id als id
      return {
        id: mappingItem.id, // Dit is het mapping item ID dat we nodig hebben voor verwijderen
        mappingId: mappingItem.mappingId,
        moldId: mappingItem.moldId,
        orderIndex: mappingItem.orderIndex,
        createdAt: mappingItem.createdAt,
        // Mold eigenschappen
        name: mold.name,
        size: mold.size,
        instrumentType: mold.instrumentType,
        isActive: mold.isActive,
        notes: mold.notes,
        lastUsed: mold.lastUsed,
        updatedAt: mold.updatedAt
      };
    }).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    console.log(`Mold mapping items for mapping ${mappingId}:`, convertedResults.map(item => 
      `ID: ${item.id}, moldId: ${item.moldId}, name: ${item.name}`).join('\n'));
    
    return convertedResults;
  }
  
  async addMoldToMapping(mappingId: number, moldId: number, orderIndex?: number): Promise<MoldMappingItem> {
    const [mappingItem] = await db
      .insert(moldMappingItems)
      .values({
        mappingId,
        moldId,
        orderIndex: orderIndex || 0
      })
      .returning();
      
    return mappingItem;
  }
  
  async removeMoldFromMapping(mappingItemId: number): Promise<boolean> {
    console.log(`Database storage: Removing mold mapping item with ID ${mappingItemId}`);
    try {
      // Eerst controleren of het item bestaat
      const existingItems = await db
        .select({ id: moldMappingItems.id })
        .from(moldMappingItems)
        .where(eq(moldMappingItems.id, mappingItemId));
      
      if (existingItems.length === 0) {
        console.log(`Database storage: No mold mapping item found with ID ${mappingItemId}`);
        return false;
      }
      
      console.log(`Database storage: Found mold mapping item with ID ${mappingItemId}, proceeding with deletion`);
      
      const result = await db
        .delete(moldMappingItems)
        .where(eq(moldMappingItems.id, mappingItemId))
        .returning({ id: moldMappingItems.id });
        
      console.log(`Database storage: Delete operation result:`, result);
      return result.length > 0;
    } catch (error) {
      console.error(`Database storage: Error removing mold mapping item with ID ${mappingItemId}:`, error);
      throw error;
    }
  }
  
  async updateMoldMappingOrder(mappingItemId: number, newOrderIndex: number): Promise<MoldMappingItem | undefined> {
    const [updatedItem] = await db
      .update(moldMappingItems)
      .set({ orderIndex: newOrderIndex })
      .where(eq(moldMappingItems.id, mappingItemId))
      .returning();
    
    return updatedItem;
  }
  
  // Helper methods
  async getMoldsForInstrument(instrumentType: string, tuningNote: string): Promise<MoldInventory[]> {
    console.log(`API REQUEST: Looking for molds for ${instrumentType} with tuning note ${tuningNote} (decoded from ${tuningNote})`);
    console.log(`Looking for molds for ${instrumentType} ${tuningNote} (before case normalization)`);
    
    try {
      console.log(`IMPORTANT - Lookup Request: ${instrumentType} with tuning ${tuningNote}`);
      
      // First try direct SQL query to check what's available
      console.log(`DEBUG: Running direct SQL query to check available mappings for ${instrumentType}`);
      const mappingResult = await pool.query(
        `SELECT id, instrument_type, tuning_note FROM mold_mappings 
         WHERE instrument_type ILIKE $1`,
        [instrumentType]
      );
      console.log(`DEBUG: Available mappings for ${instrumentType}:`, mappingResult.rows);
      
      // Get the mold mapping for this instrument and tuning
      const mapping = await this.getMoldMappingByTuning(instrumentType, tuningNote);
      
      if (!mapping) {
        console.log(`No mapping found for ${instrumentType} ${tuningNote}, returning empty array`);
        return [];
      }
      
      // Get all molds associated with this mapping
      return this.getMappingMolds(mapping.id);
    } catch (error) {
      console.error(`Error retrieving molds for ${instrumentType} ${tuningNote}:`, error);
      return [];
    }
  }

  // Flute Settings verwijderd

  // Resellers
  async getAllResellers(): Promise<Reseller[]> {
    return await db
      .select()
      .from(resellers)
      .orderBy(asc(resellers.nickname));
  }
  
  async getResellerById(id: number): Promise<Reseller | undefined> {
    const [reseller] = await db
      .select()
      .from(resellers)
      .where(eq(resellers.id, id));
      
    return reseller;
  }
  
  async getResellerByNickname(nickname: string): Promise<Reseller | undefined> {
    const [reseller] = await db
      .select()
      .from(resellers)
      .where(eq(resellers.nickname, nickname));
      
    return reseller;
  }
  
  async getActiveResellers(): Promise<Reseller[]> {
    return await db
      .select()
      .from(resellers)
      .where(eq(resellers.isActive, true))
      .orderBy(asc(resellers.nickname));
  }
  
  async createReseller(resellerData: InsertReseller): Promise<Reseller> {
    const [reseller] = await db
      .insert(resellers)
      .values({
        ...resellerData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return reseller;
  }
  
  async updateReseller(id: number, updateData: Partial<Reseller>): Promise<Reseller | undefined> {
    const [updatedReseller] = await db
      .update(resellers)
      .set({ 
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(resellers.id, id))
      .returning();
    
    return updatedReseller;
  }
  
  async deleteReseller(id: number): Promise<boolean> {
    const result = await db
      .delete(resellers)
      .where(eq(resellers.id, id))
      .returning({ id: resellers.id });
      
    return result.length > 0;
  }
}