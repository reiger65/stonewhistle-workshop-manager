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
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, desc, asc, or, like, ilike, isNull, isNotNull, gt, gte, lte, sql } from "drizzle-orm";
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
    console.log("DATABASE-STORAGE: Fetching ALL orders, INCLUDING archived ones");
    // Sort by order number ascending (oldest first) as requested by the user
    // IMPORTANT: This method returns ALL orders, including archived ones
    // Callers should filter by status if they only want active orders
    const allOrders = await db.select().from(orders).orderBy(asc(orders.orderNumber));
    
    // Add specific debug logging for critical orders
    const criticalOrderNumbers = ['SW-1537', 'SW-1546', 'SW-1559'];
    const criticalOrdersFound = allOrders
      .filter(order => criticalOrderNumbers.includes(order.orderNumber || ''))
      .map(order => `${order.orderNumber} (status=${order.status})`);
    
    console.log(`DATABASE-STORAGE: getOrders() found ${allOrders.length} total orders`);
    console.log(`DATABASE-STORAGE: Critical orders found: ${criticalOrdersFound.length > 0 ? criticalOrdersFound.join(', ') : 'NONE'}`);
    
    return allOrders;
  }
  
  /**
   * Get all orders without any time limit or filtering
   * Specifically for displaying completed orders, including archived ones with tracking info
   */
  async getOrdersWithoutTimeLimit(): Promise<Order[]> {
    console.log("DATABASE-STORAGE: Fetching ALL orders for completed page, including archived ones");
    
    // Get all orders, sorted by order number descending (newest first)
    const allOrders = await db.select().from(orders).orderBy(desc(orders.orderNumber));
    
    console.log(`DATABASE-STORAGE: Found ${allOrders.length} total orders without time limit`);
    
    // Specifically log how many orders have tracking information
    const ordersWithTracking = allOrders.filter(order => 
      order.trackingNumber && order.trackingNumber.length > 0
    );
    
    console.log(`DATABASE-STORAGE: Found ${ordersWithTracking.length} orders with tracking information`);
    
    return allOrders;
  }
  
  /**
   * Haalt alle orders op vanaf een bepaalde datum (voor 6-maanden filter optimalisatie)
   * Vereenvoudigde versie die alle orders ophaalt en daarna client-side filtert
   */
  async getOrdersSince(date: Date): Promise<Order[]> {
    try {
      // Haal alle orders op, gesorteerd op ordernummer (oudste eerst)
      const allOrders = await this.getOrders();
      
      // Filter de orders op basis van de createdAt datum (JavaScript-side)
      const cutoffDate = date.getTime();
      const filteredOrders = allOrders.filter(order => {
        // Als een order geen createdAt heeft, behouden we deze voor de zekerheid
        if (!order.createdAt) return true;
        
        // Anders controleren we of de createdAt datum recenter is dan onze cutoff
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= cutoffDate;
      });
      
      console.log(`Filtering beperkt orders van ${allOrders.length} naar ${filteredOrders.length} orders sinds ${date.toISOString()}`);
      return filteredOrders;
    } catch (error) {
      console.error("Error in getOrdersSince:", error);
      console.log("Fallback naar alle orders vanwege filterfout");
      return this.getOrders();
    }
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    // Also change the sort order here to match getOrders (oldest first by order number)
    return await db.select().from(orders).where(eq(orders.status, status)).orderBy(asc(orders.orderNumber));
  }
  
  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    // Find all orders that match the email, ordered by newest first
    return await db.select().from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));
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
    try {
      // Check if this order update includes reseller information
      if (updateData.isReseller && updateData.resellerNickname) {
        // Check if this reseller nickname already exists in the database
        const existingReseller = await this.getResellerByNickname(updateData.resellerNickname);
        
        // If the reseller doesn't exist yet, create a new one
        if (!existingReseller) {
          console.log(`Creating new reseller with nickname: ${updateData.resellerNickname}`);
          
          // Get the order to use customer info as default reseller info
          const order = await this.getOrderById(id);
          
          await this.createReseller({
            nickname: updateData.resellerNickname,
            isActive: true,  // New resellers are active by default
            name: updateData.resellerNickname,  // Use nickname as name if none provided
            contactName: order?.customerName || updateData.resellerNickname, // Use customer name or nickname as contact
            email: order?.customerEmail || `${updateData.resellerNickname.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Use a placeholder email if none available
            phone: order?.customerPhone || "",
            address: order?.customerAddress || "",
            city: order?.customerCity || "",
            state: order?.customerState || "",
            zip: order?.customerZip || "",
            country: order?.customerCountry || "US",
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
    } catch (error) {
      console.error("Error updating order:", error);
      throw error; // Re-throw to be caught by the route handler
    }
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
  /**
   * Get all order items across all orders, with option to include or exclude archived items
   */
  async getAllOrderItems(includeArchived: boolean = false): Promise<OrderItem[]> {
    console.log(`getAllOrderItems: Retrieving all items (includeArchived=${includeArchived})`);
    
    const query = includeArchived ? 
      db.select().from(orderItems) :
      db.select().from(orderItems).where(eq(orderItems.isArchived, false));
    
    const items = await query;
    console.log(`getAllOrderItems: Retrieved ${items.length} items`);
    return items;
  }
  
  async getOrderItems(orderId: number, includeArchived: boolean = false): Promise<OrderItem[]> {
    // Create the WHERE condition based on includeArchived parameter
    const whereCondition = includeArchived
      ? eq(orderItems.orderId, orderId) // If includeArchived is true, only filter by orderId
      : and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.isArchived, false) // Also filter out archived items
        );
    
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        serialNumber: orderItems.serialNumber,
        itemType: orderItems.itemType,
        itemSize: orderItems.itemSize,
        tuningType: orderItems.tuningType,
        color: orderItems.color,
        weight: orderItems.weight,
        craftsperson: orderItems.craftsperson,
        orderNumber: orderItems.orderNumber,
        orderDate: orderItems.orderDate,
        deadline: orderItems.deadline,
        buildDate: orderItems.buildDate,
        bagSize: orderItems.bagSize,
        boxSize: orderItems.boxSize,
        shopifyLineItemId: orderItems.shopifyLineItemId,
        specifications: orderItems.specifications,
        status: orderItems.status,
        progress: orderItems.progress,
        statusChangeDates: orderItems.statusChangeDates,
        isArchived: orderItems.isArchived,
        archivedReason: orderItems.archivedReason,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt
      })
      .from(orderItems)
      .where(whereCondition)
      .orderBy(asc(orderItems.serialNumber));
  }

  // Vind alle items zonder orderId filter (voor filtering operaties)
  async getAllOrderItems(includeArchived: boolean = false): Promise<OrderItem[]> {
    console.log(`Fetching all order items (includeArchived=${includeArchived})`);
    
    const query = includeArchived ? undefined : eq(orderItems.isArchived, false);
    
    const results = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        serialNumber: orderItems.serialNumber,
        itemType: orderItems.itemType,
        itemSize: orderItems.itemSize,
        tuningType: orderItems.tuningType,
        color: orderItems.color,
        weight: orderItems.weight,
        craftsperson: orderItems.craftsperson,
        orderNumber: orderItems.orderNumber,
        orderDate: orderItems.orderDate,
        deadline: orderItems.deadline,
        buildDate: orderItems.buildDate,
        bagSize: orderItems.bagSize,
        boxSize: orderItems.boxSize,
        shopifyLineItemId: orderItems.shopifyLineItemId,
        specifications: orderItems.specifications,
        status: orderItems.status,
        progress: orderItems.progress,
        statusChangeDates: orderItems.statusChangeDates,
        isArchived: orderItems.isArchived,
        archivedReason: orderItems.archivedReason,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt
      })
      .from(orderItems)
      .where(query)
      .orderBy(asc(orderItems.serialNumber));
    
    console.log(`Fetched ${results.length} total order items`);
    return results;
  }
  
  // Vind ook gearchiveerde items voor een specifieke order (voor admin doeleinden)
  async getAllOrderItemsByOrderId(orderId: number, includeArchived: boolean = false): Promise<OrderItem[]> {
    const query = includeArchived
      ? eq(orderItems.orderId, orderId)
      : and(eq(orderItems.orderId, orderId), eq(orderItems.isArchived, false));
      
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        serialNumber: orderItems.serialNumber,
        itemType: orderItems.itemType,
        itemSize: orderItems.itemSize,
        tuningType: orderItems.tuningType,
        color: orderItems.color,
        weight: orderItems.weight,
        craftsperson: orderItems.craftsperson,
        orderNumber: orderItems.orderNumber,
        orderDate: orderItems.orderDate,
        deadline: orderItems.deadline,
        buildDate: orderItems.buildDate,
        bagSize: orderItems.bagSize,
        boxSize: orderItems.boxSize,
        shopifyLineItemId: orderItems.shopifyLineItemId,
        specifications: orderItems.specifications,
        status: orderItems.status,
        progress: orderItems.progress,
        statusChangeDates: orderItems.statusChangeDates,
        isArchived: orderItems.isArchived,
        archivedReason: orderItems.archivedReason,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt
      })
      .from(orderItems)
      .where(query)
      .orderBy(asc(orderItems.serialNumber));
  }
  
  /**
   * Get all order items by order ID - includes both active and archived items
   * This is needed for Shopify sync archiving operations
   */
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.serialNumber));
  }

  async getOrderItemById(id: number): Promise<OrderItem | undefined> {
    const [item] = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        serialNumber: orderItems.serialNumber,
        itemType: orderItems.itemType,
        itemSize: orderItems.itemSize,
        tuningType: orderItems.tuningType,
        color: orderItems.color,
        weight: orderItems.weight,
        craftsperson: orderItems.craftsperson,
        orderNumber: orderItems.orderNumber,
        orderDate: orderItems.orderDate,
        deadline: orderItems.deadline,
        buildDate: orderItems.buildDate,
        bagSize: orderItems.bagSize,
        boxSize: orderItems.boxSize,
        shopifyLineItemId: orderItems.shopifyLineItemId,
        specifications: orderItems.specifications,
        status: orderItems.status,
        progress: orderItems.progress,
        statusChangeDates: orderItems.statusChangeDates,
        isArchived: orderItems.isArchived,
        archivedReason: orderItems.archivedReason,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt
      })
      .from(orderItems)
      .where(eq(orderItems.id, id));
    return item;
  }

  /**
   * Zoek een order item op serienummer, INCLUSIEF gearchiveerde items
   * Dit is belangrijk voor het vermijden van duplicate key errors
   */
  async getOrderItemBySerialNumber(serialNumber: string): Promise<OrderItem | undefined> {
    // We zoeken nu naar alle items met dit serienummer, ongeacht archiefstatus
    const [item] = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        serialNumber: orderItems.serialNumber,
        itemType: orderItems.itemType,
        itemSize: orderItems.itemSize,
        tuningType: orderItems.tuningType,
        color: orderItems.color,
        weight: orderItems.weight,
        craftsperson: orderItems.craftsperson,
        orderNumber: orderItems.orderNumber,
        orderDate: orderItems.orderDate,
        deadline: orderItems.deadline,
        buildDate: orderItems.buildDate,
        bagSize: orderItems.bagSize,
        boxSize: orderItems.boxSize,
        shopifyLineItemId: orderItems.shopifyLineItemId,
        specifications: orderItems.specifications,
        status: orderItems.status,
        progress: orderItems.progress,
        statusChangeDates: orderItems.statusChangeDates,
        isArchived: orderItems.isArchived,
        archivedReason: orderItems.archivedReason,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt
      })
      .from(orderItems)
      .where(eq(orderItems.serialNumber, serialNumber));
    return item;
  }
  
  /**
   * Zoek een gearchiveerd item met hetzelfde serienummer
   * @deprecated Gebruik getOrderItemBySerialNumber en check isArchived
   */
  async findArchivedItem(serialNumber: string): Promise<OrderItem | undefined> {
    const [item] = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        serialNumber: orderItems.serialNumber,
        itemType: orderItems.itemType,
        itemSize: orderItems.itemSize,
        tuningType: orderItems.tuningType,
        color: orderItems.color,
        weight: orderItems.weight,
        craftsperson: orderItems.craftsperson,
        orderNumber: orderItems.orderNumber,
        orderDate: orderItems.orderDate,
        deadline: orderItems.deadline,
        buildDate: orderItems.buildDate,
        bagSize: orderItems.bagSize,
        boxSize: orderItems.boxSize,
        shopifyLineItemId: orderItems.shopifyLineItemId,
        specifications: orderItems.specifications,
        status: orderItems.status,
        progress: orderItems.progress,
        statusChangeDates: orderItems.statusChangeDates,
        isArchived: orderItems.isArchived,
        archivedReason: orderItems.archivedReason,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.serialNumber, serialNumber),
          eq(orderItems.isArchived, true)
        )
      );
    return item;
  }

  /**
   * Transactie-gebaseerde functie die een item zoekt en bijwerkt, of aanmaakt als het niet bestaat
   * Dit voorkomt race conditions en duplicate key errors
   * @param itemData De data voor het item
   * @param options Optionele parameters voor speciale gevallen
   */
  async findOrCreateOrderItem(
    itemData: InsertOrderItem, 
    options: { allowReactivation?: boolean; forceReactivation?: boolean } = {}
  ): Promise<OrderItem> {
    try {
      // Debug: Log options om te controleren of forceReactivation wordt doorgegeven
      console.log(`DEBUG findOrCreateOrderItem voor ${itemData.serialNumber}:`, 
        JSON.stringify(options),
        `fulfillable? ${itemData.specifications?.fulfillable_quantity}`
      );
      
      // Probeer het item eerst te vinden op basis van het serienummer
      const existingItem = await this.getOrderItemBySerialNumber(itemData.serialNumber);
      
      if (existingItem) {
        // Als het item bestaat, update het
        console.log(`🔍 Item ${itemData.serialNumber} gevonden (ID: ${existingItem.id}), bijwerken in plaats van aanmaken`);
        
        // Als het gearchiveerd is, controleer of we het mogen reactiveren
        if (existingItem.isArchived) {
          // Check voor fulfillable_quantity in specifications
          const hasFulfillableItems = itemData.specifications?.fulfillable_quantity && 
                                     parseInt(itemData.specifications.fulfillable_quantity) > 0;

          // Controleer archiveringsreden om te beslissen of we het item mogen reactiveren
          const archiveReason = existingItem.archivedReason || '';
          
          // Items die handmatig verwijderd zijn of die verwijderd zijn uit Shopify niet reactiveren
          const isManuallyArchived = archiveReason.includes('handmatig') || 
                                   archiveReason.includes('manueel') ||
                                   archiveReason.includes('manual');
                                   
          const isRemovedFromShopify = archiveReason.includes('niet meer aanwezig in Shopify') ||
                                     archiveReason.includes('verwijderd uit Shopify');
          
          // Specifieke uitzonderingen voor bepaalde orderitems zoals Natey Fm4/Gm4 in order 1542
          const orderPrefix = itemData.serialNumber.split('-')[0] + '-' + itemData.serialNumber.split('-')[1];
          const isKnownProblemItem = (orderPrefix === 'SW-1542') && 
                                   existingItem.itemType &&
                                   (existingItem.itemType.includes('Natey Fm4') || 
                                    existingItem.itemType.includes('Natey Gm4'));
          
          // Beslissingsboom voor reactivatie
          const shouldNotReactivate = isManuallyArchived || 
                                    isRemovedFromShopify || 
                                    isKnownProblemItem;
                                    
          // Alleen reactiveren als: 
          // 1. De gebruiker force-reactivation opgeeft OF
          // 2. Het item fulfillable is in Shopify EN het is niet een speciaal geval dat we niet mogen reactiveren
          if (options.forceReactivation === true) {
            // Reactivatie is expliciet geforceerd, ongeacht alle andere condities
            console.log(`🔄 REACTIVATIE van gearchiveerd item ${itemData.serialNumber} omdat reactivatie is GEFORCEERD`);
            
            const updateData: Partial<OrderItem> = {
              ...itemData,
              isArchived: false,
              archivedReason: null
            };
            
            const updatedItem = await this.updateOrderItem(existingItem.id, updateData);
            return updatedItem as OrderItem;
          } 
          else if (hasFulfillableItems && !shouldNotReactivate) {
            // Item is fulfillable én het is niet handmatig gearchiveerd of een bekend probleemitem
            console.log(`🔄 REACTIVATIE van gearchiveerd item ${itemData.serialNumber} omdat het fulfillable is in Shopify (${hasFulfillableItems ? 'JA' : 'NEE'}) en geen bekend probleemitem`);
            
            const updateData: Partial<OrderItem> = {
              ...itemData,
              isArchived: false,
              archivedReason: null
            };
            
            const updatedItem = await this.updateOrderItem(existingItem.id, updateData);
            return updatedItem as OrderItem;
          }
          else if (options.allowReactivation === true && !shouldNotReactivate) {
            // Fallback voor oudere code die nog allowReactivation gebruikt (maar nog steeds beschermd)
            console.log(`🔄 REACTIVATIE van gearchiveerd item ${itemData.serialNumber} via allowReactivation (geen bekend probleemitem)`);
            
            const updateData: Partial<OrderItem> = {
              ...itemData,
              isArchived: false,
              archivedReason: null
            };
            
            const updatedItem = await this.updateOrderItem(existingItem.id, updateData);
            return updatedItem as OrderItem;
          }
          else {
            // Standaard laten we gearchiveerde items met rust
            if (shouldNotReactivate) {
              console.log(`🛡️ Item ${itemData.serialNumber} is bewust gearchiveerd (${isManuallyArchived ? 'handmatig' : ''}${isRemovedFromShopify ? 'verwijderd uit Shopify' : ''}${isKnownProblemItem ? 'bekend probleemitem' : ''}) - NIET reactiveren`);
            } else {
              console.log(`⏭️ Item ${itemData.serialNumber} is gearchiveerd en geen reactivatie-opties opgegeven - NIET reactiveren`);
            }
            
            // Gewoon het bestaande gearchiveerde item teruggeven, geen wijzigingen aanbrengen
            return existingItem;
          }
        } else {
          // Als het item niet gearchiveerd is, alleen metadata bijwerken
          console.log(`📝 Item ${itemData.serialNumber} al actief, alleen metadata bijwerken`);
          
          const updateData: Partial<OrderItem> = {
            itemType: itemData.itemType,
            specifications: itemData.specifications
          };
          
          const updatedItem = await this.updateOrderItem(existingItem.id, updateData);
          return updatedItem as OrderItem;
        }
      } else {
        // Als het item niet bestaat, maak het aan
        console.log(`➕ Item ${itemData.serialNumber} niet gevonden, nieuw item aanmaken`);
        const [newItem] = await db.insert(orderItems).values(itemData).returning();
        return newItem;
      }
    } catch (error) {
      // Als er een fout optreedt, probeer nogmaals het item te vinden
      // Dit is om edge cases met race conditions te voorkomen
      console.error(`❌ Fout bij aanmaken/bijwerken van item ${itemData.serialNumber}:`, error);
      
      // Als dit een duplicate key error is, probeer het item te vinden met extra logging
      if ((error as any)?.code === '23505') {
        console.log(`🔄 Duplicate key error voor ${itemData.serialNumber}, proberen te vinden en bij te werken`);
        const retryItem = await this.getOrderItemBySerialNumber(itemData.serialNumber);
        
        if (retryItem) {
          console.log(`✅ Item ${itemData.serialNumber} alsnog gevonden na duplicate key error`);
          return retryItem;
        }
      }
      
      // Als we het item echt niet kunnen vinden of een andere fout optreedt, geef de fout door
      throw error;
    }
  }

  /**
   * Maak een nieuw order item aan
   * @deprecated Gebruik findOrCreateOrderItem voor betere foutafhandeling
   */
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
  
  /**
   * Delete an order item from the database
   * @param id Order item ID to delete
   * @returns boolean indicating if the delete was successful
   */
  async deleteOrderItem(id: number): Promise<boolean> {
    try {
      // Find production notes related to this item and delete them first
      const itemNotes = await this.getItemProductionNotes(id);
      
      // Delete each production note related to this item
      for (const note of itemNotes) {
        await db
          .delete(productionNotes)
          .where(eq(productionNotes.id, note.id));
      }
      
      // Now delete the order item itself
      const result = await db
        .delete(orderItems)
        .where(eq(orderItems.id, id))
        .returning({ id: orderItems.id });
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting order item ${id}:`, error);
      return false;
    }
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
      
      if (mapping) return mapping;
      
      // Try with "_" in the instrument type (e.g. INNATO_A3)
      console.log(`SEARCH: Trying with underscore pattern match...`);
      [mapping] = await db
        .select()
        .from(moldMappings)
        .where(
          and(
            ilike(moldMappings.instrumentType, `${instrumentType}_%`),
            ilike(moldMappings.tuningNote, tuningNote),
            eq(moldMappings.isActive, true)
          )
        );
      
      if (mapping) {
        console.log(`SEARCH: Found match with underscore: ${mapping.instrumentType}`);
        return mapping;
      }
      
      // Try direct SQL query to find any matching patterns
      console.log(`SEARCH: Final attempt with SQL pattern match...`);
      const result = await pool.query(
        `SELECT * FROM mold_mappings 
         WHERE (instrument_type ILIKE $1 OR instrument_type ILIKE $2)
         AND tuning_note ILIKE $3
         AND is_active = true
         LIMIT 1`,
        [`${instrumentType}%`, `%${instrumentType}%`, tuningNote]
      );
      
      if (result.rows.length > 0) {
        console.log(`SEARCH: Found match with SQL pattern: ${result.rows[0].instrument_type}`);
        return result.rows[0];
      }
      
      return undefined;
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
  
  async getResellerByEmail(email: string): Promise<Reseller | undefined> {
    if (!email) return undefined;
    
    const [reseller] = await db
      .select()
      .from(resellers)
      .where(eq(resellers.email, email));
      
    return reseller;
  }
  
  async detectResellerFromEmail(email: string): Promise<{isReseller: boolean, resellerNickname: string | null}> {
    if (!email) return { isReseller: false, resellerNickname: null };
    
    // Stap 1: Controleer of het e-mailadres direct overeenkomt met een reseller in de database
    const directReseller = await this.getResellerByEmail(email);
    if (directReseller) {
      console.log(`📧 E-mail ${email} komt overeen met reseller ${directReseller.nickname}`);
      return { 
        isReseller: true, 
        resellerNickname: directReseller.nickname 
      };
    }
    
    // Stap 2: Controleer of er orders bestaan met dit e-mailadres die al als reseller zijn gemarkeerd
    const existingOrders = await this.getOrdersByCustomerEmail(email);
    const resellerOrder = existingOrders.find(order => order.isReseller && order.resellerNickname);
    
    if (resellerOrder) {
      console.log(`📧 E-mail ${email} komt overeen met bestaande reseller-order voor ${resellerOrder.resellerNickname}`);
      return { 
        isReseller: true, 
        resellerNickname: resellerOrder.resellerNickname 
      };
    }
    
    // Geen reseller match gevonden
    return { isReseller: false, resellerNickname: null };
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
  
  // Shopify item tracking - voor bijhouden van suffixen en mappings
  async getShopifyTracking(orderId: number): Promise<ShopifyItemTracking | undefined> {
    const [tracking] = await db
      .select()
      .from(shopifyItemTracking)
      .where(eq(shopifyItemTracking.orderId, orderId));
    
    return tracking;
  }
  
  async createShopifyTracking(tracking: InsertShopifyItemTracking): Promise<ShopifyItemTracking> {
    const [newTracking] = await db
      .insert(shopifyItemTracking)
      .values({
        ...tracking,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newTracking;
  }
  
  async updateShopifyTracking(orderId: number, tracking: Partial<ShopifyItemTracking>): Promise<ShopifyItemTracking | undefined> {
    // Eerst kijken of er al tracking bestaat
    const existingTracking = await this.getShopifyTracking(orderId);
    
    if (!existingTracking) {
      // Als er nog geen tracking is, creëer een nieuwe
      return this.createShopifyTracking({
        orderId,
        usedSuffixes: tracking.usedSuffixes || [],
        itemMappings: tracking.itemMappings || []
      });
    }
    
    // Update bestaande tracking
    const [updatedTracking] = await db
      .update(shopifyItemTracking)
      .set({ 
        ...tracking,
        updatedAt: new Date()
      })
      .where(eq(shopifyItemTracking.orderId, orderId))
      .returning();
    
    return updatedTracking;
  }

  // ============================================
  // TIMESHEET MANAGEMENT
  // ============================================

  async getAllTimesheets(): Promise<Timesheet[]> {
    const timesheetList = await db
      .select()
      .from(timesheets)
      .orderBy(desc(timesheets.workDate), desc(timesheets.id));
    
    return timesheetList;
  }

  async getTimesheetById(id: number): Promise<Timesheet | undefined> {
    const [timesheet] = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, id));
    
    return timesheet;
  }

  async createTimesheet(timesheetData: InsertTimesheet): Promise<Timesheet> {
    const [newTimesheet] = await db
      .insert(timesheets)
      .values(timesheetData)
      .returning();
    
    return newTimesheet;
  }

  async updateTimesheet(id: number, updateData: Partial<Timesheet>): Promise<Timesheet | undefined> {
    const [updatedTimesheet] = await db
      .update(timesheets)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(timesheets.id, id))
      .returning();
    
    return updatedTimesheet;
  }

  async deleteTimesheet(id: number): Promise<boolean> {
    const result = await db
      .delete(timesheets)
      .where(eq(timesheets.id, id));
    
    return result.rowCount > 0;
  }

  async getActiveTimers(): Promise<Timesheet[]> {
    const activeTimers = await db
      .select()
      .from(timesheets)
      .where(
        isNull(timesheets.endTime) // Only check for endTime, allow totalTimeMinutes for paused timers
      )
      .orderBy(desc(timesheets.startTime));
    
    return activeTimers;
  }

  async getTimesheetEntries(): Promise<Timesheet[]> {
    const entries = await db
      .select()
      .from(timesheets)
      .where(isNotNull(timesheets.endTime)) // Only completed entries
      .orderBy(desc(timesheets.workDate), desc(timesheets.endTime));
    
    return entries;
  }

  async getPausedTimer(employeeName: string): Promise<Timesheet | undefined> {
    const [pausedTimer] = await db
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeName, employeeName),
          isNotNull(timesheets.endTime), // Has an endTime (paused/stopped)
          isNull(timesheets.workedTimeMinutes) // Not finalized yet, so it's paused
        )
      )
      .orderBy(desc(timesheets.updatedAt))
      .limit(1);
    
    return pausedTimer;
  }

  async getTimesheetSummary(
    employeeName: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    totalHours: number;
    totalEarnings: number;
    totalEntries: number;
    paidHours: number;
    unpaidHours: number;
    paidEarnings: number;
    unpaidEarnings: number;
  }> {
    let query = db
      .select()
      .from(timesheets)
      .where(eq(timesheets.employeeName, employeeName));

    // Add date filters if provided
    if (startDate) {
      query = query.where(
        and(
          eq(timesheets.employeeName, employeeName),
          gte(timesheets.workDate, new Date(startDate))
        )
      );
    }

    if (endDate) {
      const conditions = [eq(timesheets.employeeName, employeeName)];
      if (startDate) {
        conditions.push(gte(timesheets.workDate, new Date(startDate)));
      }
      conditions.push(lte(timesheets.workDate, new Date(endDate)));
      
      query = query.where(and(...conditions));
    }

    const timesheetList = await query;

    // Calculate summary statistics
    let totalMinutes = 0;
    let totalEarnings = 0;
    let paidMinutes = 0;
    let unpaidMinutes = 0;
    let paidEarnings = 0;
    let unpaidEarnings = 0;

    timesheetList.forEach(timesheet => {
      const workedMinutes = timesheet.workedTimeMinutes || 0;
      const earnings = timesheet.totalAmount || 0;

      totalMinutes += workedMinutes;
      totalEarnings += earnings;

      if (timesheet.isPaid) {
        paidMinutes += workedMinutes;
        paidEarnings += earnings;
      } else {
        unpaidMinutes += workedMinutes;
        unpaidEarnings += earnings;
      }
    });

    return {
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      totalEarnings: totalEarnings / 100, // Convert from cents to euros
      totalEntries: timesheetList.length,
      paidHours: Math.round((paidMinutes / 60) * 100) / 100,
      unpaidHours: Math.round((unpaidMinutes / 60) * 100) / 100,
      paidEarnings: paidEarnings / 100,
      unpaidEarnings: unpaidEarnings / 100,
    };
  }
}